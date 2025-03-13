const mongoose = require("mongoose");
const { parseISO } = require("date-fns");

const timeSlotSchema = new mongoose.Schema({
  coach: { type: mongoose.Schema.Types.ObjectId, ref: "Coach", required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true, min: 15, max: 180 },
  status: { type: String, enum: ["available", "booked", "cancelled"], default: "available" },
  capacity: { type: Number, default: 1, min: 1, required: true },
  bookedCount: { type: Number, default: 0 },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }]
}, { timestamps: true });

timeSlotSchema.virtual("isBookable").get(function() {
  const now = new Date();
  const slotDate = new Date(this.date);
  slotDate.setHours(parseInt(this.startTime.split(":")[0]));
  slotDate.setMinutes(parseInt(this.startTime.split(":")[1]));

  return this.status === "available" && slotDate > now && this.remainingSpots > 0;
});

// Add virtual for remaining spots
timeSlotSchema.virtual("remainingSpots").get(function() {
  return Math.max(0, this.capacity - this.bookedCount);
});

// Add virtual to check if the slot is full
timeSlotSchema.virtual("isFull").get(function() {
  return this.bookedCount >= this.capacity;
});

// Add pre-save hook for debugging and auto-updating status
timeSlotSchema.pre('save', function(next) {
  console.log('=== TimeSlot pre-save hook triggered ===');
  
  // Auto-update status if capacity is reached
  if (this.bookedCount >= this.capacity && this.status === "available") {
    this.status = "booked";
  } else if (this.bookedCount < this.capacity && this.status === "booked") {
    // If bookings were cancelled and we're below capacity again
    this.status = "available";
  }
  
  console.log('TimeSlot being saved:', {
    id: this._id,
    coach: this.coach,
    date: this.date,
    startTime: this.startTime,
    endTime: this.endTime,
    status: this.status,
    capacity: this.capacity,
    bookedCount: this.bookedCount,
    remainingSpots: this.capacity - this.bookedCount,
    isNew: this.isNew
  });
  next();
});

const TimeSlot = mongoose.model("TimeSlot", timeSlotSchema);
module.exports = TimeSlot;
