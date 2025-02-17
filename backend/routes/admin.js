const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);
router.get('/dashboard/stats', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Coach Management
router.get('/coaches/pending', adminController.getPendingCoaches);
router.post('/coaches/:id/approve', adminController.approveCoach);
router.post('/coaches/:id/reject', adminController.rejectCoach);

// Booking Management
router.get('/bookings', adminController.getAllBookings);
router.put('/bookings/:id', adminController.updateBooking);

// Reports
router.get('/reports/users', adminController.getUserStats);
router.get('/reports/bookings', adminController.getBookingStats);
router.get('/reports/revenue', adminController.getRevenueStats);
router.get('/reports/coach-performance', adminController.getCoachPerformance);

// Review Moderation
router.get('/reviews/pending', adminController.getPendingReviews);
router.put('/reviews/:id/moderate', adminController.moderateReview);

// Export Data
router.get('/export/users', adminController.exportUsers);
router.get('/export/bookings', adminController.exportBookings);
router.get('/export/revenue', adminController.exportRevenue);

module.exports = router;
