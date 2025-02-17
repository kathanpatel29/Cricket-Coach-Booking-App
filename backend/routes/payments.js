const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const paymentController = require("../controllers/paymentController");

// Protected routes
router.post("/create-payment-intent/:bookingId", protect, paymentController.createPaymentIntent);
router.post("/confirm-payment/:bookingId", protect, paymentController.confirmPayment);
router.get("/history", protect, paymentController.getPaymentHistory);
router.post("/refund", protect, paymentController.refundPayment);
router.get("/earnings", protect, paymentController.getCoachEarnings);
router.post("/request-refund/:paymentId", protect, paymentController.requestRefund);
router.get("/all", protect, paymentController.getAllPayments);
router.post("/process-refund/:paymentId", protect, paymentController.processRefund);

module.exports = router;