const Booking = require('../models/Booking');
const Coach = require('../models/Coach');
const User = require('../models/User');

async function generateBookingReport(startDate, endDate, filters = {}) {
  const query = {};
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (filters.status) query.status = filters.status;
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;

  const bookings = await Booking.find(query)
    .populate('client', 'name email')
    .populate('coach', 'name')
    .sort('-createdAt');

  const stats = {
    totalBookings: bookings.length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.totalAmount, 0)
  };

  return { bookings, stats };
}

async function generateEarningsReport(startDate, endDate, filters = {}) {
  const query = { paymentStatus: 'paid' };
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const earnings = await Booking.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalEarnings: { $sum: '$totalAmount' },
        bookingCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const stats = {
    totalEarnings: earnings.reduce((sum, e) => sum + e.totalEarnings, 0),
    totalBookings: earnings.reduce((sum, e) => sum + e.bookingCount, 0),
    averageBookingValue: earnings.reduce((sum, e) => sum + e.totalEarnings, 0) / 
      earnings.reduce((sum, e) => sum + e.bookingCount, 0)
  };

  return { earnings, stats };
}

async function generateCoachReport(startDate, endDate, filters = {}) {
  const query = {};
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const coaches = await Coach.aggregate([
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'coach',
        as: 'bookings'
      }
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'coach',
        as: 'reviews'
      }
    },
    {
      $project: {
        name: 1,
        totalBookings: { $size: '$bookings' },
        completedBookings: {
          $size: {
            $filter: {
              input: '$bookings',
              as: 'booking',
              cond: { $eq: ['$$booking.status', 'completed'] }
            }
          }
        },
        averageRating: { $avg: '$reviews.rating' },
        totalEarnings: {
          $sum: {
            $filter: {
              input: '$bookings',
              as: 'booking',
              cond: { $eq: ['$$booking.paymentStatus', 'paid'] }
            }
          }
        }
      }
    },
    { $sort: { totalBookings: -1 } }
  ]);

  return { coaches };
}

async function generateClientReport(startDate, endDate, filters = {}) {
  const query = {};
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const clients = await Booking.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$client',
        totalBookings: { $sum: 1 },
        totalSpent: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0]
          }
        },
        completedBookings: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'clientInfo'
      }
    },
    { $unwind: '$clientInfo' },
    {
      $project: {
        name: '$clientInfo.name',
        email: '$clientInfo.email',
        totalBookings: 1,
        completedBookings: 1,
        totalSpent: 1,
        averageSpentPerBooking: {
          $cond: [
            { $eq: ['$totalBookings', 0] },
            0,
            { $divide: ['$totalSpent', '$totalBookings'] }
          ]
        }
      }
    },
    { $sort: { totalSpent: -1 } }
  ]);

  return { clients };
}

module.exports = {
  generateBookingReport,
  generateEarningsReport,
  generateCoachReport,
  generateClientReport
}; 