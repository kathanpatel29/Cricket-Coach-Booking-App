const nodemailer = require('nodemailer');
const { format, addMinutes } = require('date-fns');
const Queue = require('bull');
const { AppError } = require('../utils/errorHandler');

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Configure notification queue
const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

// Email templates
const emailTemplates = {
  bookingConfirmation: (booking) => ({
    subject: 'Booking Confirmation',
    text: `Your booking has been confirmed for ${format(booking.date, 'PPP')} at ${booking.startTime}`,
    html: `<h1>Booking Confirmed</h1>
           <p>Your session has been confirmed for ${format(booking.date, 'PPP')} at ${booking.startTime}</p>
           <p>Meeting link: ${booking.meetingLink}</p>`
  }),
  bookingReminder: (booking, minutesBefore) => ({
    subject: `Reminder: Upcoming Session in ${minutesBefore} minutes`,
    text: `Reminder: Your session starts in ${minutesBefore} minutes`,
    html: `<h1>Session Reminder</h1>
           <p>Your session starts in ${minutesBefore} minutes</p>
           <p>Meeting link: ${booking.meetingLink}</p>`
  })
};

// Schedule notifications for a booking
const scheduleNotifications = async (booking) => {
  try {
    const reminderTimes = [
      { minutes: 24 * 60, type: '24h' },
      { minutes: 60, type: '1h' },
      { minutes: 15, type: '15min' }
    ];

    const bookingTime = new Date(booking.date);
    const [hours, minutes] = booking.startTime.split(':');
    bookingTime.setHours(parseInt(hours), parseInt(minutes));

    for (const reminder of reminderTimes) {
      const reminderTime = addMinutes(bookingTime, -reminder.minutes);
      
      if (reminderTime > new Date()) {
        await notificationQueue.add('sendReminder', {
          bookingId: booking._id,
          reminderType: reminder.type
        }, {
          delay: reminderTime.getTime() - Date.now()
        });
      }
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    throw new AppError('Failed to schedule notifications', 500);
  }
};

// Process notification queue
notificationQueue.process('sendReminder', async (job) => {
  const { bookingId, reminderType } = job.data;
  
  const booking = await Booking.findById(bookingId)
    .populate('user')
    .populate('coach');
    
  if (!booking || booking.status !== 'confirmed') {
    return;
  }

  const minutesBefore = {
    '24h': 24 * 60,
    '1h': 60,
    '15min': 15
  }[reminderType];

  const template = emailTemplates.bookingReminder(booking, minutesBefore);
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: booking.user.email,
    ...template
  });

  booking.remindersSent.push(reminderType);
  await booking.save();
});

module.exports = {
  scheduleNotifications,
  sendBookingConfirmation: async (booking) => {
    const template = emailTemplates.bookingConfirmation(booking);
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: booking.user.email,
      ...template
    });
  }
}; 