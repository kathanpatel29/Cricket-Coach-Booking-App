const Review = require("../models/Review");
const Coach = require("../models/Coach");
const Booking = require("../models/Booking");
const { AppError, catchAsync } = require("../middlewares/errorMiddleware");
const { formatResponse } = require("../utils/responseFormatter");

/**
 * @desc Create a review for a completed session
 * @route POST /api/reviews
 * @access Private/User
 */
exports.createReview = catchAsync(async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  // Verify booking exists and is completed
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.user.toString() !== req.user.id) throw new AppError("Unauthorized to review this booking", 403);
  if (booking.status !== "completed") throw new AppError("Only completed sessions can be reviewed", 400);

  // Ensure review doesn't already exist
  const existingReview = await Review.findOne({ booking: bookingId });
  if (existingReview) throw new AppError("Review already exists for this booking", 400);

  // Create review
  const review = await Review.create({
    user: req.user.id,
    coach: booking.coach,
    booking: bookingId,
    rating,
    comment
  });

  // Update coach ratings
  const coach = await Coach.findById(booking.coach);
  coach.reviews.push(review._id);
  coach.ratings.push(rating);
  coach.averageRating = coach.ratings.reduce((a, b) => a + b) / coach.ratings.length;
  await coach.save();

  res.status(201).json(formatResponse("success", "Review created successfully", { review }));
});

/**
 * @desc Get all reviews for a coach
 * @route GET /api/reviews/coach/:coachId
 * @access Public
 */
exports.getCoachReviews = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const reviews = await Review.find({ coach: req.params.coachId })
    .populate("user", "name")
    .populate("booking", "date")
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Review.countDocuments({ coach: req.params.coachId });

  res.json(formatResponse("success", "Coach reviews retrieved", {
    reviews,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  }));
});

/**
 * @desc Get all reviews created by the logged-in user
 * @route GET /api/user/reviews
 * @access Private/User
 */
exports.getUserReviews = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const reviews = await Review.find({ user: req.user.id })
    .populate("coach", "user specializations")
    .populate({
      path: "booking",
      select: "timeSlot",
      populate: { path: "timeSlot", select: "date startTime" }
    })
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Review.countDocuments({ user: req.user.id });

  res.json(formatResponse("success", "User reviews retrieved", {
    reviews,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  }));
});

/**
 * @desc Update a review
 * @route PUT /api/reviews/:id
 * @access Private/User
 */
exports.updateReview = catchAsync(async (req, res) => {
  const { rating, comment } = req.body;

  const review = await Review.findOne({ _id: req.params.id, user: req.user.id });
  if (!review) throw new AppError("Review not found or unauthorized", 404);

  // Update coach's average rating
  const coach = await Coach.findById(review.coach);
  const ratingIndex = coach.ratings.indexOf(review.rating);
  if (ratingIndex > -1) {
    coach.ratings[ratingIndex] = rating;
    coach.averageRating = coach.ratings.reduce((a, b) => a + b) / coach.ratings.length;
    await coach.save();
  }

  review.rating = rating;
  review.comment = comment;
  await review.save();

  res.json(formatResponse("success", "Review updated successfully", { review }));
});

/**
 * @desc Delete a review
 * @route DELETE /api/reviews/:id
 * @access Private/User
 */
exports.deleteReview = catchAsync(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError("Review not found", 404);
  if (review.user.toString() !== req.user.id) throw new AppError("Unauthorized to delete this review", 403);

  // Update coach ratings
  const coach = await Coach.findById(review.coach);
  coach.reviews = coach.reviews.filter(r => r.toString() !== review._id.toString());
  coach.ratings = coach.ratings.filter(r => r !== review.rating);
  coach.averageRating = coach.ratings.length > 0
    ? coach.ratings.reduce((a, b) => a + b) / coach.ratings.length
    : 0;
  await coach.save();

  // Delete the review
  await review.deleteOne();
  res.json(formatResponse("success", "Review deleted successfully"));
});

/**
 * @desc Get all reviews
 * @route GET /api/reviews
 * @access Private/Admin
 */
exports.getAllReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find()
    .populate("user", "name")
    .populate("coach", "name")
    .sort("-createdAt");

  res.json(formatResponse("success", "All reviews retrieved", { reviews }));
});

/**
 * @desc Get review by ID
 * @route GET /api/admin/reviews/:id
 * @access Private/Admin
 */
exports.getReviewById = catchAsync(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate("user", "name email")
    .populate({
      path: "coach",
      select: "user specializations",
      populate: { path: "user", select: "name email" }
    })
    .populate({
      path: "booking",
      select: "timeSlot status paymentAmount",
      populate: { path: "timeSlot", select: "date startTime duration" }
    });

  if (!review) throw new AppError("Review not found", 404);

  res.json(formatResponse("success", "Review details retrieved", { review }));
});

/**
 * @desc Moderate a review (approve/reject)
 * @route PUT /api/admin/reviews/:id/moderate
 * @access Private/Admin
 */
exports.moderateReview = catchAsync(async (req, res) => {
  const { status, moderationNotes } = req.body;
  
  if (!["approved", "rejected"].includes(status)) {
    throw new AppError("Invalid moderation status", 400);
  }
  
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError("Review not found", 404);
  
  review.status = status;
  review.moderationNotes = moderationNotes;
  review.moderatedBy = req.user.id;
  review.moderatedAt = new Date();
  
  await review.save();
  
  // If review is rejected, update coach ratings
  if (status === "rejected") {
    const coach = await Coach.findById(review.coach);
    if (coach) {
      // Remove this review from coach's ratings
      coach.reviews = coach.reviews.filter(r => r.toString() !== review._id.toString());
      coach.ratings = coach.ratings.filter((_, i) => coach.reviews[i]?.toString() !== review._id.toString());
      
      // Recalculate average rating
      coach.averageRating = coach.ratings.length > 0
        ? coach.ratings.reduce((a, b) => a + b) / coach.ratings.length
        : 0;
        
      await coach.save();
    }
  }
  
  res.json(formatResponse("success", "Review moderated successfully", { review }));
});
