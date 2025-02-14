const Review = require("../models/Review");
const Coach = require("../models/Coach");
const Booking = require("../models/Booking");
const { AppError, catchAsync } = require("../utils/errorHandler");
const { successResponse, formatResponse } = require("../utils/responseFormatter");

exports.createReview = catchAsync(async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  // Verify booking exists and is completed
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.client.toString() !== req.user.id) {
    throw new AppError("Unauthorized to review this booking", 403);
  }

  if (booking.status !== 'completed') {
    throw new AppError("Can only review completed sessions", 400);
  }

  // Check if review already exists
  const existingReview = await Review.findOne({ booking: bookingId });
  if (existingReview) {
    throw new AppError("Review already exists for this booking", 400);
  }

  // Create review
  const review = await Review.create({
    client: req.user.id,
    coach: booking.coach,
    booking: bookingId,
    rating,
    comment
  });

  // Update coach ratings
  const coach = await Coach.findById(booking.coach);
  coach.reviews.push(review._id);
  coach.ratings.push(rating);
  coach.averageRating = 
    coach.ratings.reduce((a, b) => a + b) / coach.ratings.length;
  await coach.save();

  successResponse(res, 201, review, "Review created successfully");
});

exports.getCoachReviews = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
  
  const reviews = await Review.find({ coach: req.params.coachId })
    .populate('client', 'name')
    .populate('booking', 'date')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Review.countDocuments({ coach: req.params.coachId });

  successResponse(res, 200, {
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

exports.updateReview = catchAsync(async (req, res) => {
  const { rating, comment } = req.body;
  
  const review = await Review.findOne({
    _id: req.params.id,
    client: req.user.id
  });

  if (!review) {
    throw new AppError("Review not found or unauthorized", 404);
  }

  // Update coach's average rating
  const coach = await Coach.findById(review.coach);
  const ratingIndex = coach.ratings.indexOf(review.rating);
  if (ratingIndex > -1) {
    coach.ratings[ratingIndex] = rating;
    coach.averageRating = 
      coach.ratings.reduce((a, b) => a + b) / coach.ratings.length;
    await coach.save();
  }

  review.rating = rating;
  review.comment = comment;
  await review.save();

  successResponse(res, 200, review, "Review updated successfully");
});

exports.deleteReview = catchAsync(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    throw new AppError("Review not found", 404);
  }

  // Update coach ratings
  const coach = await Coach.findById(review.coach);
  coach.reviews = coach.reviews.filter(r => r.toString() !== review._id.toString());
  coach.ratings = coach.ratings.filter(r => r !== review.rating);
  coach.averageRating = coach.ratings.length > 0
    ? coach.ratings.reduce((a, b) => a + b) / coach.ratings.length
    : 0;
  await coach.save();

  await review.remove();
  successResponse(res, 200, null, "Review deleted successfully");
});

// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('client', 'name')
      .populate('coach', 'name')
      .sort('-createdAt');

    res.json(formatResponse('success', 'Reviews retrieved successfully', { reviews }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get review by ID
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('client', 'name')
      .populate('coach', 'name');

    if (!review) {
      return res.status(404).json(formatResponse('error', 'Review not found'));
    }

    res.json(formatResponse('success', 'Review retrieved successfully', { review }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Moderate review (admin only)
exports.moderateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json(formatResponse('error', 'Review not found'));
    }

    review.isModerated = true;
    review.moderationStatus = req.body.status; // 'approved' or 'rejected'
    review.moderationComment = req.body.comment;

    if (req.body.status === 'rejected') {
      review.isVisible = false;
    }

    await review.save();
    res.json(formatResponse('success', 'Review moderated successfully', { review }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};