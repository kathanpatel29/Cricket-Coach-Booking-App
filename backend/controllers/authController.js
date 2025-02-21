const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Coach = require('../models/Coach');
const { AppError, catchAsync } = require('../utils/errorHandler');
const { formatResponse } = require('../utils/responseFormatter');
const { promisify } = require('util');

const signToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET_KEY,
    { expiresIn: '24h' }
  );
};

exports.register = catchAsync(async (req, res) => {
  const { name, email, password, role, specializations, experience, hourlyRate, bio } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user'
  });

  // If registering as a coach, create coach profile
  if (role === 'coach') {
    const coach = await Coach.create({
      user: user._id,
      specializations: specializations || [],
      experience: experience || 0,
      hourlyRate: hourlyRate || 0,
      bio: bio || '',
      status: 'pending',
      isApproved: false
    });
  }

  // Remove password from output
  user.password = undefined;

  res.status(201).json({
    status: 'success',
    message: role === 'coach' ? 
      'Registration successful. Your coach profile is pending approval.' : 
      'Registration successful. Please login to continue.',
    data: {
      user
    }
  });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate token
  const token = user.generateAuthToken();

  // Remove password from response
  user.password = undefined;

  res.json({
    status: 'success',
    data: {
      token,
      user
    }
  });
});

exports.getMe = catchAsync(async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user data'
    });
  }
});

/**
 * @desc Logout
 * @route POST /api/auth/logout
 */
exports.logout = catchAsync(async (req, res) => {
  res.status(200).json(formatResponse('success', 'Logged out successfully'));
});

exports.checkEmail = catchAsync(async (req, res) => {
  const { email } = req.body;
  
  const user = await User.findOne({ email });
  
  res.json({
    status: 'success',
    data: {
      exists: !!user
    }
  });
});

exports.refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      status: 'error',
      message: 'Refresh token is required'
    });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    // Get user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = signToken(user._id);

    res.json({
      status: 'success',
      data: {
        token: newAccessToken
      }
    });
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid refresh token'
    });
  }
});

exports.updateProfile = catchAsync(async (req, res) => {
  const { name, email } = req.body;
  
  // Find the user
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if email is being changed and if it's already in use
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }
  }

  // Update user fields
  user.name = name || user.name;
  if (email) {
    user.email = email.toLowerCase();
  }

  // Save the updated user
  await user.save();

  // Send response
  res.json({
    status: 'success',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

exports.updatePhone = catchAsync(async (req, res) => {
  const { phone } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  } 

  user.phone = phone;
  await user.save();

  res.json({ status: 'success', message: 'Phone updated successfully' });
}); 

exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Ensure both fields are provided
  if (!currentPassword || !newPassword) {
    throw new AppError('Current and new password are required', 400);
  }

  // Find the user
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if current password is correct
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Incorrect current password', 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    status: 'success',
    message: 'Password updated successfully',
  });
});

exports.updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Find the user
  const user = await User.findById(req.user._id); 

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if current password is correct
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    status: 'success',
    message: 'Password updated successfully'
  });
});           

exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json({ status: 'success', data: user });
}); 

exports.getCoachStatus = catchAsync(async (req, res) => {
  const coach = await Coach.findOne({ user: req.user._id });
  
  if (!coach) {
    throw new AppError('Coach profile not found', 404);
  }

  res.json({
    status: 'success',
    data: {
      isApproved: coach.isApproved,
      status: coach.status
    }
  });
});

// Protect routes middleware
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Please log in to access this route', 401);
  }

  // Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  // Grant access
  req.user = user;
  next();
});

// Role authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('Not authorized to access this route', 403);
    }
    next();
  };
};
