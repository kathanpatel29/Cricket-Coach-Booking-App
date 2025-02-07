const User = require("../models/User");
const Booking = require("../models/Booking");
const Coach = require("../models/Coach");

exports.getSummaryReport = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCoaches = await Coach.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const revenue = await Booking.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    res.json({
      totalUsers,
      totalCoaches,
      totalBookings,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEarningsReport = async (req, res) => {
  try {
    const earnings = await Booking.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$coach", totalEarnings: { $sum: "$totalAmount" } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "coach" } },
    ]);

    res.json(earnings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserActivityReport = async (req, res) => {
  try {
    const userBookings = await Booking.aggregate([
      { $group: { _id: "$client", totalBookings: { $sum: 1 } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    ]);

    res.json(userBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
