const mongoose = require("mongoose");

const coachSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  specializations: { type: [String], enum: ["batting", "bowling", "fielding", "wicket-keeping"], required: true },
  experience: { type: Number, required: true, min: 0 },
  hourlyRate: { type: Number, required: true, min: 0 },
  bio: { type: String, required: true, minlength: 10, maxlength: 1000 },
  certifications: { type: String },
  profileImage: { type: String },
  totalEarnings: { type: Number, default: 0, min: 0 },
  totalSessions: { type: Number, default: 0, min: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// Virtual for total reviews count
coachSchema.virtual("totalReviews").get(function() {
  return this.reviews.length;
});

// Method to check availability
coachSchema.methods.isAvailableForBooking = async function(date, timeSlot) {
  const existingBooking = await mongoose.model("TimeSlot").findOne({ coach: this._id, date: new Date(date), startTime: timeSlot, status: "booked" });
  return !existingBooking;
};

const Coach = mongoose.model("Coach", coachSchema);
module.exports = Coach;
