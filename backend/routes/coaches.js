const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { protect, admin, coach } = require('../middleware/authMiddleware');

// Protected coach routes
router.get('/sessions', protect, coach, coachController.getCoachSessions);

// Availability routes
router.get('/availability', protect, coach, coachController.getAvailability);
router.put('/availability', protect, coach, coachController.updateAvailability);
router.delete('/availability/:dateId/slots/:slotId', protect, coach, coachController.deleteTimeSlot);

// Emergency off routes
router.get('/emergency-off', protect, coach, coachController.getEmergencyOff);
router.post('/emergency-off', protect, coach, coachController.setEmergencyOff);

// Profile routes
router.get('/profile', protect, coach, coachController.getCoachProfile);
router.post('/profile', protect, coach, coachController.createCoachProfile);
router.put('/profile', protect, coach, coachController.updateCoachProfile);

// Booking routes
router.get('/bookings', protect, coach, coachController.getCoachBookings);
router.patch('/bookings/:bookingId', protect, coach, coachController.updateBookingStatus);

// Stats and analytics routes
router.get('/dashboard/stats', protect, coach, coachController.getDashboardStats);
router.get('/stats', protect, coach, coachController.getCoachStats);
router.get('/earnings', protect, coach, coachController.getCoachEarnings);
router.get('/reviews', protect, coach, coachController.getCoachReviews);

// Public routes
router.get('/', coachController.getAllCoaches);
router.get('/:id/public', coachController.getCoachPublicProfile);
router.get('/:id', coachController.getCoachById);

// Admin routes
router.put('/:id/approve', protect, admin, coachController.approveCoach);
router.put('/:id/reject', protect, admin, coachController.rejectCoach);

module.exports = router;