const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validate, bookingValidation } = require('../middleware/validationMiddleware');
const adminController = require("../controllers/adminController");
// Public routes
router.get("/slots/:coachId", bookingController.getAvailableSlots);

// Protected routes
router.use(protect);

// Client routes
router.get("/client", authorize("client"), bookingController.getClientBookings);
router.post("/", authorize("client"), validate(bookingValidation), bookingController.createBooking);
router.post("/:id/cancel", authorize("client"), bookingController.cancelBooking);

// Coach routes
router.get("/coach", authorize("coach"), bookingController.getCoachBookings);
router.patch("/:id/status", authorize("coach"), bookingController.updateBookingStatus);

// Admin routes
router.get("/", authorize("admin"), adminController.getAllBookings);
router.get("/:id", authorize("admin"), bookingController.getBookingById);

module.exports = router;
