const Coach = require("../models/Coach");
const User = require("../models/User");
const path = require('path');
const fs = require('fs');
const { formatResponse } = require('../utils/responseFormatter');
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const { AppError, catchAsync } = require('../utils/errorHandler');

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

    const coachData = {
      user: req.user.id,
      ...req.body
    };

    const coach = await Coach.create(coachData);
    
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
exports.getAllCoaches = catchAsync(async (req, res) => {
  const { specialization, experience, rating, search } = req.query;
  
  // Build query
  const query = { 
    approvalStatus: 'approved',
    'availability.0': { $exists: true } // Only show coaches with at least one availability entry
  };
  
  // Add filters if provided
  if (specialization) {
    query.specializations = specialization;
  }
  
  if (experience) {
    const [min, max] = experience.split('-').map(Number);
    if (max) {
      query.experience = { $gte: min, $lte: max };
    } else {
      // Handle "10+" case
      query.experience = { $gte: min };
    }
  }
  
  if (rating) {
    query.averageRating = { $gte: Number(rating) };
  }
  
  if (search) {
    query.$or = [
      { 'user.name': { $regex: search, $options: 'i' } },
      { bio: { $regex: search, $options: 'i' } }
    ];
  }

  const coaches = await Coach.find(query)
    .populate('user', 'name email profileImage')
    .select('-approvalNotes -rejectionNotes')
    .sort('-averageRating');
  
  res.json(formatResponse('success', 'Coaches retrieved successfully', { coaches }));
});

