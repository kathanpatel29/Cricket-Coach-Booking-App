const Schedule = require('../models/Schedule');
const TimeSlot = require('../models/TimeSlot');
const { catchAsync } = require('../utils/errorHandler');
const { startOfWeek, addDays, format } = require('date-fns');

exports.updateWeeklySchedule = catchAsync(async (req, res) => {
  const { weeklySchedule, timezone } = req.body;
  
  let schedule = await Schedule.findOne({ coach: req.user.id });
  
  if (!schedule) {
    schedule = new Schedule({
      coach: req.user.id,
      weeklySchedule,
      timezone
    });
  } else {
    schedule.weeklySchedule = weeklySchedule;
    schedule.timezone = timezone;
  }
  
  await schedule.save();
  
  // Generate time slots for the next 4 weeks
  const startDate = startOfWeek(new Date());
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  for (let week = 0; week < 4; week++) {
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = addDays(startDate, dayIndex + week * 7);
      const dayName = days[dayIndex];
      const daySchedule = weeklySchedule[dayName];
      
      if (daySchedule && daySchedule.length > 0) {
        for (const slot of daySchedule) {
          await TimeSlot.create({
            coach: req.user.id,
            date: currentDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: 60, // Default duration
            status: 'available'
          });
        }
      }
    }
  }
  
  res.status(200).json({
    status: 'success',
    data: schedule
  });
});

exports.getWeeklySchedule = catchAsync(async (req, res) => {
  const schedule = await Schedule.findOne({ coach: req.user.id });
  
  res.status(200).json({
    status: 'success',
    data: schedule || { weeklySchedule: {}, timezone: 'UTC' }
  });
});

exports.getAvailableTimeSlots = catchAsync(async (req, res) => {
  const { date, coachId } = req.query;
  
  const timeSlots = await TimeSlot.find({
    coach: coachId,
    date: new Date(date),
    status: 'available'
  }).sort('startTime');
  
  res.status(200).json({
    status: 'success',
    data: timeSlots
  });
}); 