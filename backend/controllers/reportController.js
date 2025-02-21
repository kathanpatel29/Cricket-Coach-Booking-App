const User = require("../models/User");
const Booking = require("../models/Booking");
const Coach = require("../models/Coach");
const { catchAsync } = require("../utils/errorHandler");
const { successResponse } = require("../utils/responseFormatter");
const Review = require('../models/Review');
const ExcelJS = require('exceljs');
const {
  generateBookingReport,
  generateEarningsReport,
  generateCoachReport,
  generateUserReport
} = require('../utils/reportGenerators');
const { formatResponse } = require('../utils/responseFormatter');

// Get summary report
exports.getSummaryReport = async (req, res) => {
  try {
    const bookingReport = await generateBookingReport();
    const earningsReport = await generateEarningsReport();
    const coachReport = await generateCoachReport();
    const userReport = await generateUserReport();

    const summary = {
      bookings: bookingReport.stats,
      earnings: earningsReport.stats,
      topCoaches: coachReport.coaches.slice(0, 5),
      topUsers: userReport.users.slice(0, 5)
    };

    res.json(formatResponse('success', 'Summary report generated', { summary }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get earnings report
exports.getEarningsReport = async (req, res) => {
  try {
    const { startDate, endDate, filters } = req.query;
    const report = await generateEarningsReport(startDate, endDate, filters);
    res.json(formatResponse('success', 'Earnings report generated', report));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get user activity report
exports.getUserActivityReport = catchAsync(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const [loginActivity, bookingActivity] = await Promise.all([
    User.aggregate([
      {
        $match: {
          lastLogin: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$lastLogin" } },
            role: "$role"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': -1 } }
    ]),
    Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': -1 } }
    ])
  ]);

  successResponse(res, 200, {
    loginActivity,
    bookingActivity
  });
});

// Get user stats
exports.getUserStats = catchAsync(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        }
      }
    }
  ]);
  successResponse(res, 200, stats);
});

// Get booking stats
exports.getBookingStats = catchAsync(async (req, res) => {
  const stats = await Booking.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] }
        }
      }
    }
  ]);
  successResponse(res, 200, stats);
});

// Get revenue stats
exports.getRevenueStats = catchAsync(async (req, res) => {
  const stats = await Booking.aggregate([
    {
      $match: { paymentStatus: 'paid' }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } }
  ]);
  successResponse(res, 200, stats);
});

// Get coach performance report
exports.getCoachPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, filters } = req.query;
    const report = await generateCoachReport(startDate, endDate, filters);
    res.json(formatResponse('success', 'Coach performance report generated', report));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get user analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, filters } = req.query;
    const report = await generateUserReport(startDate, endDate, filters);
    res.json(formatResponse('success', 'User analytics generated', report));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Get booking analytics
exports.getBookingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, filters } = req.query;
    const report = await generateBookingReport(startDate, endDate, filters);
    res.json(formatResponse('success', 'Booking analytics generated', report));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Export user report
exports.exportUserReport = async (req, res) => {
  try {
    const report = await generateUserReport();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Total Bookings', key: 'totalBookings', width: 15 },
      { header: 'Completed Bookings', key: 'completedBookings', width: 20 },
      { header: 'Total Spent', key: 'totalSpent', width: 15 }
    ];

    report.users.forEach(user => {
      worksheet.addRow(user);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=users-report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Export booking report
exports.exportBookingReport = async (req, res) => {
  try {
    const report = await generateBookingReport();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bookings');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Coach', key: 'coach', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 }
    ];

    report.bookings.forEach(booking => {
      worksheet.addRow({
        date: booking.date.toLocaleDateString(),
        user: booking.user.name,
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
      'attachment; filename=bookings-report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Export earnings report
exports.exportEarningReport = async (req, res) => {
  try {
    const report = await generateEarningsReport();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Earnings');

    worksheet.columns = [
      { header: 'Period', key: 'period', width: 15 },
      { header: 'Total Earnings', key: 'totalEarnings', width: 20 },
      { header: 'Number of Bookings', key: 'bookingCount', width: 20 }
    ];

    report.earnings.forEach(record => {
      worksheet.addRow({
        period: `${record._id.year}-${record._id.month}`,
        totalEarnings: record.totalEarnings,
        bookingCount: record.bookingCount
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=earnings-report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Generate custom report
exports.generateCustomReport = async (req, res) => {
  try {
    const { reportType, startDate, endDate, filters } = req.body;
    let reportData;

    switch (reportType) {
      case 'bookings':
        reportData = await generateBookingReport(startDate, endDate, filters);
        break;
      case 'earnings':
        reportData = await generateEarningsReport(startDate, endDate, filters);
        break;
      case 'coaches':
        reportData = await generateCoachReport(startDate, endDate, filters);
        break;
      case 'users':
        reportData = await generateUserReport(startDate, endDate, filters);
        break;
      default:
        return res.status(400).json(formatResponse('error', 'Invalid report type'));
    }

    res.json(formatResponse('success', 'Custom report generated', { reportData }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};