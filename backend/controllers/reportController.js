const User = require("../models/User");
const Booking = require("../models/Booking");
const Coach = require("../models/Coach");
const Review = require("../models/Review");
const { AppError, catchAsync } = require("../middlewares/errorMiddleware");
const { formatResponse } = require("../utils/responseFormatter");
const ExcelJS = require("exceljs");

/**
 * @desc Get summary report (bookings, earnings, top users/coaches)
 * @route GET /api/reports/summary
 * @access Private/Admin
 */
exports.getSummaryReport = catchAsync(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalBookings = await Booking.countDocuments();
  const totalRevenue = await Booking.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$paymentAmount" } } }
  ]);

  const topCoaches = await Coach.find({ isApproved: true })
    .sort({ totalEarnings: -1 })
    .limit(5)
    .select("user totalEarnings totalSessions")
    .populate("user", "name email");

  const topUsers = await User.aggregate([
    { $lookup: { from: "bookings", localField: "_id", foreignField: "user", as: "bookings" } },
    { $addFields: { totalBookings: { $size: "$bookings" } } },
    { $sort: { totalBookings: -1 } },
    { $limit: 5 },
    { $project: { name: 1, email: 1, totalBookings: 1 } }
  ]);

  res.json(formatResponse("success", "Summary report generated", {
    totalUsers,
    totalBookings,
    totalRevenue: totalRevenue[0]?.total || 0,
    topCoaches,
    topUsers
  }));
});

/**
 * @desc Get earnings report
 * @route GET /api/reports/earnings
 * @access Private/Admin
 */
exports.getEarningsReport = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = startDate && endDate ? { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } } : {};

  const earningsReport = await Booking.aggregate([
    { $match: { paymentStatus: "paid", ...filter } },
    { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, totalEarnings: { $sum: "$paymentAmount" } } },
    { $sort: { "_id.year": -1, "_id.month": -1 } }
  ]);

  res.json(formatResponse("success", "Earnings report generated", { earningsReport }));
});

/**
 * @desc Get user activity report (logins and bookings)
 * @route GET /api/reports/user-activity
 * @access Private/Admin
 */
exports.getUserActivityReport = catchAsync(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const loginActivity = await User.aggregate([
    { $match: { lastLogin: { $gte: startDate } } },
    { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$lastLogin" } }, role: "$role" }, count: { $sum: 1 } } },
    { $sort: { "_id.date": -1 } }
  ]);

  const bookingActivity = await Booking.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, status: "$status" }, count: { $sum: 1 } } },
    { $sort: { "_id.date": -1 } }
  ]);

  res.json(formatResponse("success", "User activity report generated", { loginActivity, bookingActivity }));
});

/**
 * @desc Get coach performance report
 * @route GET /api/reports/coach-performance
 * @access Private/Admin
 */
exports.getCoachPerformanceReport = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = startDate && endDate ? { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } } : {};

  const coachPerformance = await Booking.aggregate([
    { $match: { status: "completed", ...filter } },
    { $group: { _id: "$coach", totalSessions: { $sum: 1 }, totalEarnings: { $sum: "$paymentAmount" } } },
    { $lookup: { from: "coaches", localField: "_id", foreignField: "_id", as: "coachDetails" } },
    { $unwind: "$coachDetails" },
    { $lookup: { from: "users", localField: "coachDetails.user", foreignField: "_id", as: "userDetails" } },
    { $unwind: "$userDetails" },
    { $project: { "userDetails.name": 1, "userDetails.email": 1, totalSessions: 1, totalEarnings: 1 } },
    { $sort: { totalEarnings: -1 } }
  ]);

  res.json(formatResponse("success", "Coach performance report generated", { coachPerformance }));
});

/**
 * @desc Export user report as Excel file
 * @route GET /api/reports/export/users
 * @access Private/Admin
 */
