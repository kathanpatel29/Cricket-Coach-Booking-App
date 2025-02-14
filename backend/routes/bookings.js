const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { protect, client, coach } = require("../middleware/authMiddleware");
const { validate, bookingValidation } = require('../middleware/validationMiddleware');

// ✅ All booking routes require authentication
router.use(protect);

// Client booking routes
router.get("/client", client, bookingController.getClientBookings);
router.post("/", client, bookingController.createBooking);
router.patch("/reschedule/:id", client, bookingController.rescheduleBooking);
router.patch("/cancel/:id", client, bookingController.cancelBooking);

// Coach booking routes
router.get("/coach", coach, bookingController.getCoachBookings);
router.patch("/:id/status", coach, bookingController.updateBookingStatus);
router.get("/availability/:coachId", bookingController.getCoachAvailability);

// Shared route: Get booking details by ID
router.get("/:id", bookingController.getBookingById);

module.exports = router;
