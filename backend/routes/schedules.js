const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('coach'));

router.route('/weekly')
  .get(scheduleController.getWeeklySchedule)
  .put(scheduleController.updateWeeklySchedule);

router.get('/time-slots', scheduleController.getAvailableTimeSlots);

module.exports = router; 