const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coach: { type: mongoose.Schema.Types.ObjectId, ref: "Coach", required: true },
  timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot", required: true },
  status: { 
    type: String, 
    enum: [
      "pending_approval", // Initial state - awaiting coach approval
      "approved",        // Coach approved, awaiting payment
      "pending",         // Legacy pending status
      "confirmed",       // Payment completed, booking confirmed
      "completed",       // Session has occurred
      "rejected",        // Coach rejected the booking
      "cancelled",       // User cancelled the booking
      "no-show"          // User didn't attend
    ], 
    default: "pending_approval" 
  },
  paymentStatus: { 
    type: String, 
    enum: [
      "awaiting_approval", // Initial state - no payment required yet
      "awaiting_payment",  // Coach approved, payment needed 
      "pending",           // Legacy pending status
      "paid",              // Payment completed
      "refunded",          // Payment was refunded
      "failed"             // Payment failed
    ], 
    default: "awaiting_approval" 
  },
  paymentAmount: { type: Number, required: true },
  cancellationReason: String,
  meetingLink: String,
  notes: String,
  approvalDate: Date,
  paymentDate: Date,
  rejectionReason: String
}, { timestamps: true });

bookingSchema.virtual("platformFee").get(function() {
  return this.paymentAmount * 0.10;
});

bookingSchema.virtual("coachEarnings").get(function() {
  return this.paymentAmount * 0.90;
});

// Pre-save middleware to set dates automatically
bookingSchema.pre('save', function(next) {
  // When status changes to approved, set approvalDate
  if (this.isModified('status') && this.status === 'approved' && !this.approvalDate) {
    this.approvalDate = new Date();
  }
  
  // When paymentStatus changes to paid, set paymentDate
  if (this.isModified('paymentStatus') && this.paymentStatus === 'paid' && !this.paymentDate) {
    this.paymentDate = new Date();
  }
  
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
