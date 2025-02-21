const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  bookingCutoffHours: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Validate time format and booking rules
availabilitySchema.pre('save', function(next) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeRegex.test(this.startTime) || !timeRegex.test(this.endTime)) {
    next(new Error('Invalid time format. Use HH:MM format'));
  }

  if (this.startTime >= this.endTime) {
    next(new Error('End time must be after start time'));
  }

  next();
});

module.exports = mongoose.model('Availability', availabilitySchema); 