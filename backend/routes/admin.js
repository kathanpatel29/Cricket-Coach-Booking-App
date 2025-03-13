const express = require("express");
const { getProfile } = require("../controllers/authController");
const { getAllUsers, getUserById, deleteUser, searchUsers } = require("../controllers/userController");
const { getPendingCoaches, approveCoach, rejectCoach, getCoachApprovalHistory } = require("../controllers/coachApprovalController");
const { getBookingById, updateBookingStatus } = require("../controllers/bookingController");
const { getAllBookings, getAllPayments, getPaymentById, updatePaymentStatus, getAdminDashboard } = require("../controllers/adminController");
const { getAllReviews, getReviewById, moderateReview } = require("../controllers/reviewController");
const { generateReports, getReportById } = require("../controllers/reportController");
const { getNotifications, markNotificationsAsRead, deleteNotification } = require("../controllers/notificationController");
const { authMiddleware, roleMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

// Admin profile routes
router.get("/profile", getProfile);
router.get("/dashboard", getAdminDashboard);

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.delete("/users/:id", deleteUser);
router.get("/users/search", searchUsers);

// Coach approval routes
router.get("/coaches/pending", getPendingCoaches);
router.put("/coaches/:id/approve", approveCoach);
router.put("/coaches/:id/reject", rejectCoach);
router.get("/coaches/approval-history", getCoachApprovalHistory);

// Booking management routes
router.get("/bookings", getAllBookings);
router.get("/bookings/:id", getBookingById);
router.put("/bookings/:id/status", updateBookingStatus);

// Payment management routes
router.get("/payments", getAllPayments);
router.get("/payments/:id", getPaymentById);
router.put("/payments/:id/status", updatePaymentStatus);

// Review moderation routes
router.get("/reviews", getAllReviews);
router.get("/reviews/:id", getReviewById);
router.put("/reviews/:id/moderate", moderateReview);

// Reports routes
router.get("/reports/generate", generateReports);
router.get("/reports/:id", getReportById);

// Admin notifications routes
router.get("/notifications", getNotifications);
router.patch("/notifications/read", markNotificationsAsRead);
router.delete("/notifications/:id", deleteNotification);

module.exports = router;
