const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/', coachController.getAllCoaches);
router.get('/:id/public', coachController.getCoachPublicProfile);

// Protected coach routes
router.use(protect, authorize('coach'));

// Dashboard
router.get('/dashboard/stats', coachController.getDashboardStats);

// Profile
router.get('/profile', coachController.getProfile);
router.put('/profile', coachController.updateProfile);

// Schedule
router.get('/schedule', coachController.getSchedule);
router.put('/schedule', coachController.updateSchedule);

// Availability
router.post('/availability', protect, authorize('coach'), coachController.addAvailability);
router.get('/availability', protect, authorize('coach'), coachController.getAvailability);
router.delete('/availability/:id', protect, authorize('coach'), coachController.deleteAvailability);

// Emergency off
router.get('/emergency-off', coachController.getEmergencyOff);
router.post('/emergency-off', coachController.setEmergencyOff);

module.exports = router;// Add these routes to your existing coachRoutes.js