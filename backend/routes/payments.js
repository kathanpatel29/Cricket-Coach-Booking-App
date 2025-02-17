const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  refundPayment,
  getCoachEarnings,
  requestRefund,
  getAllPayments,
  processRefund
} = require("../controllers/paymentController");

// Protected routes
router.post("/create-payment-intent/:bookingId", protect, createPaymentIntent);
router.post("/confirm-payment/:bookingId", protect, confirmPayment);
router.get("/history", protect, getPaymentHistory);
router.post("/refund", protect, refundPayment);
router.get("/earnings", protect, getCoachEarnings);
router.post("/request-refund/:paymentId", protect, requestRefund);
router.get("/all", protect, getAllPayments);
router.post("/process-refund/:paymentId", protect, processRefund);

module.exports = router;