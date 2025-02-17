const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', coachController.getAllCoaches);
router.get('/:id', coachController.getCoachById);
router.get('/:id/public', coachController.getCoachPublicProfile);

// Protected coach routes
router.use(protect);
router.use(authorize('coach'));

// Dashboard
router.get('/dashboard/stats', coachController.getDashboardStats);

// Profile
router.get('/profile', coachController.getProfile);
router.put('/profile', coachController.updateProfile);

// Schedule
router.get('/schedule', coachController.getSchedule);
router.put('/schedule', coachController.updateSchedule);

// Availability
router.get('/availability', coachController.getAvailability);
router.put('/availability', coachController.updateAvailability);

// Emergency off
router.get('/emergency-off', coachController.getEmergencyOff);
router.post('/emergency-off', coachController.setEmergencyOff);
router.delete('/emergency-off/:date', coachController.removeEmergencyOff);

// Bookings
router.get('/bookings', coachController.getBookings);
router.put('/bookings/:id/status', coachController.updateBookingStatus);

// Stats
router.get('/stats', coachController.getCoachStats);
router.get('/earnings', coachController.getCoachEarnings);
router.get('/reviews', coachController.getCoachReviews);

module.exports = router;