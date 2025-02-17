const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { formatResponse } = require('../utils/responseFormatter');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json(formatResponse('error', 'Please login to access this resource'));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json(formatResponse('error', 'User not found'));
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json(formatResponse('error', 'Your account has been deactivated'));
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json(formatResponse('error', 'Invalid or expired token'));
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json(formatResponse('error', 'Authentication error'));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(formatResponse('error', 'Please login to access this resource'));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(formatResponse('error', 'You are not authorized to access this resource'));
    }

    next();
  };
};

module.exports = { protect, authorize };