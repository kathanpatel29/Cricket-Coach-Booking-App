const mongoose = require('mongoose');

// Define valid specializations
const VALID_SPECIALIZATIONS = ['batting', 'bowling', 'fielding', 'wicket-keeping'];

// const availabilitySchema = new mongoose.Schema({
//   type: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Availability',
//     required: true
//   },
//   date: {
//     type: String,
//     required: true
//   },
//   time: {
//     type: String,
//     required: true
//   }
// });

const recurringAvailabilitySchema = new mongoose.Schema({
  Monday: [String],
  Tuesday: [String],
  Wednesday: [String],
  Thursday: [String],
  Friday: [String],
  Saturday: [String],
  Sunday: [String]
});

const emergencyOffSchema = new mongoose.Schema({
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
  }
});

const availabilitySettingsSchema = new mongoose.Schema({
  bookingCutoffHours: {
    type: Number,
    default: 12,
    min: 1,
    max: 72
  },
  availabilityDays: {
    type: Number,
    default: 30,
    min: 1,
    max: 90
  },
  defaultSessionDuration: {
    type: Number,
    default: 60,
    min: 30,
    max: 180
  }
});

const coachSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specializations: [{
    type: String,
    enum: VALID_SPECIALIZATIONS,
    required: true
  }],
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  bio: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000
  },
  availability: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Availability',
    required: true
  },
  recurringAvailability: {
    type: recurringAvailabilitySchema,
    default: () => ({})
  },
  emergencyOff: [emergencyOffSchema],
  certifications: String,
  profileImage: String,
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSessions: {
    type: Number,
    default: 0,
    min: 0
  },
  ratings: [{
    type: Number,
    min: 1,
    max: 5
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  stripeAccountId: {
    type: String,
    sparse: true
  },
  isStripeEnabled: {
    type: Boolean,
    default: false
  },
  availabilitySettings: {
    type: availabilitySettingsSchema,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate average rating before saving
coachSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    this.rating.average = parseFloat((this.ratings.reduce((a, b) => a + b) / this.ratings.length).toFixed(1));
  }
  this.isProfileComplete = !!(
    this.specializations.length &&
    this.experience &&
    this.bio &&
    this.hourlyRate
  );
  next();
});

// Add static method to get valid specializations
coachSchema.statics.getValidSpecializations = function() {
  return VALID_SPECIALIZATIONS;
};

// Virtual for total reviews count
coachSchema.virtual('totalReviews').get(function() {
  return this.reviews.length;
});

// Virtual for rating count
coachSchema.virtual('ratingCount').get(function() {
  return this.ratings.length;
});

// Method to check if coach is available for booking
coachSchema.methods.isAvailableForBooking = async function(date, timeSlot) {
  if (!this.isProfileComplete || !this.hasSetAvailability || this.status !== 'active') {
    return false;
  }

  const existingBooking = await TimeSlot.findOne({
    coach: this._id,
    date: new Date(date),
    startTime: timeSlot,
    status: 'booked'
  });

  return !existingBooking;
};

// Method to check if a time slot is available
coachSchema.methods.isTimeSlotAvailable = function(date, timeSlot) {
  const dayAvailability = this.availability.find(
    a => a.date.toDateString() === new Date(date).toDateString()
  );
  return dayAvailability && dayAvailability.slots.includes(timeSlot);
};

// Method to mark a time slot as booked
coachSchema.methods.markTimeSlotAsBooked = async function(timeSlotId) {
  const TimeSlot = mongoose.model('TimeSlot');
  const timeSlot = await TimeSlot.findOne({
    _id: timeSlotId,
    coach: this._id,
    status: 'available'
  });

  if (!timeSlot) {
    throw new Error('Time slot not found or already booked');
  }

  timeSlot.status = 'booked';
  await timeSlot.save();
  return true;
};

// Fix for cast string ID issue - ensure ObjectId conversion
coachSchema.statics.findByIdOrString = function(id) {
  try {
    return this.findById(mongoose.Types.ObjectId(id));
  } catch (error) {
    if (error.name === 'CastError') {
      return this.findById(id);
    }
    throw error;
  }
};

const Coach = mongoose.model('Coach', coachSchema);

module.exports = Coach;