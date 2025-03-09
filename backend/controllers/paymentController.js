require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/Booking");
const Coach = require("../models/Coach");
const { AppError, catchAsync } = require("../utils/errorHandler");
const { successResponse, errorResponse, formatResponse } = require("../utils/responseFormatter");
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

exports.createPaymentIntent = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  
  const booking = await Booking.findByIdOrString(bookingId)
    .populate('coach');
    
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Check if booking belongs to the current user
  if (booking.user.toString() !== req.user._id.toString()) {
    throw new AppError("Unauthorized access to this booking", 403);
  }

  // Check if payment is already processed
  if (booking.paymentStatus !== 'pending') {
    throw new AppError(`Payment already ${booking.paymentStatus}`, 400);
  }

  // Create a payment intent with Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.paymentAmount * 100), // Convert to cents
    currency: "usd",
    metadata: { 
      bookingId: booking._id.toString(),
      coachId: booking.coach._id.toString(),
      userId: booking.user.toString()
    }
  });

  // Create or update payment record
  let payment = await Payment.findOne({ booking: booking._id });
  
  if (!payment) {
    payment = new Payment({
      booking: booking._id,
      amount: booking.paymentAmount,
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      stripeUserSecret: paymentIntent.client_secret
    });
  } else {
    payment.stripePaymentIntentId = paymentIntent.id;
    payment.stripeUserSecret = paymentIntent.client_secret;
  }
  
  await payment.save();

  res.json({
    status: 'success',
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    }
  });
});

exports.confirmPayment = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const { paymentIntentId } = req.body;
  
  const booking = await Booking.findByIdOrString(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Check if booking belongs to the current user
  if (booking.user.toString() !== req.user._id.toString()) {
    throw new AppError("Unauthorized access to this booking", 403);
  }

  // Verify payment intent with Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status !== 'succeeded') {
    throw new AppError(`Payment not successful. Status: ${paymentIntent.status}`, 400);
  }
  
  // Update booking status
  booking.status = 'confirmed';
  booking.paymentStatus = 'paid';
  booking.paymentId = paymentIntentId;
  await booking.save();

  // Update payment record
  const payment = await Payment.findOne({ 
    stripePaymentIntentId: paymentIntentId 
  });
  
  if (payment) {
    payment.status = 'succeeded';
    await payment.save();
  }

  res.json({
    status: 'success',
    data: { booking }
  });
});

exports.getPaymentHistory = catchAsync(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate({
      path: 'booking',
      select: 'date timeSlot duration'
    })
    .populate({
      path: 'coach',
      select: 'name email'
    })
    .sort('-createdAt');

  res.status(200).json(formatResponse('success', 'Payment history retrieved successfully', { payments }));
});

exports.refundPayment = catchAsync(async (req, res) => {
  const { bookingId, reason } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.paymentStatus !== 'paid') {
    throw new AppError("Booking is not paid", 400);
  }

  // Process refund through Stripe
  const refund = await stripe.refunds.create({
    payment_intent: booking.paymentIntentId,
    reason: 'requested_by_customer'
  });

  // Update booking status
  booking.paymentStatus = 'refunded';
  booking.status = 'cancelled';
  booking.cancellationReason = reason;
  booking.cancellationDate = new Date();
  await booking.save();

  // Update coach earnings
  const coach = await Coach.findById(booking.coach);
  coach.totalEarnings -= booking.totalAmount;
  coach.totalSessions -= 1;
  await coach.save();

  successResponse(res, 200, { booking, refund }, "Payment refunded successfully");
});

exports.getCoachEarnings = catchAsync(async (req, res) => {
  // Get total earnings and completed sessions
  const earningsSummary = await Payment.aggregate([
    {
      $match: {
        coach: new mongoose.Types.ObjectId(req.user._id),
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$coachPayout' },
        completedSessions: { $sum: 1 }
      }
    }
  ]);

  // Get pending payouts
  const pendingPayouts = await Payment.aggregate([
    {
      $match: {
        coach: new mongoose.Types.ObjectId(req.user._id),
        status: 'pending'
      }
    },
    {
      $group: {
        _id: null,
        pendingAmount: { $sum: '$coachPayout' }
      }
    }
  ]);

  // Get average rating
  const ratings = await Booking.aggregate([
    {
      $match: {
        coach: new mongoose.Types.ObjectId(req.user._id),
        rating: { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  // Get monthly earnings for the past 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyEarnings = await Payment.aggregate([
    {
      $match: {
        coach: new mongoose.Types.ObjectId(req.user._id),
        status: 'completed',
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        amount: { $sum: '$coachPayout' }
      }
    },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: {
                if: { $lt: ['$_id.month', 10] },
                then: { $concat: ['0', { $toString: '$_id.month' }] },
                else: { $toString: '$_id.month' }
              }
            }
          ]
        },
        amount: 1
      }
    },
    { $sort: { month: 1 } }
  ]);

  // Get recent transactions
  const recentTransactions = await Payment.find({
    coach: new mongoose.Types.ObjectId(req.user._id)
  })
    .populate('user', 'name')
    .populate('booking', 'sessionType')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Format recent transactions
  const formattedTransactions = recentTransactions.map(transaction => ({
    _id: transaction._id,
    date: transaction.createdAt,
    user: {
      name: transaction.user?.name || 'Unknown User'
    },
    sessionType: transaction.booking?.sessionType || 'Unknown Session',
    amount: transaction.coachPayout,
    status: transaction.status
  }));

  // Prepare the response object
  const response = {
    summary: {
      totalEarnings: earningsSummary[0]?.totalEarnings || 0,
      pendingPayouts: pendingPayouts[0]?.pendingAmount || 0,
      completedSessions: earningsSummary[0]?.completedSessions || 0,
      averageRating: ratings[0]?.averageRating || 0
    },
    monthlyEarnings,
    recentTransactions: formattedTransactions
  };

  res.status(200).json({
    status: 'success',
    data: response
  });
});

