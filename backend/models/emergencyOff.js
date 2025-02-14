const mongoose = require('mongoose');

const emergencyOffSchema = new mongoose.Schema({
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  options: {
    refund: {
      type: Boolean,
      default: true
    },
    reschedule: {
      type: Boolean,
      default: true
    },
    cancel: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for coach and date combination
emergencyOffSchema.index({ coach: 1, date: 1 }, { unique: true });

const EmergencyOff = mongoose.model('EmergencyOff', emergencyOffSchema);

module.exports = EmergencyOff; 