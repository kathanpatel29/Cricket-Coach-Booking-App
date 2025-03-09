const express = require('express');
const asyncHandler = require('express-async-handler');
const Booking = require("../models/Booking");
const Coach = require("../models/Coach");
const { AppError, catchAsync } = require("../utils/errorHandler");
const { successResponse, errorResponse, formatResponse } = require("../utils/responseFormatter");
const User = require('../models/User');
const { sendBookingConfirmation, sendCoachNotification } = require('../utils/emailService');
const TimeSlot = require('../models/TimeSlot');
const Payment = require('../models/Payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { startOfDay, endOfDay } = require('date-fns');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private/User
exports.createBooking = catchAsync(async (req, res) => {
  const { coachId, timeSlotId } = req.body;

  // Validate coach exists and is approved
  const coach = await Coach.findByIdOrString(coachId)
    .populate('user', 'isApproved');

  if (!coach) {
    throw new AppError("Coach not found", 404);
  }

  if (!coach.user.isApproved) {
    throw new AppError("Coach not approved for bookings", 400);
  }

  // Find and validate time slot
  const timeSlot = await TimeSlot.findByIdOrString(timeSlotId);
  if (!timeSlot) {
    throw new AppError("Time slot not found", 404);
  }

  if (timeSlot.status !== 'available') {
    throw new AppError("Time slot is not available", 400);
  }

  // Validate booking cutoff
  const now = new Date();
  const slotDateTime = new Date(timeSlot.date);
  const [hours, minutes] = timeSlot.startTime.split(':');
  slotDateTime.setHours(parseInt(hours), parseInt(minutes));
  const cutoffHours = coach.availabilitySettings?.bookingCutoffHours || 12;
  
  if ((slotDateTime - now) / (1000 * 60 * 60) < cutoffHours) {
    throw new AppError("Booking cutoff time has passed", 400);
  }

  // Calculate payment amount
  const paymentAmount = coach.hourlyRate * (timeSlot.duration / 60);

  // Create booking with proper ObjectIds
  const booking = await Booking.create({
    user: req.user._id, // This is already an ObjectId from auth middleware
    coach: coach._id,   // Using the coach._id from the found coach
    timeSlot: timeSlot._id,
    status: 'pending',
    paymentStatus: 'pending',
    paymentAmount: paymentAmount
  });

  // Update time slot status
  timeSlot.status = 'booked';
  timeSlot.booking = booking._id;
  await timeSlot.save();

  // Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(paymentAmount * 100), // Convert to cents
    currency: "usd",
    metadata: { 
      bookingId: booking._id.toString(),
      coachId: coach._id.toString(),
      userId: req.user._id.toString()
    }
  });

  // Create payment record
  await Payment.create({
    booking: booking._id,
    amount: paymentAmount,
    status: 'pending',
    stripePaymentIntentId: paymentIntent.id,
    stripeUserSecret: paymentIntent.client_secret
  });

  // Return the booking with populated fields and payment intent
  const populatedBooking = await Booking.findById(booking._id)
    .populate('user', 'name email')
    .populate('coach', 'user specializations hourlyRate')
    .populate('timeSlot');

  res.status(201).json({
    status: 'success',
    data: { 
      booking: populatedBooking,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      }
    }
  });
});

// @desc    Get user's bookings
// @route   GET /api/bookings/user
// @access  Private/User
exports.getUserBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
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
    .populate("user", "name email")
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
    .populate("user", "name email")
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
// @access  Private/User
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
// @access  Private/User
exports.cancelBooking = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Verify the user owns this booking
  if (booking.user.toString() !== req.user.id) {
    throw new AppError("You are not authorized to cancel this booking", 403);
  }

  booking.status = 'cancelled';
  booking.cancellationReason = req.body.reason || 'Cancelled by user';
  booking.cancellationDate = new Date();
  booking.cancelledBy = req.user.id;
  await booking.save();
  
  res.json(formatResponse('success', 'Booking cancelled successfully', booking));
});

// @desc    Get available slots for a coach
// @route   GET /api/bookings/slots/:coachId
// @access  Public
exports.getAvailableSlots = catchAsync(async (req, res) => {
  const { coachId } = req.params;
  const { date } = req.query;

  if (!date) {
    throw new AppError('Date parameter is required', 400);
  }

  const searchDate = new Date(date);
  const startOfDayDate = startOfDay(searchDate);
  const endOfDayDate = endOfDay(searchDate);

  // Get coach and validate approval status
  const coach = await Coach.findById(coachId)
    .populate('user', 'isApproved name')
    .select('availabilitySettings hourlyRate');

  if (!coach || !coach.user?.isApproved) {
    throw new AppError('Coach not found or not approved', 404);
  }

  // Get available time slots with efficient query
  const availableSlots = await TimeSlot.find({
    coach: coachId,
    date: {
      $gte: startOfDayDate,
      $lte: endOfDayDate
    },
    status: 'available'
  }).sort('startTime');

  // Apply booking cutoff filter
  const now = new Date();
  const cutoffHours = coach.availabilitySettings?.bookingCutoffHours || 12;
  
  const filteredSlots = availableSlots.filter(slot => {
    const slotDateTime = new Date(slot.date);
    const [hours, minutes] = slot.startTime.split(':');
    slotDateTime.setHours(parseInt(hours), parseInt(minutes));
    return (slotDateTime - now) / (1000 * 60 * 60) >= cutoffHours;
  }).map(slot => ({
    _id: slot._id,
    startTime: slot.startTime,
    endTime: slot.endTime,
    duration: slot.duration,
    date: slot.date,
    hourlyRate: coach.hourlyRate,
    coachName: coach.user.name
  }));

  res.json({
    status: 'success',
    data: {
      slots: filteredSlots,
      coach: {
        _id: coach._id,
        name: coach.user.name,
        hourlyRate: coach.hourlyRate,
        bookingCutoffHours: cutoffHours
      }
    }
  });
});

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

exports.initiateBooking = catchAsync(async (req, res) => {
  const { timeSlotId, duration } = req.body;
  
  // Get time slot and verify availability
  const timeSlot = await TimeSlot.findOne({
    _id: timeSlotId,
    status: 'available'
  }).populate('coach');
  
  if (!timeSlot) {
    return res.status(400).json({
      status: 'error',
      message: 'Time slot not available'
    });
  }
  
  // Calculate amount
  const amount = timeSlot.coach.hourlyRate * (duration / 60);
  
  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'usd',
    metadata: {
      timeSlotId,
      coachId: timeSlot.coach._id.toString(),
      userId: req.user.id
    }
  });
  
  // Create booking
  const booking = await Booking.create({
    user: req.user.id,
    coach: timeSlot.coach._id,
    timeSlot: timeSlot._id,
    duration,
    totalAmount: amount,
    status: 'pending'
  });
  
  // Create payment record
  await Payment.create({
    booking: booking._id,
    amount,
    stripePaymentIntentId: paymentIntent.id,
    stripeUserSecret: paymentIntent.user_secret
  });
  
  // Update time slot status
  timeSlot.status = 'booked';
  timeSlot.booking = booking._id;
  await timeSlot.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      booking,
      userSecret: paymentIntent.user_secret
    }
  });
});

exports.confirmBooking = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({
      status: 'error',
      message: 'Booking not found'
    });
  }
  
  booking.status = 'confirmed';
  await booking.save();
  
  res.status(200).json({
    status: 'success',
    data: booking
  });
});