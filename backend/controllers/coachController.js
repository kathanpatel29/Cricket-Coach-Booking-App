const Coach = require("../models/Coach");
const User = require("../models/User");
const path = require('path');
const fs = require('fs');
const { formatResponse } = require('../utils/responseFormatter');
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const { AppError, catchAsync } = require('../utils/errorHandler');
const Availability = require('../models/Availability');
const mongoose = require('mongoose');

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

    // Create new coach profile
    const coach = new Coach({
      user: req.user._id,
      ...req.body,
      status: 'pending',
      isApproved: false,
      createdAt: new Date()
    });

    await coach.save();
    
    // Update user role to coach
    await User.findByIdAndUpdate(req.user.id, { 
      role: 'coach',
      isApproved: false 
    });

    res.status(201).json(formatResponse('success', 'Coach profile created successfully. Waiting for admin approval.', { coach }));
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

// Get all coaches with filters
exports.getAllCoaches = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, approved, availabilityFilter } = req.query;
  
  const query = { isApproved: true };
  
  if (availabilityFilter === 'available') {
    query.hasAvailability = true;
  }

  const coaches = await Coach.find(query)
    .populate('user', 'name email profileImage')
    .populate('reviews')
    .select('specializations experience hourlyRate bio availability recurringAvailability averageRating totalReviews')
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Coach.countDocuments(query);

  // Process each coach to include required fields
  const processedCoaches = coaches.map(coach => {
    const hasAvailability = coach.availability.length > 0 || Object.values(coach.recurringAvailability || {}).some(slots => slots.length > 0);
    const nextAvailableSlot = coach.availability[0]?.date || null;

    return {
      _id: coach._id,
      name: coach.user.name,
      email: coach.user.email,
      profileImage: coach.user.profileImage,
      specializations: coach.specializations || [],
      experience: coach.experience || 0,
      hourlyRate: coach.hourlyRate || 0,
      bio: coach.bio || '',
      averageRating: coach.averageRating || 0,
      totalReviews: coach.reviews?.length || 0,
      hasAvailability,
      nextAvailableSlot,
      availabilitySettings: {
        bookingCutoffHours: 12 // Default value
      }
    };
  });

  res.json({
    status: 'success',
    data: {
      coaches: processedCoaches,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    }
  });
});

// Get coach by ID (public)
exports.getCoachById = catchAsync(async (req, res) => {
  const coach = await Coach.findById(req.params.id)
    .populate('user', 'name email profileImage')
    .populate('reviews')
    .select('specializations experience hourlyRate bio availability recurringAvailability averageRating totalReviews location');
  
  if (!coach) {
    return res.status(404).json({
      status: 'error',
      message: 'Coach not found'
    });
  }

  // Process coach data to match frontend expectations
  const processedCoach = {
    _id: coach._id,
    name: coach.user.name,
    email: coach.user.email,
    profileImage: coach.user.profileImage,
    specializations: coach.specializations || [],
    experience: coach.experience || 0,
    hourlyRate: coach.hourlyRate || 0,
    bio: coach.bio || '',
    averageRating: coach.averageRating || 0,
    totalReviews: coach.reviews?.length || 0,
    location: coach.location || '',
    availability: coach.availability || [],
    reviews: coach.reviews || [],
  };
  
  res.json({
    status: 'success',
    data: {
      coach: processedCoach
    }
  });
});

// Get coach profile
exports.getProfile = catchAsync(async (req, res) => {
  const coach = await Coach.findOne({ user: req.user.id })
    .populate('user', 'name email');
  
  res.json({
    status: 'success',
    data: coach
  });
});

// Update coach profile
exports.updateProfile = catchAsync(async (req, res) => {
  const coach = await Coach.findOneAndUpdate(
    { user: req.user.id },
    req.body,
    { new: true, runValidators: true }
  ).populate('user', 'name email');
  
  res.json({
    status: 'success',
    data: coach
  });
});

// Get coach bookings
exports.getCoachBookings = catchAsync(async (req, res) => {
  try {
    const bookings = await Booking.find({ coach: req.user.id })
      .populate('user', 'name email')
      .populate('coach', 'name')
      .sort('-createdAt');

    res.json(formatResponse('success', 'Coach bookings retrieved successfully', bookings));
  } catch (error) {
    console.error('Error fetching coach bookings:', error);
    res.status(500).json(formatResponse('error', 'Error fetching bookings'));
  }
});

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, coach: req.user._id },
      { status: req.body.status },
      { new: true }
    ).populate('user', 'name email profileImage');

    if (!booking) {
      return res.status(404).json(formatResponse('error', 'Booking not found'));
    }

    res.json(formatResponse('success', 'Booking status updated successfully', { booking }));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error updating booking status'));
  }
};

// Get coach dashboard stats
exports.getDashboardStats = catchAsync(async (req, res) => {
  const totalSessions = await Booking.countDocuments({ coach: req.user.id });
  const upcomingSessions = await Booking.find({
    coach: req.user.id,
    date: { $gte: new Date() }
  }).populate('user', 'name');
  
  res.json({
    status: 'success',
    data: {
      totalSessions,
      upcomingSessions
    }
  });
});

