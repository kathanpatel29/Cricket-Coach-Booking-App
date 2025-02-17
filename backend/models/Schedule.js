const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  weeklySchedule: {
    monday: [{
      startTime: String,
      endTime: String
    }],
    tuesday: [{
      startTime: String,
      endTime: String
    }],
    wednesday: [{
      startTime: String,
      endTime: String
    }],
    thursday: [{
      startTime: String,
      endTime: String
    }],
    friday: [{
      startTime: String,
      endTime: String
    }],
    saturday: [{
      startTime: String,
      endTime: String
    }],
    sunday: [{
      startTime: String,
      endTime: String
    }]
  },
  timezone: {
    type: String,
    required: true,
    default: 'UTC'
  }
}, {
  timestamps: true
});

scheduleSchema.index({ coach: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema); 