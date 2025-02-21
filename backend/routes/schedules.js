const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkCoachApproval } = require('../middleware/coachMiddleware');

router.use(protect);

// Public routes for viewing available time slots
router.get('/time-slots', scheduleController.getAvailableTimeSlots);

// Coach-only routes
router.use(authorize('coach'));

router.route('/weekly')
  .get(scheduleController.getWeeklySchedule)
  .put(checkCoachApproval, scheduleController.updateWeeklySchedule);

// Time slots management
router.post('/time-slots', checkCoachApproval, scheduleController.createTimeSlot);
router.delete('/time-slots/:id', checkCoachApproval, scheduleController.deleteTimeSlot);

module.exports = router; 