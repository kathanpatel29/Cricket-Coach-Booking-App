const express = require('express');
const asyncHandler = require('express-async-handler');
const Booking = require("../models/Booking");
const Coach = require("../models/Coach");
const { AppError, catchAsync } = require("../utils/errorHandler");
const { successResponse, errorResponse, formatResponse } = require("../utils/responseFormatter");
const User = require('../models/User');
const { sendBookingConfirmation, sendCoachNotification } = require('../utils/emailService');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private/Client
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
    status: 'pending'
  });

  // Update coach's availability
  await coach.markTimeSlotAsBooked(date, timeSlot);

  // Send email notifications
  const user = await User.findById(req.user.id);
  const bookingDetails = {
    userName: user.name,
    coachName: coach.name,
    date,
    timeSlot,
    duration,
    location: coach.location
  };

  await sendBookingConfirmation(user.email, bookingDetails);
  await sendCoachNotification(coach.email, bookingDetails);

  res.status(201).json(formatResponse('success', 'Booking created successfully', booking));
});

// @desc    Get client's bookings
// @route   GET /api/bookings/client
// @access  Private/Client
exports.getClientBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ client: req.user._id })
    .populate('coach', 'name email')
    .sort({ date: -1 });

  res.json(formatResponse('success', 'Bookings retrieved successfully', bookings));
});

// @desc    Get coach's bookings
// @route   GET /api/bookings/coach
// @access  Private/Coach
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

  res.json(formatResponse('success', 'Bookings retrieved successfully', {
    bookings,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  }));
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("client", "name email")
    .populate("coach", "user specializations hourlyRate");

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  res.json(formatResponse('success', 'Booking retrieved successfully', booking));
});

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private/Coach
exports.updateBookingStatus = catchAsync(async (req, res) => {
  const { status, reason } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

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
  res.json(formatResponse('success', 'Booking status updated successfully', booking));
});

// @desc    Reschedule booking
// @route   PATCH /api/bookings/reschedule/:id
// @access  Private/Client
exports.rescheduleBooking = catchAsync(async (req, res) => {
  const { newDate, newTimeSlot } = req.body;
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Add rescheduling logic here
  booking.date = newDate;
  booking.timeSlot = newTimeSlot;
  await booking.save();
  
  res.json(formatResponse('success', 'Booking rescheduled successfully', booking));
});

// @desc    Cancel booking
// @route   PATCH /api/bookings/cancel/:id
// @access  Private/Client
exports.cancelBooking = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Verify the client owns this booking
  if (booking.client.toString() !== req.user.id) {
    throw new AppError("You are not authorized to cancel this booking", 403);
  }

  booking.status = 'cancelled';
  booking.cancellationReason = req.body.reason || 'Cancelled by client';
  booking.cancellationDate = new Date();
  booking.cancelledBy = req.user.id;
  await booking.save();
  
  res.json(formatResponse('success', 'Booking cancelled successfully', booking));
});

// @desc    Get available slots for a coach
// @route   GET /api/bookings/slots/:coachId
// @access  Public
exports.getAvailableSlots = async (req, res) => {
  try {
    const { coachId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json(formatResponse('error', 'Date parameter is required'));
    }

    const coach = await Coach.findById(coachId)
      .populate('user', 'isApproved');

    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach not found'));
    }

    if (!coach.user?.isApproved) {
      return res.status(400).json(formatResponse('error', 'Coach is not approved for bookings'));
    }

    // Get schedule for the requested date
    const schedule = coach.schedule?.find(s => 
      new Date(s.date).toDateString() === new Date(date).toDateString()
    );

    if (!schedule) {
      return res.json(formatResponse('success', 'No slots available for this date', []));
    }

    // Get existing bookings for that date
    const existingBookings = await Booking.find({
      coach: coachId,
      date: {
        $gte: new Date(date).setHours(0,0,0,0),
        $lt: new Date(date).setHours(23,59,59,999)
      },
      status: { $nin: ['cancelled', 'rejected'] }
    });

    // Filter out booked slots
    const bookedSlots = existingBookings.map(booking => booking.timeSlot);
    const availableSlots = schedule.slots.filter(slot => !bookedSlots.includes(slot));

    res.json(formatResponse('success', 'Available slots retrieved successfully', availableSlots));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error fetching available slots'));
  }
};

// Helper function to validate status transitions
exports.isValidStatusTransition = function(currentStatus, newStatus) {
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled', 'no-show'],
    cancelled: [],
    completed: [],
    'no-show': []
  };

  return validTransitions[currentStatus]?.includes(newStatus);
}