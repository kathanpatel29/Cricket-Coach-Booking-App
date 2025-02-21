const User = require("../models/User");
const Coach = require("../models/Coach");
const Booking = require("../models/Booking");
const { AppError, catchAsync } = require("../utils/errorHandler");
const { successResponse, formatResponse } = require("../utils/responseFormatter");
const { deleteOldProfileImage } = require('../utils/imageUpload');
const mongoose = require('mongoose');

// Get all users (admin only)
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('-password');
  successResponse(res, 200, { users });
});

// Get user by ID (admin only)
exports.getUserById = catchAsync(async (req, res) => {
 const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  successResponse(res, 200, { user });
});

// Update user (admin only)
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

  successResponse(res, 200, { user: updatedUser });
});

// Delete user (admin only)
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
  successResponse(res, 200, null, 'User deleted successfully');
});

// Get dashboard stats (admin only)
exports.getDashboardStats = catchAsync(async (req, res) => {
  const stats = await Booking.aggregate([
    { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        upcomingSessions: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$status', 'confirmed'] },
                { $gt: ['$date', new Date()] }
              ]},
              1,
              0
            ]
          }
        },
        totalSpent: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] }
        },
        reviewsGiven: {
          $sum: { $cond: [{ $ifNull: ['$review', false] }, 1, 0] }
        }
      }
    }
  ]);

  res.json({
    status: 'success',
    data: stats[0] || {
      totalSessions: 0,
      upcomingSessions: 0,
      totalSpent: 0,
      reviewsGiven: 0
    }
  });
});

exports.getUserProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password');
  
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // If requesting profile image
  if (req.query.profileImage && user.profileImage) {
    res.set('Content-Type', user.profileImage.contentType);
    return res.send(user.profileImage.data);
  }

  successResponse(res, 200, { user });
});

exports.updateUserProfile = catchAsync(async (req, res) => {
  const { name, email } = req.body;
  const userId = req.params.id;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Check email uniqueness if email is being updated
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }
  }

  // Update user fields
  user.name = name || user.name;
  user.email = email || user.email;

  const updatedUser = await user.save();
  updatedUser.password = undefined;

  successResponse(res, 200, { user: updatedUser }, "Profile updated successfully");
});

exports.updateUserStatus = catchAsync(async (req, res) => {
  const { isActive, reason } = req.body;
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Prevent deactivating own account
  if (user._id.toString() === req.user.id) {
    throw new AppError("Cannot modify your own account status", 400);
  }

  user.isActive = isActive;
  user.statusUpdateReason = reason;
  user.statusUpdatedAt = new Date();
  user.statusUpdatedBy = req.user.id;

  await user.save();
  user.password = undefined;

  successResponse(res, 200, { user }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
});

exports.getUserStats = catchAsync(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        inactive: {
          $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
        }
      }
    }
  ]);

  const recentUsers = await User.find()
    .select('name email role createdAt isActive')
    .sort({ createdAt: -1 })
    .limit(5);

  successResponse(res, 200, { stats, recentUsers });
});

exports.searchUsers = catchAsync(async (req, res) => {
  const { query, role } = req.query;
  
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  };

  if (role) {
    searchQuery.role = role;
  }

  const users = await User.find(searchQuery)
    .select('name email role isActive')
    .limit(10);

  successResponse(res, 200, { users });
});

// Get current user profile
exports.getCurrentUserProfile = catchAsync(async (req, res) => {
  console.log('User ID from request:', req.user.id);
  
  const user = await User.findById(req.user.id).select('-password');
  console.log('Found user:', user);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  successResponse(res, 200, { user });
});

// Update current user profile
exports.updateCurrentUserProfile = catchAsync(async (req, res) => {
  const { name, email, phone } = req.body;
  
  // Check if user exists
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check email uniqueness if email is being updated
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }
  }

  // Update basic user fields
  user.name = name || user.name;
  user.email = email || user.email;
  user.phone = phone || user.phone;

  const updatedUser = await user.save();
  updatedUser.password = undefined;

  successResponse(res, 200, { user: updatedUser }, 'Profile updated successfully');
});

// Delete current user account
exports.deleteCurrentUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Delete profile image if it exists and is not the default
    if (user.profileImage) {
      deleteOldProfileImage(user.profileImage);
    }

    await User.findByIdAndDelete(req.user.id);
    res.json(formatResponse('success', 'Account deleted successfully'));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Change user password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json(formatResponse('error', 'User not found'));
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json(formatResponse('error', 'Current password is incorrect'));
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    res.json(formatResponse('success', 'Password changed successfully'));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

exports.updateCriticalInfo = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  // Find user and verify password
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError('Incorrect password', 401);
  }

  // Check email uniqueness if email is being updated
  if (email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }
  }

  // Update user
  user.name = name;
  user.email = email;
  await user.save();

  // Return success but require re-login
  successResponse(res, 200, null, 'Profile updated successfully. Please log in again.');
});

exports.getBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate('coach', 'name')
    .populate('timeSlot', 'date startTime');

  successResponse(res, 200, { bookings });
});

exports.getReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ user: req.user.id })
    .populate('coach', 'name');

  successResponse(res, 200, { reviews });
});

exports.getPayments = catchAsync(async (req, res) => {
  const payments = await Payment.find({ user: req.user.id });

  successResponse(res, 200, { payments });
}); 

exports.getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');

  successResponse(res, 200, { user });
});

exports.updateProfile = catchAsync(async (req, res) => {
  const { name, email, phone } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.name = name || user.name;
  user.email = email || user.email;

  await user.save();

  successResponse(res, 200, { user }, 'Profile updated successfully');
});

exports.updatePhone = catchAsync(async (req, res) => {
  const { phone } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.phone = phone; 

  await user.save();

  successResponse(res, 200, { user }, 'Phone number updated successfully');
});

exports.updateProfileImage = catchAsync(async (req, res) => {
  const { profileImage } = req.body;

  const user = await User.findById(req.user.id);  

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.profileImage = profileImage; 

  await user.save();

  successResponse(res, 200, { user }, 'Profile image updated successfully');
});   

        













