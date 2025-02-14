const express = require('express');
const asyncHandler = require('express-async-handler');
const Booking = require("../models/Booking");
const Coach = require("../models/Coach");
const { AppError, catchAsync } = require("../utils/errorHandler");
const { successResponse, errorResponse } = require("../utils/responseFormatter");

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private/Client
const createBooking = catchAsync(async (req, res) => {
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

// @desc    Get client's bookings
// @route   GET /api/bookings/client
// @access  Private/Client
const getClientBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ client: req.user._id })
    .populate('coach', 'name email')
    .sort({ date: -1 });

  successResponse(res, 200, { bookings }, "Bookings retrieved successfully");
});

// @desc    Get coach's bookings
// @route   GET /api/bookings/coach
// @access  Private/Coach
const getCoachBookings = catchAsync(async (req, res) => {
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

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("client", "name email")
    .populate("coach", "user specializations hourlyRate");

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  successResponse(res, 200, booking, "Booking details retrieved successfully");
});

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private/Coach
const updateBookingStatus = catchAsync(async (req, res) => {
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
  successResponse(res, 200, booking, "Booking status updated successfully");
});

// @desc    Reschedule booking
// @route   PATCH /api/bookings/reschedule/:id
// @access  Private/Client
const rescheduleBooking = catchAsync(async (req, res) => {
  const { newDate, newTimeSlot } = req.body;
  const booking = await Booking.findById(req.params.id);
  
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Add rescheduling logic here
  booking.date = newDate;
  booking.timeSlot = newTimeSlot;
  await booking.save();
  
  successResponse(res, 200, booking, "Booking rescheduled successfully");
});

// @desc    Cancel booking
// @route   PATCH /api/bookings/cancel/:id
// @access  Private/Client
const cancelBooking = catchAsync(async (req, res) => {
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
  
  successResponse(res, 200, booking, "Booking cancelled successfully");
});

// @desc    Get available slots for a coach
// @route   GET /api/bookings/slots/:coachId
// @access  Public
const getAvailableSlots = catchAsync(async (req, res) => {
  const { coachId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      status: 'error',
      message: 'Date parameter is required'
    });
  }

  try {
    // Find coach and populate user information for approval status
    const coach = await Coach.findById(coachId).populate('user', 'isApproved');
    
    if (!coach) {
      return res.status(404).json({
        status: 'error',
        message: 'Coach not found'
      });
    }

    if (!coach.user?.isApproved) {
      return res.status(400).json({
        status: 'error',
        message: 'Coach is not approved for bookings'
      });
    }

    // Check if coach has set any availability
    if (!coach.availability || coach.availability.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          slots: []
        },
        message: 'No availability set for this coach'
      });
    }

    // Find availability for the requested date
    const availability = coach.availability.find(
      slot => new Date(slot.date).toDateString() === new Date(date).toDateString()
    );

    if (!availability) {
      return res.status(200).json({
        status: 'success',
        data: {
          slots: []
        },
        message: 'No slots available for selected date'
      });
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
    const availableSlots = availability.slots.filter(slot => !bookedSlots.includes(slot));

    return res.status(200).json({
      status: 'success',
      data: {
        slots: availableSlots
      },
      message: 'Available slots retrieved successfully'
    });

  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch available slots',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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

module.exports = {
  createBooking,
  getClientBookings,
  getCoachBookings,
  getBookingById,
  updateBookingStatus,
  rescheduleBooking,
  cancelBooking,
  getAvailableSlots
};