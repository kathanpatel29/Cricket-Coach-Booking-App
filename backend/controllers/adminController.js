const User = require('../models/User');
const Coach = require('../models/Coach');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const ExcelJS = require('exceljs');
const { formatResponse } = require('../utils/responseFormatter');
const { AppError, catchAsync } = require('../utils/errorHandler');

// User Management
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('-password');
  const response = formatResponse('success', 'Users retrieved successfully', { users });
  res.status(200).json(response);
});

exports.getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const response = formatResponse('success', 'User retrieved successfully', { user });
  res.status(200).json(response);
});

exports.updateUser = catchAsync(async (req, res) => {
  const { name, email, role, isActive } = req.body;
  
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent updating own account through admin route
  if (user._id.toString() === req.user.id) {
    throw new AppError('Use profile update route for your own account', 400);
  }

  // Check email uniqueness if email is being updated
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.role = role || user.role;
  user.isActive = isActive !== undefined ? isActive : user.isActive;

  const updatedUser = await user.save();
  updatedUser.password = undefined;

  const response = formatResponse('success', 'User updated successfully', { user: updatedUser });
  res.status(200).json(response);
});

exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent deleting own account through admin route
  if (user._id.toString() === req.user.id) {
    throw new AppError('Cannot delete your own account through this route', 400);
  }

  await user.deleteOne();
  const response = formatResponse('success', 'User deleted successfully', null);
  res.status(200).json(response);
});

// Coach Management
exports.getPendingCoaches = async (req, res) => {
  try {
    const pendingCoaches = await Coach.find({
      approvalStatus: 'pending'
    }).populate('user', 'name email profileImage');

    res.json(formatResponse('success', 'Pending coaches retrieved successfully', pendingCoaches));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error fetching pending coaches'));
  }
};

exports.approveCoach = async (req, res) => {
  try {
    const coach = await Coach.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus: 'approved',
        isApproved: true,
        approvalDate: Date.now(),
        approvedBy: req.user._id
      },
      { new: true }
    ).populate('user', 'name email profileImage');

    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach not found'));
    }

    res.json(formatResponse('success', 'Coach approved successfully', coach));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error approving coach'));
  }
};

exports.rejectCoach = async (req, res) => {
  try {
    const { reason } = req.body;
    const coach = await User.findById(req.params.id);

    if (!coach) {
      return res.status(404).json(formatResponse('error', 'Coach not found'));
    }

    if (coach.role !== 'coach') {
      return res.status(400).json(formatResponse('error', 'User is not a coach'));
    }

    coach.approvalStatus = 'rejected';
    coach.isApproved = false;
    coach.rejectionReason = reason;
    await coach.save();

    res.status(200).json(formatResponse('success', 'Coach rejected successfully', coach));
  } catch (error) {
    res.status(500).json(formatResponse('error', 'Error rejecting coach'));
  }
};

// Get all coaches
exports.getAllCoaches = async (req, res) => {
  try {
    const coaches = await Coach.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(formatResponse('success', 'Coaches retrieved successfully', {
      coaches
    }));
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json(formatResponse('error', 'Failed to fetch coaches'));
  }
};

// Booking Management
exports.getAllBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find()
    .populate('client', 'name email')
    .populate('coach', 'name email')
    .sort('-createdAt');

  const response = formatResponse('success', 'All bookings retrieved successfully', { bookings });
  res.status(200).json(response);
});

exports.updateBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  booking.status = status || booking.status;
  booking.adminNotes = notes || booking.adminNotes;
  booking.updatedBy = req.user._id;
  await booking.save();

  const response = formatResponse('success', 'Booking updated successfully', { booking });
  res.status(200).json(response);
});

// Review Moderation
exports.getPendingReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ status: 'pending' })
    .populate('client', 'name email')
    .populate('coach', 'name email')
    .sort('-createdAt');

  const response = formatResponse('success', 'Pending reviews retrieved successfully', { reviews });
  res.status(200).json(response);
});

exports.moderateReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, moderationNotes } = req.body;

  const review = await Review.findById(id);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  review.status = status;
  review.moderationNotes = moderationNotes;
  review.moderatedBy = req.user._id;
  review.moderatedAt = new Date();
  await review.save();

  const response = formatResponse('success', 'Review moderated successfully', { review });
  res.status(200).json(response);
});

