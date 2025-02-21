const mongoose = require('mongoose');
const { parseISO, isAfter, isBefore, addHours, startOfWeek, addDays } = require('date-fns');

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
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:mm format'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:mm format'
    }
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 180
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'cancelled'],
    default: 'available'
  },
  bookingCutoffHours: {
    type: Number,
    required: true,
    default: 12
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

timeSlotSchema.pre('save', async function(next) {
  try {
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(this.startTime) || !timeRegex.test(this.endTime)) {
      throw new Error('Invalid time format');
    }

    // Validate time order
    const startDateTime = parseISO(`2000-01-01T${this.startTime}`);
    const endDateTime = parseISO(`2000-01-01T${this.endTime}`);
    
    if (!isAfter(endDateTime, startDateTime)) {
      throw new Error('End time must be after start time');
    }

    // Validate booking cutoff
    if (this.isModified('date') || this.isModified('startTime')) {
      const slotDateTime = new Date(this.date);
      const [hours, minutes] = this.startTime.split(':');
      slotDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      const now = new Date();
      const hoursDifference = (slotDateTime - now) / (1000 * 60 * 60);
      
      if (hoursDifference < this.bookingCutoffHours) {
        throw new Error('Time slot must be created before booking cutoff');
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for checking if slot is bookable
timeSlotSchema.virtual('isBookable').get(function() {
  const now = new Date();
  const slotDate = new Date(this.date);
  slotDate.setHours(parseInt(this.startTime.split(':')[0]));
  slotDate.setMinutes(parseInt(this.startTime.split(':')[1]));
  
  const cutoffTime = addHours(now, this.bookingCutoffHours);
  return this.status === 'available' && isAfter(slotDate, cutoffTime);
});

const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);

// Generate time slots for the next 4 weeks
const generateTimeSlots = async (coach, weeklySchedule) => {
  const startDate = startOfWeek(new Date());
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const bulkOps = [];

  for (let week = 0; week < 4; week++) {
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = addDays(startDate, dayIndex + week * 7);
      const dayName = days[dayIndex];
      const daySchedule = weeklySchedule[dayName];
      
      if (daySchedule?.length > 0) {
        for (const slot of daySchedule) {
          bulkOps.push({
            insertOne: {
              document: {
                coach: coach._id,
                date: currentDate,
                startTime: slot.startTime,
                endTime: slot.endTime,
                duration: 60,
                status: 'available',
                bookingCutoffHours: coach.availabilitySettings?.bookingCutoffHours || 12
              }
            }
          });
        }
      }
    }
  }

  if (bulkOps.length > 0) {
    await TimeSlot.bulkWrite(bulkOps);
  }
};

module.exports = TimeSlot; 