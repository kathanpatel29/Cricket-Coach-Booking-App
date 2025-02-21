const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Coach = require('../models/Coach');
const { AppError, catchAsync } = require('../utils/errorHandler');
const { formatResponse } = require('../utils/responseFormatter');
const { promisify } = require('util');

// Log all environment variables for debugging
console.log("Environment Variables:", process.env);

// Ensure JWT secret key is defined
if (!process.env.JWT_SECRET_KEY) {
  throw new Error("JWT_SECRET_KEY is missing in environment variables.");
}

const signToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET_KEY,
    { expiresIn: '24h' }
  );
};

exports.register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

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

  // Generate token
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(201).json({
    status: 'success',
    token,
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

  const token = signToken(user._id);

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
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
    
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

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    // Grant access
    req.user = user;
    next();
  } catch (error) {
    throw new AppError('Invalid token', 401);
  }
});

// Role authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('You are not authorized to access this route', 403);
    }
    next();
  };
};  