// Dashboard Stats
exports.getDashboardStats = catchAsync(async (req, res) => {
  try {
    console.log('Starting getDashboardStats');

    const [userStats, bookingStats, revenueStats] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: { 
              $sum: { 
                $cond: [
                  { $eq: [{ $ifNull: ['$isActive', false] }, true] }, 
                  1, 
                  0
                ] 
              } 
            }
          }
        }
      ]).exec(),
      Booking.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$status', 'pending'] },
            count: { $sum: 1 },
            revenue: { 
              $sum: { 
                $ifNull: ['$totalAmount', 0] 
              } 
            }
          }
        }
      ]).exec(),
      Payment.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { 
              $sum: { 
                $ifNull: ['$amount', 0] 
              } 
            },
            platformFees: { 
              $sum: { 
                $ifNull: ['$platformFee', 0] 
              } 
            }
          }
        }
      ]).exec()
    ]);

    console.log('Stats retrieved:', { userStats, bookingStats, revenueStats });

    // Format the response data
    const formattedStats = {
      users: {
        total: userStats.reduce((acc, stat) => acc + stat.count, 0),
        byRole: userStats.reduce((acc, stat) => {
          acc[stat._id || 'unknown'] = {
            count: stat.count,
            active: stat.active
          };
          return acc;
        }, {})
      },
      bookings: {
        total: bookingStats.reduce((acc, stat) => acc + stat.count, 0),
        totalRevenue: bookingStats.reduce((acc, stat) => acc + (stat.revenue || 0), 0),
        byStatus: bookingStats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            revenue: stat.revenue || 0
          };
          return acc;
        }, {})
      },
      revenue: {
        total: revenueStats[0]?.totalRevenue || 0,
        platformFees: revenueStats[0]?.platformFees || 0,
        netRevenue: (revenueStats[0]?.totalRevenue || 0) - (revenueStats[0]?.platformFees || 0)
      }
    };

    console.log('Formatted stats:', formattedStats);
    const response = formatResponse('success', 'Dashboard statistics retrieved successfully', formattedStats);
    res.status(200).json(response);
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    throw new AppError('Error fetching dashboard statistics: ' + error.message, 500);
  }
});

// Reports
exports.getUserStats = catchAsync(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
        inactive: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } }
      }
    }
  ]);

  const response = formatResponse('success', 'User statistics retrieved successfully', { stats });
  res.status(200).json(response);
});

exports.getBookingStats = catchAsync(async (req, res) => {
  const stats = await Booking.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  const response = formatResponse('success', 'Booking statistics retrieved successfully', { stats });
  res.status(200).json(response);
});

exports.getRevenueStats = catchAsync(async (req, res) => {
  const stats = await Payment.aggregate([
    {
      $group: {
        _id: { $month: '$createdAt' },
        revenue: { $sum: '$amount' },
        platformFees: { $sum: '$platformFee' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  const response = formatResponse('success', 'Revenue statistics retrieved successfully', { stats });
  res.status(200).json(response);
});

exports.getCoachPerformance = catchAsync(async (req, res) => {
  const performance = await Coach.aggregate([
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'coach',
        as: 'reviews'
      }
    },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'coach',
        as: 'bookings'
      }
    },
    {
      $project: {
        name: 1,
        averageRating: { $avg: '$reviews.rating' },
        totalBookings: { $size: '$bookings' },
        totalEarnings: { $sum: '$bookings.totalAmount' }
      }
    }
  ]);

  const response = formatResponse('success', 'Coach performance retrieved successfully', { performance });
  res.status(200).json(response);
});

// Export Data
exports.exportUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('-password');
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');
  
  worksheet.columns = [
    { header: 'Name', key: 'name' },
    { header: 'Email', key: 'email' },
    { header: 'Role', key: 'role' },
    { header: 'Status', key: 'isActive' },
    { header: 'Created At', key: 'createdAt' }
  ];

  users.forEach(user => {
    worksheet.addRow({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive ? 'Active' : 'Inactive',
      createdAt: user.createdAt.toLocaleDateString()
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=users.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
});

exports.exportBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find()
    .populate('client', 'name email')
    .populate('coach', 'name email');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Bookings');

  worksheet.columns = [
    { header: 'Date', key: 'date' },
    { header: 'Client', key: 'client' },
    { header: 'Coach', key: 'coach' },
    { header: 'Status', key: 'status' },
    { header: 'Amount', key: 'amount' }
  ];

  bookings.forEach(booking => {
    worksheet.addRow({
      date: booking.date.toLocaleDateString(),
      client: booking.client.name,
      coach: booking.coach.name,
      status: booking.status,
      amount: booking.totalAmount
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=bookings.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
});

exports.exportRevenue = catchAsync(async (req, res) => {
  const payments = await Payment.find()
    .populate('booking')
    .sort('-createdAt');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Revenue');

  worksheet.columns = [
    { header: 'Date', key: 'date' },
    { header: 'Amount', key: 'amount' },
    { header: 'Platform Fee', key: 'platformFee' },
    { header: 'Coach Payout', key: 'coachPayout' },
    { header: 'Status', key: 'status' }
  ];

  payments.forEach(payment => {
    worksheet.addRow({
      date: payment.createdAt.toLocaleDateString(),
      amount: payment.amount,
      platformFee: payment.platformFee,
      coachPayout: payment.coachPayout,
      status: payment.status
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=revenue.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
});

// Add other missing functions similarly 