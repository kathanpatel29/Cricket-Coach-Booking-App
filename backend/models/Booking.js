const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coach: { type: mongoose.Schema.Types.ObjectId, ref: "Coach", required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true },
  status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Booking", bookingSchema)

