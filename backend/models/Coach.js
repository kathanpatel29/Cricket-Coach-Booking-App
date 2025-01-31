const mongoose = require("mongoose")

const coachSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  hourlyRate: { type: Number, required: true },
  bio: { type: String, required: true },
  availability: [{ type: Date }],
  ratings: [{ type: Number }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  averageRating: { type: Number, default: 0 },
})

module.exports = mongoose.model("Coach", coachSchema)

