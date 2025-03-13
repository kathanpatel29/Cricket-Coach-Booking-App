const User = require("../models/User");
const Booking = require("../models/Booking");
const { AppError, catchAsync } = require("../middlewares/errorMiddleware");
const { formatResponse } = require("../utils/responseFormatter");
const mongoose = require("mongoose");

/**
 * @desc Get all users (admin only)
 * @route GET /api/users
 * @access Private/Admin
 */
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select("-password");
  res.json(formatResponse("success", "Users retrieved successfully", { users }));
});

/**
 * @desc Get user by ID (admin only)
 * @route GET /api/users/:id
 * @access Private/Admin
 */
exports.getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) throw new AppError("User not found", 404);
  res.json(formatResponse("success", "User retrieved successfully", { user }));
});

/**
 * @desc Update user profile
 * @route PUT /api/users/profile
 * @access Private/User
 */
exports.updateUserProfile = catchAsync(async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new AppError("Email already in use", 400);
  }

  user.name = name || user.name;
  user.email = email || user.email;
  await user.save();

  res.json(formatResponse("success", "Profile updated successfully", { user }));
});

/**
 * @desc Delete user (admin only)
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found", 404);

  if (user._id.toString() === req.user.id) throw new AppError("Cannot delete your own account", 400);

  await user.deleteOne();
  res.json(formatResponse("success", "User deleted successfully"));
});

/**
 * @desc Get current user's profile
 * @route GET /api/users/me
 * @access Private/User
 */
exports.getCurrentUserProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) throw new AppError("User not found", 404);
  res.json(formatResponse("success", "User profile retrieved", { user }));
});

/**
 * @desc Get user dashboard stats
 * @route GET /api/users/dashboard
 * @access Private/User
 */
exports.getUserDashboardStats = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fix: Convert userId to ObjectId properly or use string comparison based on your MongoDB version
    // Use Promise.all to run multiple database queries in parallel
    const [bookingStats, upcomingBookingsList, recentPaymentsList, user] = await Promise.all([
      // Get booking statistics - fixed ObjectId usage
      Booking.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            upcomingSessions: {
              $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] }
            },
            totalSpent: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$paymentAmount", 0] }
            }
          }
        }
      ]),
      
      // Get upcoming bookings - simplified and separated population
      Booking.find({ 
        user: userId, 
        status: 'confirmed',
        bookingDate: { $gte: new Date() }
      })
      .populate({
        path: 'coach',
        select: 'experience hourlyRate user',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort('bookingDate')
      .limit(5),
      
      // Get recent payments
      Booking.find({ 
        user: userId,
        paymentStatus: 'paid'
      })
      .sort('-updatedAt')
      .limit(5),
      
      // Get user with favorite coaches
      User.findById(userId).populate({
        path: 'favoriteCoaches',
        select: 'user specializations hourlyRate rating',
        populate: {
          path: 'user',
          select: 'name email profileImage'
        }
      })
    ]);
    
    // Extract stats or use defaults
    const stats = bookingStats && bookingStats.length > 0 ? bookingStats[0] : {
      totalSessions: 0,
      upcomingSessions: 0,
      totalSpent: 0
    };
    
    // Format the upcoming bookings for the frontend - with better null handling
    const upcomingBookings = Array.isArray(upcomingBookingsList) ? upcomingBookingsList.map(booking => {
      let coachName = 'Unknown Coach';
      
      // More robust null checking with optional chaining
      if (booking?.coach?.user?.name) {
        coachName = booking.coach.user.name;
      } else if (booking?.coach?._id) {
        coachName = `Coach #${booking.coach._id.toString().substring(0, 5)}`;
      }
      
      // Format the date and time properly
      const date = booking.bookingDate ? new Date(booking.bookingDate) : new Date();
      
      return {
        id: booking._id,
        coachName: coachName,
        date: date,
        time: booking.timeSlot || 'Not specified',
        status: booking.status || 'pending',
        paymentStatus: booking.paymentStatus || 'pending',
        amount: booking.paymentAmount || 0
      };
    }) : [];
    
    // Format recent payments with better null handling
    const recentPayments = Array.isArray(recentPaymentsList) ? recentPaymentsList.map(payment => ({
      id: payment._id,
      date: payment.updatedAt || new Date(),
      amount: payment.paymentAmount || 0,
      status: payment.paymentStatus || 'pending',
      bookingId: payment._id
    })) : [];
    
    // Format favorite coaches
    const favoriteCoaches = user && user.favoriteCoaches ? user.favoriteCoaches.map(coach => ({
      id: coach._id,
      name: coach.user ? coach.user.name : 'Unknown Coach',
      specializations: coach.specializations || [],
      hourlyRate: coach.hourlyRate || 0,
      rating: coach.rating || 0,
      profileImage: coach.user && coach.user.profileImage ? coach.user.profileImage : null
    })) : [];
    
    // Prepare the final response data
    const dashboardData = {
      stats: stats,
      upcomingBookings: upcomingBookings,
      recentPayments: recentPayments,
      favoriteCoaches: favoriteCoaches
    };
    
    console.log("Sending dashboard data:", JSON.stringify(dashboardData, null, 2));
    res.json(formatResponse("success", "User dashboard data retrieved successfully", dashboardData));
  } catch (error) {
    console.error('Error in getUserDashboardStats:', error);
    res.status(500).json(formatResponse("error", "Failed to retrieve dashboard data", { errorMessage: error.message, stack: error.stack }));
  }
});

