const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkCoachApproval } = require('../middleware/coachMiddleware');

// Public routes
router.get('/', coachController.getAllCoaches);
router.get('/:id/public', coachController.getCoachPublicProfile);

// Protected coach routes
router.use(protect, authorize('coach'));

// Availability Settings
router.get('/settings/availability', coachController.getAvailabilitySettings);
router.put('/settings/availability', checkCoachApproval, coachController.updateAvailabilitySettings);

// Schedule and Availability
router.get('/schedule', coachController.getSchedule);
router.put('/schedule', checkCoachApproval, coachController.updateSchedule);
router.get('/availability', coachController.getAvailability);
router.post('/availability', checkCoachApproval, coachController.addAvailability);
router.delete('/availability/:id', checkCoachApproval, coachController.deleteAvailability);

// Session Management
router.get('/sessions', coachController.getCoachSessions);
router.put('/sessions/:id', coachController.updateSessionStatus);

// Emergency off
router.get('/emergency-off', coachController.getEmergencyOff);
router.post('/emergency-off', coachController.setEmergencyOff);

// Dashboard
router.get('/dashboard/stats', coachController.getDashboardStats);

// Profile
router.get('/profile', coachController.getProfile);
router.put('/profile', coachController.updateProfile);

module.exports = router;