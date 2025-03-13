const express = require("express");
const { getProfile } = require("../controllers/authController");
const { getCoachProfile, updateCoachProfile, getCoachDashboardStats, getCoachAvailability, updateCoachAvailability, createTimeSlot, getTimeSlots, deleteTimeSlot, updateTimeSlot, syncApprovalStatus } = require("../controllers/coachController");
const { getCoachBookings, approveBooking, rejectBooking, completeBooking } = require("../controllers/bookingController");
const { getCoachPayments } = require("../controllers/paymentController");
const { getCoachReviews } = require("../controllers/reviewController");
const { getNotifications, markNotificationsAsRead, deleteNotification } = require("../controllers/notificationController");
const { authMiddleware, roleMiddleware, contentRestrictionMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply auth middleware to all coach routes
router.use(authMiddleware);
router.use(roleMiddleware("coach"));

// Routes that don't require approval
router.get("/profile", getCoachProfile);
router.post("/sync-approval", syncApprovalStatus);

// Apply content restriction middleware to routes that require coach approval
router.use(contentRestrictionMiddleware); 

// Coach profile routes
router.put("/profile", updateCoachProfile);
router.get("/dashboard", getCoachDashboardStats);

// Coach availability and schedule routes
router.get("/availability", getCoachAvailability);
router.put("/availability", updateCoachAvailability);

// Coach time slots management
router.post("/time-slots", createTimeSlot);
router.get("/time-slots", getTimeSlots);
router.patch("/time-slots/:id", updateTimeSlot);
router.delete("/time-slots/:id", deleteTimeSlot);

// Coach bookings routes
router.get("/bookings", getCoachBookings);
router.put("/bookings/:bookingId/approve", approveBooking);
router.put("/bookings/:bookingId/reject", rejectBooking);
router.put("/bookings/:id/complete", completeBooking);

// Coach payments routes
router.get("/payments", getCoachPayments);

// Coach reviews routes
router.get("/reviews", getCoachReviews);

// Coach notifications routes
router.get("/notifications", getNotifications);
router.patch("/notifications/read", markNotificationsAsRead);
router.delete("/notifications/:id", deleteNotification);

module.exports = router; 