const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: "cad" },
  status: { type: String, enum: ["pending", "succeeded", "failed", "refunded"], default: "pending" },
  stripePaymentIntentId: { type: String, required: true },
  stripeUserSecret: { type: String, required: true },
  refundDetails: {
    amount: Number,
    reason: String,
    date: Date,
    stripeRefundId: String
  }
}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