// Get coach availability
exports.getAvailability = catchAsync(async (req, res) => {
  const { date } = req.query;
  const coach = await Coach.findOne({ user: req.user.id });
  
  if (!coach) {
    throw new AppError('Coach profile not found', 404);
  }

  // Get availability for specific date and recurring
  const availabilityData = {
    availableSlots: coach.availability?.filter(slot => slot.date === date) || [],
    recurringAvailability: coach.recurringAvailability || {}
  };
  
  res.json({
    status: 'success',
    data: availabilityData
  });
});

// Add or update availability
exports.addAvailability = catchAsync(async (req, res) => {
  const { date, slots, recurring } = req.body;
  const coach = await Coach.findOne({ user: req.user.id });
  
  if (!coach) {
    throw new AppError('Coach profile not found', 404);
  }

  // Update recurring availability if provided
  if (recurring) {
    coach.recurringAvailability = recurring;
  }

  // Update specific date availability if provided
  if (date && slots) {
    // Remove existing slots for this date
    coach.availability = coach.availability.filter(slot => slot.date !== date);
    // Add new slots
    coach.availability.push(...slots.map(time => ({ date, time })));
  }

  await coach.save();
  
  res.json({
    status: 'success',
    message: 'Availability updated successfully',
    data: {
      availableSlots: coach.availability.filter(slot => slot.date === date),
      recurringAvailability: coach.recurringAvailability
    }
  });
});

// Delete availability slot
exports.deleteAvailability = catchAsync(async (req, res) => {
  const coach = await Coach.findOneAndUpdate(
    { user: req.user.id },
    { $pull: { availability: { _id: req.params.id } } },
    { new: true }
  );
  
  if (!coach) {
    throw new AppError('Coach profile not found', 404);
  }
  
  res.json({
    status: 'success',
    message: 'Availability slot deleted successfully',
    data: coach.availability
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
        role: "user",
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
        user: booking.user
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
      .populate('user', 'name')
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
      .populate('user', 'name email')
      .sort({ date: 1 });

    res.json(formatResponse('success', 'Sessions retrieved successfully', { sessions }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Update session status
exports.updateSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json(formatResponse('error', 'Booking not found'));
    }

    res.json(formatResponse('success', 'Session status updated successfully', { booking }));
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

// Get sessions
exports.getSessions = catchAsync(async (req, res) => {
  const sessions = await Booking.find({ coach: req.user.id })
    .populate('user', 'name');
  
  res.json({
    status: 'success',
    data: sessions
  });
});

// Get earnings
exports.getEarnings = catchAsync(async (req, res) => {
  const earnings = await Booking.aggregate([
    { $match: { coach: req.user.id, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  res.json({
    status: 'success',
    data: {
      total: earnings[0]?.total || 0
    }
  });
});

// Get coach availability (public)
exports.getCoachAvailability = catchAsync(async (req, res) => {
  const coach = await Coach.findById(req.params.id)
    .select('availability')
    .populate('user', 'name');

  if (!coach) {
    return res.status(404).json(formatResponse('error', 'Coach not found'));
  }

  res.json(formatResponse('success', 'Coach availability retrieved successfully', {
    availability: coach.availability || [],
    coachName: coach.user.name
  }));
});

// Get coach analytics
exports.getAnalytics = catchAsync(async (req, res) => {
  try {
    const [bookings, earnings, reviews] = await Promise.all([
      Booking.countDocuments({ coach: req.user.id }),
      Booking.aggregate([
        { 
          $match: { 
            coach: new mongoose.Types.ObjectId(req.user.id),
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      Review.find({ coach: req.user.id }).populate('user', 'name')
    ]);

    const analytics = {
      totalBookings: bookings,
      totalEarnings: earnings[0]?.total || 0,
      reviews: reviews
    };

    res.json(formatResponse('success', 'Analytics retrieved successfully', analytics));
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json(formatResponse('error', 'Error fetching analytics'));
  }
});

exports.updateAvailabilitySettings = catchAsync(async (req, res) => {
  const { bookingCutoffHours, availabilityDays, defaultSessionDuration } = req.body;
  
  const coach = await Coach.findOne({ user: req.user._id });
  
  if (!coach) {
    throw new AppError('Coach profile not found', 404);
  }
  
  coach.availabilitySettings = {
    bookingCutoffHours,
    availabilityDays,
    defaultSessionDuration
  };
  
  await coach.save();
  
  res.json({
    status: 'success',
    data: {
      settings: coach.availabilitySettings
    }
  });
});

exports.getAvailabilitySettings = catchAsync(async (req, res) => {
  const coach = await Coach.findOne({ user: req.user._id });
  
  if (!coach) {
    throw new AppError('Coach profile not found', 404);
  }
  
  res.json({
    status: 'success',
    data: {
      settings: coach.availabilitySettings
    }
  });
});