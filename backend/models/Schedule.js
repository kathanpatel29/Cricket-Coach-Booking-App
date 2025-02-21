const mongoose = require('mongoose');
const { parseISO, isAfter } = require('date-fns');

const timeRangeSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time must be in HH:mm format'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time must be in HH:mm format'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true,
    unique: true
  },
  weeklySchedule: {
    monday: [timeRangeSchema],
    tuesday: [timeRangeSchema],
    wednesday: [timeRangeSchema],
    thursday: [timeRangeSchema],
    friday: [timeRangeSchema],
    saturday: [timeRangeSchema],
    sunday: [timeRangeSchema]
  },
  timezone: {
    type: String,
    required: true,
    default: 'UTC'
  },
  defaultDuration: {
    type: Number,
    required: true,
    default: 60,
    min: 15,
    max: 180
  },
  bookingCutoffHours: {
    type: Number,
    required: true,
    default: 12,
    min: 0,
    max: 72
  },
  breakBetweenSlots: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 60
  }
}, {
  timestamps: true
});

// Validate time ranges and prevent overlaps
scheduleSchema.pre('save', function(next) {
  try {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      const timeRanges = this.weeklySchedule[day];
      
      // Sort time ranges by start time
      timeRanges.sort((a, b) => {
        const timeA = parseISO(`2000-01-01T${a.startTime}`);
        const timeB = parseISO(`2000-01-01T${b.startTime}`);
        return timeA - timeB;
      });

      // Check for overlaps and minimum break between slots
      for (let i = 0; i < timeRanges.length - 1; i++) {
        const currentEnd = parseISO(`2000-01-01T${timeRanges[i].endTime}`);
        const nextStart = parseISO(`2000-01-01T${timeRanges[i + 1].startTime}`);
        
        const breakMinutes = (nextStart - currentEnd) / (1000 * 60);
        
        if (breakMinutes < this.breakBetweenSlots) {
          throw new Error(`Insufficient break time between slots in ${day}'s schedule`);
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check slot availability
scheduleSchema.methods.isTimeAvailable = function(day, startTime, endTime) {
  const daySchedule = this.weeklySchedule[day.toLowerCase()];
  if (!daySchedule) return false;

  const requestedStart = parseISO(`2000-01-01T${startTime}`);
  const requestedEnd = parseISO(`2000-01-01T${endTime}`);

  return daySchedule.every(slot => {
    const slotStart = parseISO(`2000-01-01T${slot.startTime}`);
    const slotEnd = parseISO(`2000-01-01T${slot.endTime}`);
    
    return requestedEnd <= slotStart || requestedStart >= slotEnd;
  });
};

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule; 
module.exports = Schedule; 