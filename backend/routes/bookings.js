const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { protect, client, coach } = require("../middleware/authMiddleware");
const { validate, bookingValidation } = require('../middleware/validationMiddleware');

// Public routes
router.get("/slots/:coachId", bookingController.getAvailableSlots);

// Protected routes
router.use(protect);

// Client booking routes
router.get("/client", client, bookingController.getClientBookings);
router.post("/", client, validate(bookingValidation), bookingController.createBooking);
router.patch("/reschedule/:id", client, bookingController.rescheduleBooking);
router.patch("/cancel/:id", client, bookingController.cancelBooking);

// Coach booking routes
router.get("/coach", coach, bookingController.getCoachBookings);
router.patch("/:id/status", coach, bookingController.updateBookingStatus);

// Shared route: Get booking details by ID
router.get("/:id", bookingController.getBookingById);

module.exports = router;
