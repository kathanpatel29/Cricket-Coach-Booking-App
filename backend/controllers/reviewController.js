const Review = require("../models/Review");
const Coach = require("../models/Coach");

exports.createReview = async (req, res) => {
  try {
    const { coachId, rating, comment } = req.body;
    const coach = await Coach.findById(coachId);
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }
    const review = await Review.create({
      client: req.user.id,
      coach: coachId,
      rating,
      comment,
    });
    coach.reviews.push(review._id);
    coach.ratings.push(rating);
    coach.averageRating = coach.ratings.reduce((a, b) => a + b) / coach.ratings.length;
    await coach.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCoachReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ coach: req.params.coachId }).populate("client", "name");
    res.json(reviews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
