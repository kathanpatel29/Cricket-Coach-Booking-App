const User = require("../models/User")
const Coach = require("../models/Coach")
const Booking = require("../models/Booking")
const Review = require("../models/Review")
const jwt = require("jsonwebtoken")

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, admin_secret_key } = req.body

    if (role === "admin" && admin_secret_key !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid admin secret key" })
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      isApproved: role === "client" || role === "admin", // Coaches are not approved by default
      admin_secret_key: role === "admin" ? admin_secret_key : null,
    })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved },
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password, admin_secret_key } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    if (user.role === "admin" && admin_secret_key !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: "Invalid admin secret key" })
    }

    if (user.role === "coach" && !user.isApproved) {
      return res.status(403).json({ message: "Your account is pending approval" })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" })
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved },
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -admin_secret_key")
    res.json(user)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalCoaches = await Coach.countDocuments()
    const totalBookings = await Booking.countDocuments()
    const revenue = await Booking.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])

    res.json({
      totalUsers,
      totalCoaches,
      totalBookings,
      revenue: revenue[0]?.total || 0,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getPendingCoaches = async (req, res) => {
  try {
    const pendingCoaches = await User.find({ role: "coach", isApproved: false }).select("-password -admin_secret_key")
    res.json(pendingCoaches)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getRecentReviews = async (req, res) => {
  try {
    const recentReviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("coach", "user specialization")
      .populate("client", "name")
    res.json(recentReviews)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

