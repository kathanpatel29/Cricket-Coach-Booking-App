const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coach: { type: mongoose.Schema.Types.ObjectId, ref: "Coach", required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
