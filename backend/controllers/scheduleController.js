const Schedule = require('../models/Schedule');
const TimeSlot = require('../models/TimeSlot');
const Coach = require('../models/Coach');
const { AppError, catchAsync } = require('../utils/errorHandler');
const { startOfWeek, addDays, format, startOfDay, endOfDay, parseISO } = require('date-fns');

// Generate time slots for the next 4 weeks
const generateTimeSlots = async (coach, weeklySchedule) => {
  const startDate = startOfWeek(new Date());
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const bulkOps = [];

  for (let week = 0; week < 4; week++) {
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = addDays(startDate, dayIndex + week * 7);
      const dayName = days[dayIndex];
      const daySchedule = weeklySchedule[dayName];
      
      if (daySchedule?.length > 0) {
        for (const slot of daySchedule) {
          bulkOps.push({
            insertOne: {
              document: {
                coach: coach._id,
                date: currentDate,
                startTime: slot.startTime,
                endTime: slot.endTime,
                duration: 60,
                status: 'available',
                bookingCutoffHours: coach.availabilitySettings?.bookingCutoffHours || 12
              }
            }
          });
        }
      }
    }
  }

  if (bulkOps.length > 0) {
    await TimeSlot.bulkWrite(bulkOps);
  }
};

exports.updateWeeklySchedule = catchAsync(async (req, res) => {
  const { weeklySchedule } = req.body;
  
  const coach = await Coach.findOne({ user: req.user._id });
  if (!coach) {
    throw new AppError('Coach profile not found', 404);
  }

  let schedule = await Schedule.findOne({ coach: coach._id });
  
  if (!schedule) {
    schedule = new Schedule({
      coach: coach._id,
      weeklySchedule
    });
  } else {
    schedule.weeklySchedule = weeklySchedule;
  }

  await schedule.save();
  
  // Generate time slots using the helper function
  await generateTimeSlots(coach, weeklySchedule);
  
  res.status(200).json({
    status: 'success',
    data: schedule
  });
});

exports.getWeeklySchedule = catchAsync(async (req, res) => {
  const coach = await Coach.findOne({ user: req.user._id });
  if (!coach) {
    throw new AppError('Coach profile not found', 404);
  }

  const schedule = await Schedule.findOne({ coach: coach._id });

  res.status(200).json({
    status: 'success',
    data: {
      schedule: schedule?.weeklySchedule || {}
    }
  });
});

exports.getAvailableTimeSlots = catchAsync(async (req, res) => {
  const { date, coachId } = req.query;
  
  // Validate date
  const searchDate = date ? new Date(date) : new Date();
  
  // Find available time slots
  const timeSlots = await TimeSlot.find({
    coach: coachId,
    date: {
      $gte: startOfDay(searchDate),
      $lte: endOfDay(searchDate)
    },
    status: 'available'
  }).sort('startTime');

  // Get coach's booking cutoff hours
  const coach = await Coach.findById(coachId);
  const cutoffHours = coach?.availabilitySettings?.bookingCutoffHours || 12;

  // Filter out slots that are past the booking cutoff
  const now = new Date();
  const availableSlots = timeSlots.filter(slot => {
    const slotDateTime = parseISO(`${format(slot.date, 'yyyy-MM-dd')}T${slot.startTime}`);
    const hoursDifference = (slotDateTime - now) / (1000 * 60 * 60);
    return hoursDifference >= cutoffHours;
  });

  res.json({
    status: 'success',
    data: {
      timeSlots: availableSlots
    }
  });
});

// Create a new time slot
exports.createTimeSlot = catchAsync(async (req, res) => {
  const { date, startTime, endTime, duration } = req.body;
  
  // Validate coach exists and is approved
  const coach = await Coach.findOne({ user: req.user._id });
  if (!coach) {
    throw new AppError('Coach profile not found', 404);
  }

  if (!coach.isApproved) {
    throw new AppError('Coach must be approved to create time slots', 403);
  }

  // Validate time slot doesn't overlap with existing slots
  const existingSlots = await TimeSlot.find({
    coach: coach._id,
    date: new Date(date),
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ]
  });

  if (existingSlots.length > 0) {
    throw new AppError('Time slot overlaps with existing slots', 400);
  }

  // Create the time slot
  const timeSlot = await TimeSlot.create({
    coach: coach._id,
    date: new Date(date),
    startTime,
    endTime,
    duration,
    status: 'available',
    bookingCutoffHours: coach.availabilitySettings?.bookingCutoffHours || 12
  });

  res.status(201).json({
    status: 'success',
    data: {
      timeSlot
    }
  });
});

// Delete a time slot
exports.deleteTimeSlot = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Find the time slot
  const timeSlot = await TimeSlot.findById(id);
  
  if (!timeSlot) {
    throw new AppError('Time slot not found', 404);
  }

  // Verify the coach owns this time slot
  const coach = await Coach.findOne({ user: req.user._id });
  if (!coach || timeSlot.coach.toString() !== coach._id.toString()) {
    throw new AppError('Not authorized to delete this time slot', 403);
  }

  // Check if the slot is already booked
  if (timeSlot.status === 'booked') {
    throw new AppError('Cannot delete a booked time slot', 400);
  }

  // Delete the time slot
  await TimeSlot.findByIdAndDelete(id);

  res.json({
    status: 'success',
    message: 'Time slot deleted successfully'
  });
}); 