exports.handleStripeWebhook = catchAsync(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new AppError(`Webhook Error: ${err.message}`, 400);
  }

  // Handle different event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handleFailedPayment(failedPayment);
      break;

    // Add other event types as needed
  }

  res.json({ received: true });
});

// Helper functions for webhook handling
const handleSuccessfulPayment = async (paymentIntent) => {
  const booking = await Booking.findOne({ 
    paymentIntentId: paymentIntent.id 
  });

  if (booking) {
    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    await booking.save();

    // Update coach earnings
    const coach = await Coach.findById(booking.coach);
    if (coach) {
      coach.totalEarnings += booking.totalAmount;
      coach.totalSessions += 1;
      await coach.save();
    }
  }
};

const handleFailedPayment = async (paymentIntent) => {
  const booking = await Booking.findOne({ 
    paymentIntentId: paymentIntent.id 
  });

  if (booking) {
    booking.paymentStatus = 'failed';
    booking.status = 'cancelled';
    await booking.save();
  }
};

exports.processRefund = catchAsync(async (req, res) => {
  const { bookingId, reason } = req.body;
  
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  
  if (booking.paymentStatus !== 'paid') {
    throw new AppError("Booking is not paid", 400);
  }
  
  // Process refund through Stripe
  const refund = await stripe.refunds.create({
    payment_intent: booking.paymentIntentId,
    reason: reason
  });
  
  // Update booking
  booking.paymentStatus = 'refunded';
  booking.refundAmount = booking.totalAmount;
  booking.refundReason = reason;
  await booking.save();
  
  successResponse(res, 200, booking, "Refund processed successfully");
});

exports.requestRefund = catchAsync(async (req, res) => {
  const { paymentId } = req.params;
  const { reason } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.user.toString() !== req.user.id) {
    throw new AppError("Unauthorized access to payment", 403);
  }

  if (payment.status !== 'succeeded') {
    throw new AppError("Payment cannot be refunded", 400);
  }

  payment.status = 'refund_requested';
  payment.refundReason = reason;
  await payment.save();

  successResponse(res, 200, { message: "Refund request submitted successfully" });
});

exports.processRefundAdmin = catchAsync(async (req, res) => {
  const { paymentId } = req.params;
  const booking = await Booking.findById(paymentId);

  if (!booking) {
    return res.status(404).json(formatResponse('error', 'Payment not found'));
  }

  const refund = await stripe.refunds.create({
    payment_intent: booking.paymentDetails.paymentIntentId
  });

  booking.paymentStatus = 'refunded';
  booking.refundRequest.status = 'approved';
  booking.refundRequest.processedAt = new Date();
  booking.refundDetails = {
    refundId: refund.id,
    amount: refund.amount / 100,
    status: refund.status,
    processedAt: new Date()
  };

  await booking.save();

  res.json(formatResponse('success', 'Refund processed successfully', { booking }));
});

exports.getAllTransactions = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ paymentStatus: { $ne: 'pending' } })
    .populate('user', 'name email')
    .populate('coach', 'name email')
    .sort('-paymentDetails.paidAt');

  const transactions = bookings.map(booking => ({
    id: booking._id,
    amount: booking.paymentDetails?.amount,
    status: booking.paymentStatus,
    paidAt: booking.paymentDetails?.paidAt,
    user: booking.user,
    coach: booking.coach,
    refundStatus: booking.refundRequest?.status
  }));

  res.json(formatResponse('success', 'Transactions retrieved successfully', { transactions }));
});

exports.getAllPayments = catchAsync(async (req, res) => {
  let query = {};

  // If the user is not an admin, they can only see their own payments
  if (req.user.role === "user") {
      query.user = req.user._id; // Users only see their own payments
  } else if (req.user.role === "coach") {
      query.coach = req.user._id; // Coaches see only payments related to them
  }

  const payments = await Payment.find(query)
      .populate("user", "name email")
      .populate("coach", "name email")
      .sort("-createdAt");

  res.status(200).json({
      status: "success",
      data: { payments }
  });
});


exports.processRefund = catchAsync(async (req, res) => {
  const { paymentId } = req.params;
  const { approve } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (approve) {
    const refund = await stripe.refunds.create({
      payment_intent: payment.paymentIntentId
    });

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    await payment.save();

    successResponse(res, 200, { message: "Refund processed successfully", refund });
  } else {
    payment.status = 'succeeded'; // Reset to original status
    payment.refundReason = null;
    await payment.save();

    successResponse(res, 200, { message: "Refund request rejected" });
  }
});