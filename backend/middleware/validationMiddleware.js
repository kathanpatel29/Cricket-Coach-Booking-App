const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Validation middleware
exports.validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  };
};

// Auth validation schemas
exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['user', 'coach', 'admin']).withMessage('Invalid role')
];

exports.loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// Coach validation schemas
exports.coachValidation = [
  body('specializations')
    .isArray({ min: 1 })
    .withMessage('At least one specialization is required'),
  body('experience')
    .isInt({ min: 0 })
    .withMessage('Experience must be a positive number'),
  body('hourlyRate')
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  body('bio')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Bio must be between 10 and 1000 characters')
];

// Booking validation schemas
exports.bookingValidation = [
  body('coachId').notEmpty().withMessage('Coach ID is required'),
  body('date').isISO8601().withMessage('Please provide a valid date'),
  body('duration')
    .isInt({ min: 1, max: 4 })
    .withMessage('Duration must be between 1 and 4 hours')
];

// Time slot validation schemas
exports.timeSlotValidation = [
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom(value => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('Cannot create time slots in the past');
      }
      return true;
    }),
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid start time format (HH:mm)'),
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid end time format (HH:mm)')
    .custom((value, { req }) => {
      const start = req.body.startTime;
      if (start && value <= start) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('duration')
    .isInt({ min: 15, max: 180 })
    .withMessage('Duration must be between 15 and 180 minutes')
];

// Review validation schemas
exports.reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters'),
  body('bookingId').notEmpty().withMessage('Booking ID is required')
];