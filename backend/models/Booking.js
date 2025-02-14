const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 0.5,
    max: 4
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Payment related fields
  totalAmount: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    default: function() {
      return this.totalAmount * 0.10; // 10% platform fee
    }
  },
  coachEarnings: {
    type: Number,
    default: function() {
      return this.totalAmount * 0.90; // 90% coach earnings
    }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String,
    sparse: true
  },
  // Cancellation fields
  cancellationReason: String,
  cancellationDate: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Refund fields
  refundAmount: Number,
  refundDate: Date,
  refundReason: String,
  // Meeting fields
  meetingLink: String,
  meetingId: String,
  meetingPassword: String,
  // Notes and feedback
  clientNotes: String,
  coachNotes: String,
  sessionSummary: String
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ client: 1, status: 1 });
bookingSchema.index({ coach: 1, status: 1 });
bookingSchema.index({ date: 1, timeSlot: 1 });
bookingSchema.index({ paymentStatus: 1 });

// Methods
bookingSchema.methods.calculateFees = function() {
  this.platformFee = this.totalAmount * 0.10;
  this.coachEarnings = this.totalAmount * 0.90;
};

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  if (this.isModified('totalAmount')) {
    this.calculateFees();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);