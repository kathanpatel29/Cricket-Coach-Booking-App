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
    const { name, email, password, role, specializations, experience, hourlyRate, bio, adminSecretKey } = req.body;
    
    console.log('1. Starting registration process:', { 
      email, 
      role,
      hasAdminKey: !!adminSecretKey 
    });

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      console.log('2. User already exists:', email);
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered. Please use a different email or login.'
      });
    }

    // Special handling for admin registration
    if (role === 'admin') {
      console.log('3. Validating admin key');
      
      if (!process.env.ADMIN_SECRET_KEY) {
        console.error('ADMIN_SECRET_KEY not set in environment');
        return res.status(500).json({
          status: 'error',
          message: 'Server configuration error'
        });
      }

      if (!adminSecretKey) {
        return res.status(401).json({
          status: 'error',
          message: 'Admin secret key is required for admin registration'
        });
      }

      if (adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(401).json({
          status: 'error',
          message: 'Please provide the correct admin secret key'
        });
      }
    }

    // Create user object
    const userData = {
      name,
      email: email.toLowerCase(),
      password,
      role,
      isApproved: role === 'admin' ? true : role !== 'coach',
      isActive: true
    };

    console.log('4. Creating user with data:', {
      ...userData,
      password: '[HIDDEN]'
    });

    // Create user
    const user = await User.create(userData);
    
    if (!user) {
      throw new Error('Failed to create user');
    }

    console.log('5. User created successfully:', { 
      id: user._id, 
      role: user.role 
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    if (role === 'coach') {
      // Create coach profile
      const coachProfile = {
        user: user._id,
        specializations: specializations || [],
        experience: Number(experience) || 0,
        hourlyRate: Number(hourlyRate) || 0,
        bio: bio || '',
        status: 'pending',
        isApproved: false
      };

      try {
        await Coach.create(coachProfile);
      } catch (error) {
        // If coach profile creation fails, delete the user
        await User.findByIdAndDelete(user._id);
        throw new Error('Failed to create coach profile');
      }
    }

    // Send response
    return res.status(201).json({
      status: 'success',
      message: role === 'admin' ? 'Admin registration successful!' : 
               role === 'coach' ? 'Registration successful! Your coach profile is pending approval.' :
               'Registration successful!',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error details:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Registration failed. Please try again.'
    });
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

    // Find user and check if exists
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'No account found with this email'
      });
    }

    // Special handling for admin login
    if (user.role === 'admin') {
      if (!adminSecretKey) {
        return res.status(401).json({
          status: 'error',
          message: 'Admin secret key is required for admin login'
        });
      }

      if (adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(401).json({
          status: 'error',
          message: 'Please provide the correct admin secret key'
        });
      }
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid password'
      });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      data: {
        user,
        token
      }
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
