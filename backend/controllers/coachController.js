const Coach = require("../models/Coach");
const User = require("../models/User");
const path = require('path');
const fs = require('fs');
const { formatResponse } = require('../utils/responseFormatter');
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const { AppError, catchAsync } = require('../utils/errorHandler');
const Availability = require('../models/Availability');

// Get valid specializations
exports.getSpecializations = async (req, res) => {
  try {
    const specializations = Coach.getValidSpecializations();
    res.json(formatResponse('success', 'Specializations retrieved successfully', { specializations }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

exports.createCoachProfile = async (req, res) => {
  try {
    // Check if coach profile already exists
    const existingCoach = await Coach.findOne({ user: req.user.id });
    if (existingCoach) {
      return res.status(400).json(formatResponse('error', 'Coach profile already exists'));
    }

    const coach = new Coach({
      user: req.user._id,
      ...req.body,
      status: 'pending',
      isApproved: false
    });

    await coach.save();
    
    // Update user role to coach
    await User.findByIdAndUpdate(req.user.id, { role: 'coach' });

    res.status(201).json(formatResponse('success', 'Coach profile created successfully', { coach }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

exports.updateCoachProfile = async (req, res) => {
  try {
    const coach = await Coach.findOne({ user: req.user.id });
    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach profile not found'));
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      coach[key] = req.body[key];
    });

    await coach.save();
    res.json(formatResponse('success', 'Coach profile updated successfully', { coach }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get all coaches (public)
exports.getAllCoaches = async (req, res) => {
  try {
    const coaches = await Coach.find({
      isApproved: true,
      isProfileComplete: true
    }).populate('user', 'name email profileImage');

    res.json(formatResponse('success', 'Coaches retrieved successfully', coaches));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error fetching coaches'));
  }
};

// Get coach by ID
exports.getCoachById = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id)
      .populate('user', 'name email profileImage');

    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach not found'));
    }

    res.json(formatResponse('success', 'Coach retrieved successfully', coach));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error fetching coach details'));
  }
};

// Get coach profile
exports.getProfile = async (req, res) => {
  try {
    const coach = await Coach.findOne({ user: req.user._id })
      .populate('user', 'name email profileImage');

    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach profile not found'));
    }

    res.json(formatResponse('success', 'Profile retrieved successfully', coach));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error fetching profile'));
  }
};

// Update coach profile
exports.updateProfile = async (req, res) => {
  try {
    const coach = await Coach.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true }
    ).populate('user', 'name email profileImage');

    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach profile not found'));
    }

    res.json(formatResponse('success', 'Coach profile updated successfully', { coach }));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error updating profile'));
  }
};

// Get coach bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ coach: req.user._id })
      .populate('client', 'name email profileImage')
      .sort('-createdAt');

    res.json(formatResponse('success', 'Bookings retrieved successfully', { bookings }));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error fetching bookings'));
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, coach: req.user._id },
      { status: req.body.status },
      { new: true }
    ).populate('client', 'name email profileImage');

    if (!booking) {
      return res.status(404).json(formatResponse('error', 'Booking not found'));
    }

    res.json(formatResponse('success', 'Booking status updated successfully', { booking }));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error updating booking status'));
  }
};

// Get coach dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [bookings, reviews, earnings] = await Promise.all([
      Booking.find({ coach: req.user._id }),
      Review.find({ coach: req.user._id }),
      Booking.find({ 
        coach: req.user._id,
        status: 'completed',
        paymentStatus: 'paid'
      })
    ]);

    const stats = {
      totalBookings: bookings.length,
      upcomingBookings: bookings.filter(b => 
        b.status === 'confirmed' && new Date(b.date) > new Date()
      ).length,
      totalEarnings: earnings.reduce((acc, b) => acc + b.amount, 0),
      averageRating: reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length
    };

    res.json(formatResponse('success', 'Stats retrieved successfully', stats));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error fetching dashboard stats'));
  }
};

// Get coach availability
exports.getAvailability = catchAsync(async (req, res) => {
  const availability = await Availability.find({ coach: req.user.id })
    .sort({ date: 1, startTime: 1 });

  res.json({
    status: 'success',
    data: {
      availability
    }
  });
});

// Add new availability slot
exports.addAvailability = catchAsync(async (req, res) => {
  const { date, startTime, endTime } = req.body;

  // Validate time format and date
  if (!date || !startTime || !endTime) {
    return res.status(400).json(formatResponse('error', 'Please provide date, start time and end time'));
  }

  // Check if slot already exists
  const existingSlot = await Availability.findOne({
    coach: req.user.id,
    date,
    startTime,
    endTime
  });

  if (existingSlot) {
    return res.status(400).json(formatResponse('error', 'This time slot already exists'));
  }

  const availability = await Availability.create({
    coach: req.user.id,
    date,
    startTime,
    endTime
  });

  res.status(201).json({
    status: 'success',
    data: {
      availability
    }
  });
});

// Delete availability slot
exports.deleteAvailability = catchAsync(async (req, res) => {
  const availability = await Availability.findOne({
    _id: req.params.id,
    coach: req.user.id
  });

  if (!availability) {
    return res.status(404).json(formatResponse('error', 'Availability slot not found'));
  }

  await availability.deleteOne();

  res.json({
    status: 'success',
    message: 'Availability slot deleted successfully'
  });
});

