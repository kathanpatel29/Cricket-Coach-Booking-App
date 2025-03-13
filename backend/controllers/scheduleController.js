const TimeSlot = require("../models/TimeSlot");
const Coach = require("../models/Coach");
const { AppError, catchAsync } = require("../middlewares/errorMiddleware");
const { startOfDay, endOfDay, format, parseISO } = require("date-fns");
const { formatResponse } = require("../utils/responseFormatter");

/**
 * @desc Get available time slots for a coach
 * @route GET /api/schedule/available
 * @access Public
 */
exports.getAvailableTimeSlots = catchAsync(async (req, res) => {
  const { date, coachId } = req.query;
  const searchDate = date ? new Date(date) : new Date();

  const timeSlots = await TimeSlot.find({
    coach: coachId,
    date: { $gte: startOfDay(searchDate), $lte: endOfDay(searchDate) },
    status: "available"
  }).sort("date startTime");

  res.json(formatResponse("success", "Available time slots retrieved", { timeSlots }));
});

/**
 * @desc Create a new time slot for a coach
 * @route POST /api/schedule/slot
 * @access Private/Coach
 */
exports.createTimeSlot = catchAsync(async (req, res) => {
  const { date, startTime, endTime, duration, capacity } = req.body;
  const coach = await Coach.findOne({ user: req.user._id });

  if (!coach) throw new AppError("Coach profile not found", 404);
  if (!coach.isApproved && coach.status !== "approved") throw new AppError("Coach must be approved to create time slots", 403);

  const existingSlots = await TimeSlot.find({
    coach: coach._id,
    date: new Date(date),
    $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }]
  });

  if (existingSlots.length > 0) throw new AppError("Time slot overlaps with existing slots", 400);

  // Validate capacity if provided
  const slotCapacity = capacity ? parseInt(capacity) : 1;
  if (slotCapacity < 1) {
    throw new AppError("Capacity must be at least 1", 400);
  }

  const timeSlot = await TimeSlot.create({
    coach: coach._id,
    date: new Date(date),
    startTime,
    endTime,
    duration: duration || 60,
    status: "available",
    capacity: slotCapacity
  });

  res.json(formatResponse("success", "Time slot created successfully", { timeSlot }));
});

/**
 * @desc Update a time slot
 * @route PUT /api/schedule/slot/:id
 * @access Private/Coach
 */
exports.updateTimeSlot = catchAsync(async (req, res) => {
  const { date, startTime, endTime, duration, status, capacity } = req.body;
  
  // Find the time slot
  const timeSlot = await TimeSlot.findById(req.params.id);
  if (!timeSlot) throw new AppError("Time slot not found", 404);
  
  // Verify coach ownership
  const coach = await Coach.findOne({ user: req.user._id });
  if (!coach || timeSlot.coach.toString() !== coach._id.toString()) {
    throw new AppError("Unauthorized to update this time slot", 403);
  }
  
  // Check if the slot is already booked
  if (timeSlot.status === "booked" && status === "available") {
    throw new AppError("Cannot update a booked time slot", 400);
  }
  
  // Check for overlapping slots if changing time
  if (date || startTime || endTime) {
    const newDate = date ? new Date(date) : timeSlot.date;
    const newStartTime = startTime || timeSlot.startTime;
    const newEndTime = endTime || timeSlot.endTime;
    
    const existingSlots = await TimeSlot.find({
      _id: { $ne: timeSlot._id },
      coach: coach._id,
      date: newDate,
      $or: [{ startTime: { $lt: newEndTime }, endTime: { $gt: newStartTime } }]
    });
    
    if (existingSlots.length > 0) {
      throw new AppError("Time slot overlaps with existing slots", 400);
    }
  }
  
  // Validate capacity if provided
  if (capacity !== undefined) {
    const newCapacity = parseInt(capacity);
    if (!Number.isInteger(newCapacity) || newCapacity < 1) {
      throw new AppError("Capacity must be a positive integer", 400);
    }
    
    // Check if the new capacity is less than current bookedCount
    if (newCapacity < timeSlot.bookedCount) {
      throw new AppError("Cannot set capacity lower than current number of bookings", 400);
    }
    
    timeSlot.capacity = newCapacity;
  }
  
  // Update the time slot
  if (date) timeSlot.date = new Date(date);
  if (startTime) timeSlot.startTime = startTime;
  if (endTime) timeSlot.endTime = endTime;
  if (duration) timeSlot.duration = duration;
  if (status && timeSlot.status !== "booked") timeSlot.status = status;
  
  await timeSlot.save();
  
  res.json(formatResponse("success", "Time slot updated successfully", { timeSlot }));
});

/**
 * @desc Delete a time slot
 * @route DELETE /api/schedule/slot/:id
 * @access Private/Coach
 */
exports.deleteTimeSlot = catchAsync(async (req, res) => {
  const timeSlot = await TimeSlot.findById(req.params.id);
  if (!timeSlot) throw new AppError("Time slot not found", 404);

  const coach = await Coach.findOne({ user: req.user._id });
  if (!coach || timeSlot.coach.toString() !== coach._id.toString()) {
    throw new AppError("Unauthorized to delete this time slot", 403);
  }

  await timeSlot.deleteOne();
  res.json(formatResponse("success", "Time slot deleted successfully"));
});
