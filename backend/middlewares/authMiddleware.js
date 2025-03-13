const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError, catchAsync } = require("./errorMiddleware");
const config = require("../config/config");

const authMiddleware = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  
  if (!token) throw new AppError("Please log in to access this route", 401);

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) throw new AppError("User no longer exists", 401);

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token. Please log in again.', 401);
    } else if (error.name === 'TokenExpiredError') {
      throw new AppError('Your token has expired. Please log in again.', 401);
    } else {
      throw error;
    }
  }
});

const roleMiddleware = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError("Not authorized to access this route", 403);
  }
  next();
};

// Content Restriction Middleware
const contentRestrictionMiddleware = catchAsync(async (req, res, next) => {
  if (req.user.role === "coach" && !req.user.isApproved) {
    throw new AppError("Access restricted. Your account is pending approval.", 403);
  }
  next();
});

module.exports = { authMiddleware, roleMiddleware, contentRestrictionMiddleware };
