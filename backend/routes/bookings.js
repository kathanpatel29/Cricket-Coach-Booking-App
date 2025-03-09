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

// Routes for all authenticated users
router.post('/', validate(bookingValidation), bookingController.createBooking);
router.get('/:id', bookingController.getBookingById);

// User-specific routes
router.get('/user/bookings', authorize('user'), bookingController.getUserBookings);
router.put('/:id/cancel', authorize('user'), bookingController.cancelBooking);

// Coach-specific routes
router.get('/coach/bookings', authorize('coach'), bookingController.getCoachBookings);
router.put('/:id/confirm', authorize('coach'), bookingController.confirmBooking);
router.put('/:id/reschedule', authorize('coach'), bookingController.rescheduleBooking);

// Admin routes
router.get("/admin/all", authorize("admin"), adminController.getAllBookings);

module.exports = router;
