const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect, client, coach, admin } = require("../middleware/authMiddleware");

// All payment routes require authentication
router.use(protect);

// Client payment routes
router.post(
  "/create-intent/:bookingId",
  client,
  paymentController.createPaymentIntent
);
router.get(
  "/history",
  client,
  paymentController.getPaymentHistory
);
router.post(
  "/:paymentId/refund",
  client,
  paymentController.requestRefund
);

// Coach payment routes
router.get(
  "/earnings",
  coach,
  paymentController.getCoachEarnings
);

// Admin payment routes
router.get(
  "/all",
  admin,
  paymentController.getAllPayments
);
router.post(
  "/refund/:paymentId",
  admin,
  paymentController.processRefund
);

// Stripe webhook - no auth required
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleStripeWebhook
);

module.exports = router;