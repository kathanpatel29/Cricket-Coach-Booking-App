const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
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
    required: true,
    min: 30,
    max: 240 // in minutes
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'cancelled'],
    default: 'available'
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    sparse: true
  }
}, {
  timestamps: true
});

timeSlotSchema.index({ coach: 1, date: 1, status: 1 });
timeSlotSchema.index({ booking: 1 });

module.exports = mongoose.model('TimeSlot', timeSlotSchema); 