exports.approveCoach = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { isApproved: true }, 
      { new: true }
    ).select("name email role isApproved");

    if (!user) {
      return res.status(404).json(formatResponse('error', 'Coach not found'));
    }
    res.json(formatResponse('success', 'Coach approved successfully', { user }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

exports.rejectCoach = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { 
        role: "client",
        isApproved: false 
      }, 
      { new: true }
    ).select("name email role isApproved");

    if (!user) {
      return res.status(404).json(formatResponse('error', 'Coach not found'));
    }

    // Remove coach profile
    await Coach.findOneAndDelete({ user: req.params.id });

    res.json(formatResponse('success', 'Coach rejected successfully', { user }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get coach's public profile
exports.getCoachPublicProfile = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id)
      .populate('user', 'name email profileImage')
      .select('specializations experience hourlyRate bio reviews rating');

    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach not found'));
    }

    res.json(formatResponse('success', 'Coach profile retrieved successfully', coach));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error fetching coach profile'));
  }
};

// Delete time slot
exports.deleteTimeSlot = async (req, res) => {
  try {
    const { dateId, slotId } = req.params;
    const coach = await Coach.findOne({ user: req.user.id });
    
    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach profile not found'));
    }

    const dateIndex = coach.availability.findIndex(a => a._id.toString() === dateId);
    if (dateIndex === -1) {
      return res.status(404).json(formatResponse('error', 'Date not found'));
    }

    coach.availability[dateIndex].timeSlots = coach.availability[dateIndex].timeSlots.filter(
      slot => slot._id.toString() !== slotId
    );

    if (coach.availability[dateIndex].timeSlots.length === 0) {
      coach.availability.splice(dateIndex, 1);
    }

    await coach.save();
    res.json(formatResponse('success', 'Time slot deleted successfully'));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get coach's stats
exports.getCoachStats = async (req, res) => {
  try {
    const bookings = await Booking.find({ coach: req.user.id });
    const reviews = await Review.find({ coach: req.user.id });

    const stats = {
      totalBookings: bookings.length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      averageRating: reviews.length > 0 
        ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length 
        : 0,
      totalReviews: reviews.length
    };

    res.json(formatResponse('success', 'Stats retrieved successfully', { stats }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get coach's earnings
exports.getCoachEarnings = async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      coach: req.user.id,
      status: 'completed',
      paymentStatus: 'paid'
    });

    const earnings = {
      total: bookings.reduce((acc, booking) => acc + booking.amount, 0),
      bookings: bookings.map(booking => ({
        id: booking._id,
        date: booking.date,
        amount: booking.amount,
        client: booking.client
      }))
    };

    res.json(formatResponse('success', 'Earnings retrieved successfully', { earnings }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get coach's reviews
exports.getCoachReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ coach: req.user.id })
      .populate('client', 'name')
      .sort('-createdAt');

    res.json(formatResponse('success', 'Reviews retrieved successfully', { reviews }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get coach's sessions
exports.getCoachSessions = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { coach: req.user.id };

    // Add status filter if provided
    if (status) {
      if (status === 'upcoming') {
        query.status = 'confirmed';
        query.date = { $gt: new Date() };
      } else if (status === 'completed' || status === 'cancelled') {
        query.status = status;
      }
    }

    const sessions = await Booking.find(query)
      .populate('client', 'name email')
      .sort({ date: 1 });

    res.json(formatResponse('success', 'Sessions retrieved successfully', { sessions }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get coach's emergency off dates
exports.getEmergencyOff = async (req, res) => {
  try {
    const coach = await Coach.findOne({ user: req.user._id })
      .select('emergencyOff');

    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach not found'));
    }

    res.json(formatResponse('success', 'Emergency off dates retrieved successfully', {
      emergencyOff: coach.emergencyOff || []
    }));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error fetching emergency off dates'));
  }
};

// Set emergency off
exports.setEmergencyOff = async (req, res) => {
  try {
    const { date, reason, options } = req.body;

    if (!date || !reason) {
      return res.status(400).json(formatResponse('error', 'Date and reason are required'));
    }

    const coach = await Coach.findOneAndUpdate(
      { user: req.user._id },
      {
        $push: {
          emergencyOff: {
            date: new Date(date),
            reason,
            options: {
              refund: options?.refund ?? true,
              reschedule: options?.reschedule ?? true,
              cancel: options?.cancel ?? true
            }
          }
        }
      },
      { new: true }
    );

    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach not found'));
    }

    res.json(formatResponse('success', 'Emergency off date added successfully', {
      emergencyOff: coach.emergencyOff
    }));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error setting emergency off date'));
  }
};

// Schedule
exports.getSchedule = async (req, res) => {
  try {
    const coach = await Coach.findOne({ user: req.user._id })
      .select('schedule');

    res.json(formatResponse('success', 'Schedule retrieved successfully', {
      schedule: coach.schedule || []
    }));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error fetching schedule'));
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const coach = await Coach.findOneAndUpdate(
      { user: req.user._id },
      { schedule: req.body.schedule },
      { new: true }
    );

    res.json(formatResponse('success', 'Schedule updated successfully', {
      schedule: coach.schedule
    }));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error updating schedule'));
  }
};

// Remove emergency off
exports.removeEmergencyOff = async (req, res) => {
  try {
    const { date } = req.params;

    const coach = await Coach.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { emergencyOff: { date: new Date(date) } } },
      { new: true }
    );

    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach not found'));
    }

    res.json(formatResponse('success', 'Emergency off date removed successfully', {
      emergencyOff: coach.emergencyOff
    }));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error removing emergency off date'));
  }
};