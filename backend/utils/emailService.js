const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendBookingConfirmation = async (userEmail, bookingDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Booking Confirmation - Cricket Coaching Session',
    html: `
      <h1>Booking Confirmation</h1>
      <p>Dear ${bookingDetails.userName},</p>
      <p>Your cricket coaching session has been confirmed:</p>
      <ul>
        <li>Coach: ${bookingDetails.coachName}</li>
        <li>Date: ${new Date(bookingDetails.date).toLocaleDateString()}</li>
        <li>Time: ${bookingDetails.time}</li>
        <li>Duration: ${bookingDetails.duration} minutes</li>
      </ul>
      <p>Location: ${bookingDetails.location || 'To be confirmed by coach'}</p>
      <p>Thank you for choosing our service!</p>
    `
  };

  await transporter.sendMail(mailOptions);
  return true;
};

const sendCoachNotification = async (coachEmail, bookingDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: coachEmail,
    subject: 'New Booking Request',
    html: `
      <h1>New Booking Request</h1>
      <p>Dear ${bookingDetails.coachName},</p>
      <p>You have a new booking request:</p>
      <ul>
        <li>Student: ${bookingDetails.userName}</li>
        <li>Date: ${new Date(bookingDetails.date).toLocaleDateString()}</li>
        <li>Time: ${bookingDetails.time}</li>
        <li>Duration: ${bookingDetails.duration} minutes</li>
      </ul>
      <p>Please log in to your dashboard to accept or decline this request.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

const sendPaymentConfirmation = async (userEmail, paymentDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Payment Confirmation',
    html: `
      <h1>Payment Confirmation</h1>
      <p>Dear ${paymentDetails.userName},</p>
      <p>Your payment has been processed successfully:</p>
      <ul>
        <li>Amount: $${paymentDetails.amount}</li>
        <li>Transaction ID: ${paymentDetails.transactionId}</li>
        <li>Date: ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>Thank you for your payment!</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendCoachNotification,
  sendPaymentConfirmation
}; 