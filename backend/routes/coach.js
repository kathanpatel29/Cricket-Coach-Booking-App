const express = require('express');
const Coach = require('../models/coach');
const EmergencyOff = require('../models/emergencyOff');
const Booking = require('../models/booking');
const { auth } = require('../middleware/auth');
const { processRefund, notifyClient } = require('../utils/bookingUtils');

const router = express.Router();

// Get emergency off dates for a coach
router.get('/emergency-off', auth, async (req, res) => {
  try {
    const coach = await Coach.findOne({ user: req.user.id });
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    const emergencyOff = await EmergencyOff.find({ coach: coach._id });
    res.json({ data: { emergencyOff } });
  } catch (error) {
    console.error('Error fetching emergency off dates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set emergency off date
router.post('/emergency-off', auth, async (req, res) => {
  try {
    const { date, reason, options } = req.body;

    if (!date || !reason) {
      return res.status(400).json({ message: 'Date and reason are required' });
    }

    const coach = await Coach.findOne({ user: req.user.id });
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    // Check if there are any bookings for this date
    const bookings = await Booking.find({
      coach: coach._id,
      date: date,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (bookings.length > 0) {
      // Handle existing bookings based on options
      for (const booking of bookings) {
        if (options.refund) {
          // Process refund logic here
          await processRefund(booking);
        }
        
        if (options.reschedule) {
          // Mark booking for rescheduling
          booking.status = 'reschedule_pending';
        } else if (options.cancel) {
          booking.status = 'cancelled';
          booking.cancellationReason = `Coach emergency off: ${reason}`;
        }
        
        await booking.save();
        
        // Notify client
        await notifyClient(booking.client, {
          type: 'booking_affected',
          bookingId: booking._id,
          message: `Your booking on ${date} has been affected due to coach emergency off: ${reason}`,
          options
        });
      }
    }

    // Create emergency off record
    const emergencyOff = new EmergencyOff({
      coach: coach._id,
      date,
      reason,
      options
    });

    await emergencyOff.save();

    res.json({ data: { emergencyOff } });
  } catch (error) {
    console.error('Error setting emergency off:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove emergency off date
router.delete('/emergency-off/:date', auth, async (req, res) => {
  try {
    const coach = await Coach.findOne({ user: req.user.id });
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    const result = await EmergencyOff.findOneAndDelete({
      coach: coach._id,
      date: req.params.date
    });

    if (!result) {
      return res.status(404).json({ message: 'Emergency off date not found' });
    }

    res.json({ message: 'Emergency off date removed successfully' });
  } catch (error) {
    console.error('Error removing emergency off date:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 