exports.getCoachById = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id)
      .populate('user', 'name email')
      .populate('reviews');

    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach not found'));
    }

    res.json(formatResponse('success', 'Coach retrieved successfully', { coach }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

exports.getCoachProfile = async (req, res) => {
  try {
    const coach = await Coach.findOne({ user: req.user.id })
      .populate("user", "name email isApproved");
    
    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach profile not found'));
    }

    res.json(formatResponse('success', 'Coach profile retrieved successfully', { coach }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get coach's availability
exports.getAvailability = async (req, res) => {
  try {
    const coach = await Coach.findOne({ user: req.user.id });
    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach profile not found'));
    }

    return res.json(formatResponse('success', 'Availability retrieved successfully', {
      availability: coach.availability || []
    }));
  } catch (error) {
    console.error('Error in getAvailability:', error);
    return res.status(500).json(formatResponse('error', 'Failed to retrieve availability'));
  }
};

// Update coach's availability
exports.updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    const { formatResponse } = require('../utils/responseFormatter');

    // Validate availability data
    if (!Array.isArray(availability)) {
      return res.status(400).json(formatResponse('error', 'Availability must be an array'));
    }

    // Validate each time slot
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    for (const slot of availability) {
      // Check required fields
      if (!slot.date || !slot.startTime || !slot.endTime) {
        return res.status(400).json(formatResponse('error', 'Each slot must have date, startTime, and endTime'));
      }

      // Validate date format
      if (!dateRegex.test(slot.date)) {
        return res.status(400).json(formatResponse('error', `Invalid date format for ${slot.date}. Use YYYY-MM-DD format`));
      }

      // Validate time format
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return res.status(400).json(formatResponse('error', `Invalid time format for ${slot.date}. Use HH:mm format`));
      }

      // Validate date is not in the past
      const slotDate = new Date(slot.date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      if (slotDate < now) {
        return res.status(400).json(formatResponse('error', `Cannot set availability for past date: ${slot.date}`));
      }

      // Validate end time is after start time
      const startDateTime = new Date(`${slot.date}T${slot.startTime}`);
      const endDateTime = new Date(`${slot.date}T${slot.endTime}`);
      
      if (startDateTime >= endDateTime) {
        return res.status(400).json(formatResponse('error', `End time must be after start time for ${slot.date}`));
      }
    }

    // Find the coach
    const coach = await Coach.findOne({ user: req.user._id });
    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach profile not found'));
    }

    // Update availability
    coach.availability = availability;
    await coach.save();

    return res.json(formatResponse('success', 'Availability updated successfully', { availability: coach.availability }));
  } catch (error) {
    console.error('Update availability error:', error);
    return res.status(500).json(formatResponse('error', 'Failed to update availability'));
  }
};

// Delete availability for a specific date
exports.deleteAvailability = async (req, res) => {
  try {
    const { date } = req.params;
    
    const coach = await Coach.findOne({ user: req.user.id });
    if (!coach) {
      return res.status(404).json({ message: "Coach profile not found" });
    }

    // Remove availability for the specified date
    const dateString = new Date(date).toISOString().split('T')[0];
    coach.availability = coach.availability.filter(a => 
      a.date.toISOString().split('T')[0] !== dateString
    );

    await coach.save();
    res.json({ message: "Availability deleted successfully" });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({ message: error.message });
  }
};

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
      .populate('user', 'name email')
      .populate('reviews')
      .select('-availability -earnings');

    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach not found'));
    }

    res.json(formatResponse('success', 'Coach profile retrieved successfully', { coach }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
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

// Get coach's bookings
exports.getCoachBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ coach: req.user.id })
      .populate('client', 'name email')
      .sort('-createdAt');

    res.json(formatResponse('success', 'Bookings retrieved successfully', { bookings }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json(formatResponse('error', 'Booking not found'));
    }

    if (booking.coach.toString() !== req.user.id) {
      return res.status(403).json(formatResponse('error', 'Not authorized'));
    }

    booking.status = req.body.status;
    await booking.save();

    res.json(formatResponse('success', 'Booking status updated successfully', { booking }));
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

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [bookings, reviews, earnings] = await Promise.all([
      Booking.find({ coach: req.user.id }),
      Review.find({ coach: req.user.id }),
      Booking.find({ 
        coach: req.user.id,
        status: 'completed',
        paymentStatus: 'paid'
      })
    ]);

    // Calculate stats
    const totalSessions = bookings.length;
    const upcomingSessions = bookings.filter(b => 
      b.status === 'confirmed' && new Date(b.date) > new Date()
    ).length;
    const totalEarnings = earnings.reduce((acc, b) => acc + b.amount, 0);
    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;
    const completedSessions = bookings.filter(b => b.status === 'completed').length;
    const completionRate = totalSessions > 0
      ? (completedSessions / totalSessions) * 100
      : 0;

    const stats = {
      totalSessions,
      upcomingSessions,
      totalEarnings,
      averageRating,
      totalReviews: reviews.length,
      completionRate: Math.round(completionRate)
    };

    res.json(formatResponse('success', 'Dashboard stats retrieved successfully', { stats }));
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
    const coach = await Coach.findOne({ user: req.user.id });
    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach profile not found'));
    }

    return res.json(formatResponse('success', 'Emergency off dates retrieved successfully', {
      emergencyOff: coach.emergencyOff || []
    }));
  } catch (error) {
    console.error('Error in getEmergencyOff:', error);
    return res.status(500).json(formatResponse('error', 'Failed to retrieve emergency off dates'));
  }
};

// Set emergency off dates
exports.setEmergencyOff = async (req, res) => {
  try {
    const { date, reason, options } = req.body;

    if (!date || !reason) {
      return res.status(400).json(formatResponse('error', 'Date and reason are required'));
    }

    const coach = await Coach.findOne({ user: req.user.id });
    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach profile not found'));
    }

    // Check if date already exists
    const existingDate = coach.emergencyOff.find(off => off.date === date);
    if (existingDate) {
      return res.status(400).json(formatResponse('error', 'Emergency off already set for this date'));
    }

    // Add new emergency off date
    coach.emergencyOff.push({
      date,
      reason,
      options: {
        refund: options?.refund ?? true,
        reschedule: options?.reschedule ?? true,
        cancel: options?.cancel ?? true
      }
    });

    await coach.save();

    return res.json(formatResponse('success', 'Emergency off set successfully', {
      emergencyOff: coach.emergencyOff
    }));
  } catch (error) {
    console.error('Error in setEmergencyOff:', error);
    return res.status(500).json(formatResponse('error', 'Failed to set emergency off'));
  }
};