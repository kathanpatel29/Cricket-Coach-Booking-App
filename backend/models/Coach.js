const mongoose = require('mongoose');

// Define valid specializations
const VALID_SPECIALIZATIONS = ['batting', 'bowling', 'fielding', 'wicket-keeping'];

const availabilitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  slots: [{
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
  }]
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

const coachSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specializations: [{
    type: String,
    enum: ['batting', 'bowling', 'fielding', 'wicket-keeping'],
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
  availability: [availabilitySchema],
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
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalDate: {
    type: Date
  },
  approvalNotes: {
    type: String
  },
  rejectionReason: {
    type: String
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  documents: [{
    type: {
      type: String,
      enum: ['certification', 'identification', 'other'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  verificationStatus: {
    emailVerified: {
      type: Boolean,
      default: false
    },
    phoneVerified: {
      type: Boolean,
      default: false
    },
    documentsVerified: {
      type: Boolean,
      default: false
    }
  },
  location: String,
  preferredSessionDuration: {
    type: Number,
    default: 60
  },
  hasSetAvailability: {
    type: Boolean,
    default: false
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  stripeAccountId: {
    type: String,
    sparse: true
  },
  isStripeEnabled: {
    type: Boolean,
    default: false
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

// Index for better query performance
coachSchema.index({ user: 1 });
coachSchema.index({ specializations: 1 });
coachSchema.index({ 'rating.average': -1 });
coachSchema.index({ status: 1 });
coachSchema.index({ isApproved: 1 });
coachSchema.index({ approvalStatus: 1 });
coachSchema.index({ 'availability.date': 1 });

// Method to check if coach is available for booking
coachSchema.methods.isAvailableForBooking = function() {
  return this.isProfileComplete && 
         this.hasSetAvailability && 
         this.status === 'active';
};

// Method to check if a time slot is available
coachSchema.methods.isTimeSlotAvailable = function(date, timeSlot) {
  const dayAvailability = this.availability.find(
    a => a.date.toDateString() === new Date(date).toDateString()
  );
  return dayAvailability && dayAvailability.slots.includes(timeSlot);
};

// Method to mark a time slot as booked
coachSchema.methods.markTimeSlotAsBooked = async function(date, timeSlot) {
  const dayAvailability = this.availability.find(
    a => a.date.toDateString() === new Date(date).toDateString()
  );
  if (dayAvailability) {
    dayAvailability.slots = dayAvailability.slots.filter(slot => slot !== timeSlot);
    return await this.save();
  }
  return false;
};

const Coach = mongoose.model('Coach', coachSchema);

module.exports = Coach;