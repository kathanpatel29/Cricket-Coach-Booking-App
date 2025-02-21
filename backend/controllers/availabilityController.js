const Schedule = require('../models/Schedule');
const TimeSlot = require('../models/TimeSlot');
const Coach = require('../models/Coach');
const { AppError, catchAsync } = require('../utils/errorHandler');
const { startOfWeek, endOfWeek, addDays, format, parseISO } = require('date-fns');

// Get coach availability for a date range
exports.getAvailability = catchAsync(async (req, res) => {
  const { coachId, startDate, endDate } = req.query;
  
  const coach = await Coach.findById(coachId)
    .populate('user', 'isApproved')
    .populate('schedule');
    
  if (!coach || !coach.user?.isApproved) {
    throw new AppError('Coach not found or not approved', 404);
  }

  const start = startDate ? new Date(startDate) : startOfWeek(new Date());
  const end = endDate ? new Date(endDate) : endOfWeek(start);

  // Get all available time slots in date range
  const availableSlots = await TimeSlot.find({
    coach: coachId,
    date: { $gte: start, $lte: end },
    status: 'available'
  }).sort({ date: 1, startTime: 1 });

  // Group slots by date
  const groupedSlots = availableSlots.reduce((acc, slot) => {
    const dateKey = format(slot.date, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {});

  res.json({
    status: 'success',
    data: {
      schedule: coach.schedule,
      availability: groupedSlots
    }
  });
});

// Update coach availability settings
exports.updateAvailabilitySettings = catchAsync(async (req, res) => {
  const { defaultDuration, bookingCutoffHours, breakBetweenSlots } = req.body;
  
  const coach = await Coach.findOne({ user: req.user._id });
  if (!coach) {
    throw new AppError('Coach profile not found', 404);
  }

  let schedule = await Schedule.findOne({ coach: coach._id });
  if (!schedule) {
    schedule = new Schedule({ coach: coach._id });
  }

  // Update settings
  if (defaultDuration) schedule.defaultDuration = defaultDuration;
  if (bookingCutoffHours) schedule.bookingCutoffHours = bookingCutoffHours;
  if (breakBetweenSlots) schedule.breakBetweenSlots = breakBetweenSlots;

  await schedule.save();

  res.json({
    status: 'success',
    data: {
      schedule
    }
  });
});

// Block time slots for a specific date
exports.blockTimeSlots = catchAsync(async (req, res) => {
  const { date, reason } = req.body;
  
  const coach = await Coach.findOne({ user: req.user._id });
  if (!coach) {
    throw new AppError('Coach profile not found', 404);
  }

  // Find all available slots for the date
  const slots = await TimeSlot.find({
    coach: coach._id,
    date: new Date(date),
    status: 'available'
  });

  // Block all slots
  await TimeSlot.updateMany(
    {
      _id: { $in: slots.map(slot => slot._id) }
    },
    {
      status: 'cancelled',
      cancellationReason: reason || 'Blocked by coach'
    }
  );

  res.json({
    status: 'success',
    message: `Blocked ${slots.length} time slots for ${date}`
  });
});

module.exports = exports; 