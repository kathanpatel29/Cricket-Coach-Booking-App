const User = require("../models/User");
const Coach = require("../models/Coach");
const Booking = require("../models/Booking");
const UserDeletionLog = require("../models/UserDeletionLog");
const { AppError, catchAsync } = require("../utils/errorHandler");
const { successResponse, formatResponse } = require("../utils/responseFormatter");
const { deleteOldProfileImage } = require('../utils/imageUpload');

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
  const totalUsers = await User.countDocuments();
  const clientCount = await User.countDocuments({ role: 'client' });
  const coachCount = await User.countDocuments({ role: 'coach' });
  const activeUsers = await User.countDocuments({ isActive: true });
  const inactiveUsers = await User.countDocuments({ isActive: false });

  const recentUsers = await User.find()
    .select('-password')
    .sort('-createdAt')
    .limit(5);

  successResponse(res, 200, {
    stats: {
      totalUsers,
      clientCount,
      coachCount,
      activeUsers,
      inactiveUsers
    },
    recentUsers
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
exports.getCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(formatResponse('success', 'User profile retrieved successfully', { user }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

// Update current user profile
exports.updateCurrentUserProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // Password updates handled separately
    delete updates.role; // Role cannot be updated here

    // Handle profile image upload
    if (req.file) {
      // Delete old profile image if it exists and is not the default
      if (req.user.profileImage) {
        deleteOldProfileImage(req.user.profileImage);
      }
      updates.profileImage = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(formatResponse('success', 'Profile updated successfully', { user }));
  } catch (error) {
    res.status(500).json(formatResponse('error', error.message));
  }
};

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