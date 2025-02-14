const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Coach = require('../models/Coach');
const { AppError, catchAsync } = require('../utils/errorHandler');
const { formatResponse } = require('../utils/responseFormatter');

const signToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'your-secret-key', 
    { expiresIn: '24h' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json(formatResponse('error', 'User already exists'));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // If registering as a coach, create coach profile with pending status
    if (role === 'coach') {
      await Coach.create({
        user: user._id,
        approvalStatus: 'pending',
        specializations: [],
        experience: 0,
        hourlyRate: 0,
        bio: '',
        isApproved: false
      });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json(formatResponse('success', 'Registration successful', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    }));
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(formatResponse('error', 'Registration failed'));
  }
};

exports.login = catchAsync(async (req, res) => {
  try {
    const { email, password, adminSecretKey } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // If user is admin, verify admin secret key
    if (user.role === 'admin') {
      if (!adminSecretKey || adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid admin credentials'
        });
      }
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = signToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error logging in'
    });
  }
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
  successResponse(res, 200, null, 'Logged out successfully');
});
