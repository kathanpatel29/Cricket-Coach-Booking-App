const Booking = require("../models/Booking");
const Coach = require("../models/Coach");
const { AppError, catchAsync } = require("../utils/errorHandler");
const { successResponse, errorResponse } = require("../utils/responseFormatter");

exports.createBooking = catchAsync(async (req, res) => {
  const { coachId, date, timeSlot, duration } = req.body;

  // Validate coach exists and is approved
  const coach = await Coach.findById(coachId).populate('user', 'isApproved');
  if (!coach) {
    throw new AppError("Coach not found", 404);
  }
  if (!coach.user.isApproved) {
    throw new AppError("Coach is not approved for bookings", 400);
  }

  // Check coach availability
  const isAvailable = await coach.isAvailableForBooking(date, timeSlot);
  if (!isAvailable) {
    throw new AppError("Selected time slot is not available", 400);
  }

  // Calculate total amount
  const totalAmount = coach.hourlyRate * duration;

  // Create booking
  const booking = await Booking.create({
    client: req.user.id,
    coach: coachId,
    date,
    timeSlot,
    duration,
    totalAmount,
  });

  // Update coach's availability
  await coach.markTimeSlotAsBooked(date, timeSlot);

  successResponse(res, 201, booking, "Booking created successfully");
});

exports.getClientBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ client: req.user._id })
      .populate('coach', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      status: 'success',
      message: 'Bookings retrieved successfully',
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error('Get Client Bookings Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error retrieving bookings'
    });
  }
};

exports.getCoachBookings = catchAsync(async (req, res) => {
  const { status, date, page = 1, limit = 10 } = req.query;
  
  const coach = await Coach.findOne({ user: req.user.id });
  if (!coach) {
    throw new AppError("Coach profile not found", 404);
  }

  const query = { coach: coach._id };
  if (status) query.status = status;
  if (date) query.date = { $gte: new Date(date) };

  const bookings = await Booking.find(query)
    .populate("client", "name email")
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Booking.countDocuments(query);

  successResponse(res, 200, {
    bookings,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

exports.getBookingById = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("client", "name email")
    .populate("coach", "user specializations hourlyRate");

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  successResponse(res, 200, booking, "Booking details retrieved successfully");
});

exports.updateBookingStatus = catchAsync(async (req, res) => {
  const { status, reason } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Validate status transition
  if (!isValidStatusTransition(booking.status, status)) {
    throw new AppError(`Invalid status transition from ${booking.status} to ${status}`, 400);
  }

  booking.status = status;
  if (status === 'cancelled') {
    booking.cancellationReason = reason;
    booking.cancellationDate = new Date();
    booking.cancelledBy = req.user.id;
  }

  await booking.save();
  successResponse(res, 200, booking, "Booking status updated successfully");
});

exports.rescheduleBooking = catchAsync(async (req, res) => {
  const { bookingId, newDate, newTimeSlot } = req.body;
  
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Create new booking with reference to original
  const newBooking = await Booking.create({
    ...booking.toObject(),
    _id: undefined,
    date: newDate,
    timeSlot: newTimeSlot,
    status: 'pending',
    isRescheduled: true,
    originalBooking: booking._id
  });

  // Update original booking
  booking.status = 'cancelled';
  booking.cancellationReason = 'Rescheduled';
  booking.cancellationDate = new Date();
  await booking.save();

  successResponse(res, 200, newBooking, "Booking rescheduled successfully");
});

exports.cancelBooking = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Verify the client owns this booking
  if (booking.client.toString() !== req.user.id) {
    throw new AppError("You are not authorized to cancel this booking", 403);
  }

  // Check if booking can be cancelled
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new AppError(`Cannot cancel booking with status: ${booking.status}`, 400);
  }

  booking.status = 'cancelled';
  booking.cancellationReason = req.body.reason || 'Cancelled by client';
  booking.cancellationDate = new Date();
  booking.cancelledBy = req.user.id;

  await booking.save();

  // Release the coach's time slot
  const coach = await Coach.findById(booking.coach);
  if (coach) {
    await coach.markTimeSlotAsAvailable(booking.date, booking.timeSlot);
  }

  successResponse(res, 200, booking, "Booking cancelled successfully");
});


exports.getCoachAvailability = catchAsync(async (req, res) => {
  const coach = await Coach.findById(req.params.coachId);
  
  if (!coach) {
    throw new AppError("Coach not found", 404);
  }

  if (!coach.user.isApproved) {
    throw new AppError("Coach is not approved", 400);
  }

  // Filter out past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureAvailability = coach.availability.filter(
    a => new Date(a.date) >= today
  );

  successResponse(res, 200, futureAvailability, "Coach availability retrieved successfully");
});

exports.rescheduleBooking = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const { newDate, newTimeSlot } = req.body;
  
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  
  // Add rescheduling logic here
  
  successResponse(res, 200, booking, "Booking rescheduled successfully");
});

exports.cancelBooking = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const { reason } = req.body;
  
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  
  // Add cancellation logic here
  
  successResponse(res, 200, booking, "Booking cancelled successfully");
});

// Helper function to validate status transitions
function isValidStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled', 'no-show'],
    cancelled: [],
    completed: [],
    'no-show': []
  };

  return validTransitions[currentStatus]?.includes(newStatus);
}