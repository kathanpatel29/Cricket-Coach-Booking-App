const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending'
  },
  stripePaymentIntentId: {
    type: String,
    required: true
  },
  stripeUserSecret: {
    type: String,
    required: true
  },
  refundDetails: {
    amount: Number,
    reason: String,
    date: Date,
    stripeRefundId: String
  }
}, {
  timestamps: true
});

// Fix for cast string ID issue - ensure ObjectId conversion
paymentSchema.statics.findByIdOrString = function(id) {
  try {
    return this.findById(mongoose.Types.ObjectId(id));
  } catch (error) {
    if (error.name === 'CastError') {
      return this.findById(id);
    }
    throw error;
  }
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;