exports.exportUserReport = catchAsync(async (req, res) => {
  const users = await User.find().select("name email role createdAt");

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Users");

  worksheet.columns = [
    { header: "Name", key: "name", width: 20 },
    { header: "Email", key: "email", width: 30 },
    { header: "Role", key: "role", width: 15 },
    { header: "Created At", key: "createdAt", width: 20 }
  ];

  users.forEach(user => worksheet.addRow(user));

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=users-report.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

/**
 * @desc Generate various reports based on type
 * @route GET /api/admin/reports/generate
 * @access Private/Admin
 */
exports.generateReports = catchAsync(async (req, res) => {
  const { type, startDate, endDate } = req.query;
  
  if (!type) {
    throw new AppError("Report type is required", 400);
  }
  
  // Set date range
  const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const end = endDate ? new Date(endDate) : new Date();
  
  let reportData;
  let reportTitle;
  
  switch (type) {
    case 'bookings':
      reportData = await generateBookingsReport(start, end);
      reportTitle = 'Bookings Report';
      break;
    case 'revenue':
      reportData = await generateRevenueReport(start, end);
      reportTitle = 'Revenue Report';
      break;
    case 'coaches':
      reportData = await generateCoachesReport();
      reportTitle = 'Coaches Performance Report';
      break;
    case 'users':
      reportData = await generateUsersReport();
      reportTitle = 'Users Activity Report';
      break;
    default:
      throw new AppError("Invalid report type", 400);
  }
  
  // Create a unique report ID
  const reportId = `${type}_${Date.now()}`;
  
  // Store report in memory (in a real app, you'd store this in a database)
  // For simplicity, we'll just return the data directly
  
  res.json(formatResponse('success', 'Report generated successfully', { 
    reportId,
    reportTitle,
    dateRange: { start, end },
    data: reportData
  }));
});

/**
 * @desc Get a specific report by ID
 * @route GET /api/admin/reports/:id
 * @access Private/Admin
 */
exports.getReportById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // In a real application, you would fetch the report from a database
  // For this implementation, we'll generate a sample report
  
  const [type, timestamp] = id.split('_');
  
  if (!type || !timestamp) {
    throw new AppError("Invalid report ID", 400);
  }
  
  const end = new Date();
  const start = new Date(new Date().setMonth(new Date().getMonth() - 1));
  
  let reportData;
  let reportTitle;
  
  switch (type) {
    case 'bookings':
      reportData = await generateBookingsReport(start, end);
      reportTitle = 'Bookings Report';
      break;
    case 'revenue':
      reportData = await generateRevenueReport(start, end);
      reportTitle = 'Revenue Report';
      break;
    case 'coaches':
      reportData = await generateCoachesReport();
      reportTitle = 'Coaches Performance Report';
      break;
    case 'users':
      reportData = await generateUsersReport();
      reportTitle = 'Users Activity Report';
      break;
    default:
      throw new AppError("Invalid report type", 400);
  }
  
  res.json(formatResponse('success', 'Report retrieved successfully', { 
    reportId: id,
    reportTitle,
    dateRange: { start, end },
    data: reportData
  }));
});

// Helper functions for report generation
async function generateBookingsReport(start, end) {
  const bookings = await Booking.find({
    createdAt: { $gte: start, $lte: end }
  })
  .populate('user', 'name email')
  .populate('coach', 'user')
  .populate('timeSlot', 'date startTime duration')
  .sort('-createdAt');
  
  const statusCounts = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    'no-show': 0
  };
  
  bookings.forEach(booking => {
    if (statusCounts[booking.status] !== undefined) {
      statusCounts[booking.status]++;
    }
  });
  
  return {
    totalBookings: bookings.length,
    statusCounts,
    bookings: bookings.map(b => ({
      id: b._id,
      user: b.user ? b.user.name : 'Unknown',
      coach: b.coach && b.coach.user ? b.coach.user.name : 'Unknown',
      date: b.timeSlot ? b.timeSlot.date : 'Unknown',
      time: b.timeSlot ? b.timeSlot.startTime : 'Unknown',
      status: b.status,
      paymentStatus: b.paymentStatus,
      amount: b.paymentAmount
    }))
  };
}

async function generateRevenueReport(start, end) {
  const payments = await Booking.aggregate([
    { $match: { 
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'paid'
    }},
    { $group: {
      _id: { 
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" }
      },
      totalRevenue: { $sum: "$paymentAmount" },
      count: { $sum: 1 }
    }},
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);
  
  const totalRevenue = payments.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalBookings = payments.reduce((sum, p) => sum + p.count, 0);
  
  return {
    totalRevenue,
    totalBookings,
    averageBookingValue: totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0,
    monthlyBreakdown: payments.map(p => ({
      month: `${p._id.year}-${p._id.month.toString().padStart(2, '0')}`,
      revenue: p.totalRevenue,
      bookings: p.count
    }))
  };
}

async function generateCoachesReport() {
  const coaches = await Coach.find({ isApproved: true })
    .populate('user', 'name email')
    .sort('-totalEarnings');
  
  return {
    totalCoaches: coaches.length,
    coaches: coaches.map(c => ({
      id: c._id,
      name: c.user ? c.user.name : 'Unknown',
      email: c.user ? c.user.email : 'Unknown',
      specializations: c.specializations,
      hourlyRate: c.hourlyRate,
      totalSessions: c.totalSessions || 0,
      totalEarnings: c.totalEarnings || 0,
      averageRating: c.averageRating || 0,
      reviewCount: c.reviews ? c.reviews.length : 0
    }))
  };
}

async function generateUsersReport() {
  const users = await User.aggregate([
    { $match: { role: 'user' } },
    { $lookup: {
      from: 'bookings',
      localField: '_id',
      foreignField: 'user',
      as: 'bookings'
    }},
    { $addFields: {
      totalBookings: { $size: '$bookings' },
      totalSpent: {
        $sum: {
          $map: {
            input: {
              $filter: {
                input: '$bookings',
                as: 'booking',
                cond: { $eq: ['$$booking.paymentStatus', 'paid'] }
              }
            },
            as: 'booking',
            in: '$$booking.paymentAmount'
          }
        }
      }
    }},
    { $sort: { totalSpent: -1 } },
    { $project: {
      _id: 1,
      name: 1,
      email: 1,
      totalBookings: 1,
      totalSpent: 1,
      createdAt: 1
    }}
  ]);
  
  return {
    totalUsers: users.length,
    users: users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      totalBookings: u.totalBookings || 0,
      totalSpent: u.totalSpent || 0,
      joinedDate: u.createdAt
    }))
  };
}