/**
 * @desc Search users by name or email
 * @route GET /api/users/search
 * @access Private/Admin
 */
exports.searchUsers = catchAsync(async (req, res) => {
  const { query, role } = req.query;

  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } }
    ]
  };

  if (role) searchQuery.role = role;

  const users = await User.find(searchQuery)
    .select("name email role")
    .limit(10);

  res.json(formatResponse("success", "Users retrieved successfully", { users }));
});

/**
 * @desc Add a coach to user's favorites
 * @route POST /api/user/favorites/:coachId
 * @access Private/User
 */
exports.addToFavorites = catchAsync(async (req, res) => {
  const { coachId } = req.params;
  const userId = req.user.id;

  // Validate coach existence
  const Coach = require("../models/Coach");
  const coach = await Coach.findById(coachId);
  if (!coach) throw new AppError("Coach not found", 404);

  // Check if coach is already in favorites
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  // Check if coach is already in favorites
  if (user.favoriteCoaches.includes(coachId)) {
    return res.json(formatResponse("success", "Coach is already in favorites", { user }));
  }

  // Add coach to favorites
  user.favoriteCoaches.push(coachId);
  await user.save();

  res.json(formatResponse("success", "Coach added to favorites", { user }));
});

/**
 * @desc Remove a coach from user's favorites
 * @route DELETE /api/user/favorites/:coachId
 * @access Private/User
 */
exports.removeFromFavorites = catchAsync(async (req, res) => {
  const { coachId } = req.params;
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  // Remove coach from favorites
  user.favoriteCoaches = user.favoriteCoaches.filter(
    (id) => id.toString() !== coachId
  );
  await user.save();

  res.json(formatResponse("success", "Coach removed from favorites", { user }));
});

/**
 * @desc Get user's favorite coaches
 * @route GET /api/user/favorites
 * @access Private/User
 */
exports.getFavoriteCoaches = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId).populate({
    path: "favoriteCoaches",
    select: "user specializations hourlyRate rating",
    populate: {
      path: "user",
      select: "name email profileImage"
    }
  });

  if (!user) throw new AppError("User not found", 404);

  const favoriteCoaches = user.favoriteCoaches.map(coach => ({
    id: coach._id,
    name: coach.user ? coach.user.name : 'Unknown Coach',
    specializations: coach.specializations || [],
    hourlyRate: coach.hourlyRate || 0,
    rating: coach.rating || 0,
    profileImage: coach.user && coach.user.profileImage ? coach.user.profileImage : null
  }));

  res.json(formatResponse("success", "Favorite coaches retrieved", { favoriteCoaches }));
});
