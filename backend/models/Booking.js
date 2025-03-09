const mongoose = require('mongoose');
const { addHours, isBefore } = require('date-fns');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  timeSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    required: true
  },
  paymentId: String,
  cancellationReason: String,
  notes: String,
  meetingLink: String,
  remindersSent: [{
    type: String,
    enum: ['24h', '1h', '15min'],
    default: []
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validate status transitions
bookingSchema.pre('save', async function(next) {
  try {
    if (this.isModified('status')) {
      const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['completed', 'cancelled', 'no-show'],
        completed: [],
        cancelled: [],
        'no-show': []
      };

      if (this.isNew) {
        if (this.status !== 'pending') {
          throw new Error('New bookings must have pending status');
        }
      } else {
        const oldBooking = await this.constructor.findById(this._id);
        if (!validTransitions[oldBooking.status]?.includes(this.status)) {
          throw new Error(`Invalid status transition from ${oldBooking.status} to ${this.status}`);
        }
      }
    }

    // Validate payment status transitions
    if (this.isModified('paymentStatus')) {
      const validPaymentTransitions = {
        pending: ['paid', 'failed'],
        paid: ['refunded'],
        failed: ['paid'],
        refunded: []
      };

      if (!this.isNew) {
        const oldBooking = await this.constructor.findById(this._id);
        if (!validPaymentTransitions[oldBooking.paymentStatus]?.includes(this.paymentStatus)) {
          throw new Error(`Invalid payment status transition from ${oldBooking.paymentStatus} to ${this.paymentStatus}`);
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Update TimeSlot status when booking status changes
bookingSchema.post('save', async function() {
  if (this.isModified('status')) {
    const TimeSlot = mongoose.model('TimeSlot');
    const timeSlot = await TimeSlot.findById(this.timeSlot);
    
    if (timeSlot) {
      if (this.status === 'cancelled') {
        timeSlot.status = 'available';
        timeSlot.booking = null;
      } else if (this.status === 'confirmed') {
        timeSlot.status = 'booked';
      }
      await timeSlot.save();
    }
  }
});

// virtual Fields for Calculated Fees
bookingSchema.virtual('platformFee').get(function () {
  return this.paymentAmount * 0.10;
});

bookingSchema.virtual('coachEarnings').get(function () {
  return this.paymentAmount * 0.90;
});

// Fix for cast string ID issue - ensure ObjectId conversion
bookingSchema.statics.findByIdOrString = function(id) {
  try {
    return this.findById(mongoose.Types.ObjectId(id));
  } catch (error) {
    if (error.name === 'CastError') {
      return this.findById(id);
    }
    throw error;
  }
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
