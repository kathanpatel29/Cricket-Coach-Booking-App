const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  isBooked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate slots
availabilitySchema.index({ coach: 1, date: 1, startTime: 1, endTime: 1 }, { unique: true });

// Validate time format
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