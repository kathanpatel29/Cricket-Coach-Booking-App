const express = require("express");
const { getProfile } = require("../controllers/authController");
const { updateUserProfile, getUserDashboardStats, addToFavorites, removeFromFavorites, getFavoriteCoaches } = require("../controllers/userController");
const { createBooking, getUserBookings, cancelBooking, getBookingById, processPayment } = require("../controllers/bookingController");
const { createPaymentIntent, getPaymentHistory, confirmPayment } = require("../controllers/paymentController");
const { createReview, getUserReviews } = require("../controllers/reviewController");
const { getNotifications, markNotificationsAsRead, deleteNotification } = require("../controllers/notificationController");
const { authMiddleware, roleMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply auth middleware to all user routes
router.use(authMiddleware);
router.use(roleMiddleware("user"));

// User profile routes
router.get("/profile", getProfile);
router.put("/profile", updateUserProfile);
router.get("/dashboard", getUserDashboardStats);

// User bookings routes
router.post("/bookings", createBooking);
router.get("/bookings", getUserBookings);
router.get("/bookings/:id", getBookingById);
router.put("/bookings/:id/cancel", cancelBooking);

// New route for processing payment after coach approval
router.post("/bookings/:bookingId/payment", processPayment);

// User favorites routes
router.get("/favorites", getFavoriteCoaches);
router.post("/favorites/:coachId", addToFavorites);
router.delete("/favorites/:coachId", removeFromFavorites);

// User payments routes
router.post("/payments/intent/:bookingId", createPaymentIntent);
router.post("/payments/confirm/:bookingId", confirmPayment);
router.get("/payments/history", getPaymentHistory);

// User reviews routes
router.post("/reviews", createReview);
router.get("/reviews", getUserReviews);

// User notifications routes
router.get("/notifications", getNotifications);
router.patch("/notifications/read", markNotificationsAsRead);
router.delete("/notifications/:id", deleteNotification);

module.exports = router; 