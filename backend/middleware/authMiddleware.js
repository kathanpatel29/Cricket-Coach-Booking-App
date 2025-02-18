const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { formatResponse } = require('../utils/responseFormatter');

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json(formatResponse('error', 'Please login to access this resource'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json(formatResponse('error', 'User not found or inactive'));
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(formatResponse('error', 'Invalid or expired token'));
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