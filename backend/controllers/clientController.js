const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const { catchAsync } = require('../utils/errorHandler');
const mongoose = require('mongoose');

// Get dashboard stats for client
exports.getDashboardStats = catchAsync(async (req, res) => {
  // Get total bookings
  const totalBookings = await Booking.countDocuments({ 
    client: req.user.id 
  });

  // Get upcoming bookings
  const upcomingBookings = await Booking.find({
    client: req.user.id,
    date: { $gte: new Date() },
    status: { $in: ['confirmed', 'pending'] }
  }).populate('coach', 'name').limit(5);

  // Get total spent
  const totalSpent = await Payment.aggregate([
    { 
      $match: { 
        client: mongoose.Types.ObjectId(req.user.id),
        status: 'succeeded'
      } 
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Get recent reviews
  const recentReviews = await Review.find({
    client: req.user.id
  }).populate('coach', 'name').limit(5);

  res.json({
    status: 'success',
    data: {
      totalBookings,
      upcomingBookings,
      totalSpent: totalSpent[0]?.total || 0,
      recentReviews
    }
  });
}); 