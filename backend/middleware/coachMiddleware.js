const Coach = require('../models/Coach');
const { AppError } = require('../utils/errorHandler');

exports.checkCoachApproval = async (req, res, next) => {
  try {
    const coach = await Coach.findOne({ user: req.user._id });
    
    if (!coach) {
      return next(new AppError('Coach profile not found', 404));
    }

    if (!coach.isApproved) {
      return next(new AppError('Your coach profile is pending approval', 403));
    }

    req.coach = coach;
    next();
  } catch (error) {
    next(error);
  }
}; 