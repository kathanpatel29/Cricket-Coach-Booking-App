const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Notification = require('../models/notification');

const processRefund = async (booking) => {
  try {
    if (!booking.paymentIntent) {
      throw new Error('No payment intent found for booking');
    }

    // Create refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: booking.paymentIntent,
      reason: 'requested_by_customer'
    });

    // Update booking with refund information
    booking.refund = {
      id: refund.id,
      amount: refund.amount,
      status: refund.status,
      createdAt: new Date(refund.created * 1000)
    };
    booking.status = 'refunded';
    
    await booking.save();
    
    return refund;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};

const notifyClient = async (clientId, notification) => {
  try {
    const newNotification = new Notification({
      user: clientId,
      type: notification.type,
      title: 'Booking Update',
      message: notification.message,
      data: {
        bookingId: notification.bookingId,
        options: notification.options
      },
      read: false
    });

    await newNotification.save();

    // Here you could also implement real-time notifications using WebSocket
    // or other real-time communication methods

    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

module.exports = {
  processRefund,
  notifyClient
}; 