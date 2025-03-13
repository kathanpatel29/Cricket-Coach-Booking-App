require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/Booking");
const Coach = require("../models/Coach");
const Payment = require("../models/Payment");
const { AppError, catchAsync } = require("../middlewares/errorMiddleware");
const { formatResponse } = require("../utils/responseFormatter");

/**
 * @desc Create Stripe payment intent for a booking
 * @route POST /api/payments/intent/:bookingId
 * @access Private/User
 */
exports.createPaymentIntent = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  
  const booking = await Booking.findById(bookingId).populate("coach");
  if (!booking) throw new AppError("Booking not found", 404);

  if (booking.user.toString() !== req.user._id.toString()) {
    throw new AppError("Unauthorized access to this booking", 403);
  }

  if (booking.paymentStatus !== "pending") {
    throw new AppError(`Payment already ${booking.paymentStatus}`, 400);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.paymentAmount * 100),
    currency: "cad",
    metadata: { 
      bookingId: booking._id.toString(),
      coachId: booking.coach._id.toString(),
      userId: booking.user.toString()
    }
  });

  let payment = await Payment.findOne({ booking: booking._id });
  if (!payment) {
    payment = new Payment({
      booking: booking._id,
      amount: booking.paymentAmount,
      status: "pending",
      stripePaymentIntentId: paymentIntent.id,
      stripeUserSecret: paymentIntent.client_secret
    });
  } else {
    payment.stripePaymentIntentId = paymentIntent.id;
    payment.stripeUserSecret = paymentIntent.client_secret;
  }

  await payment.save();

  res.json(formatResponse("success", "Payment intent created", {
    clientSecret: paymentIntent.client_secret,
    paymentId: payment._id
  }));
});

/**
 * @desc Confirm a Stripe payment
 * @route POST /api/payments/confirm/:bookingId
 * @access Private/User
 */
exports.confirmPayment = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const { paymentIntentId } = req.body;

  const booking = await Booking.findById(bookingId)
    .populate('coach')
    .populate('user');
    
  if (!booking) throw new AppError("Booking not found", 404);

  if (booking.user._id.toString() !== req.user._id.toString()) {
    throw new AppError("Unauthorized access to this booking", 403);
  }
  
  // Verify booking is in the correct state for payment
  if (booking.status !== "approved" || booking.paymentStatus !== "awaiting_payment") {
    throw new AppError("This booking is not ready for payment. Coach approval is required first.", 400);
  }

  // For demo purposes, we'll simulate a successful Stripe payment
  // In a real implementation, you would verify with Stripe
  // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  // if (paymentIntent.status !== "succeeded") {
  //   throw new AppError(`Payment not successful. Status: ${paymentIntent.status}`, 400);
  // }

  // Update booking status from approved to confirmed
  booking.status = "confirmed";
  booking.paymentStatus = "paid";
  booking.paymentDate = new Date();
  booking.paymentId = paymentIntentId;
  await booking.save();

  // Update payment record
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
  if (payment) {
    payment.status = "succeeded";
    await payment.save();
  }

  // Notify the coach about the confirmed booking
  const { createNotification } = require("../controllers/notificationController");
  
  await createNotification(
    booking.coach.user,
    "booking_confirmed",
    `Booking confirmed: ${req.user.name} has completed payment for their session.`,
    { 
      bookingId: booking._id,
      userName: req.user.name,
      coachName: booking.coach.user.name,
      amount: booking.paymentAmount
    }
  );

  // Notify the user about successful payment
  await createNotification(
    booking.user._id,
    "payment_successful",
    "Your payment was successful. Your booking is now confirmed!",
    { 
      bookingId: booking._id,
      amount: booking.paymentAmount
    }
  );

  res.json(formatResponse("success", "Payment confirmed successfully", { booking }));
});

/**
 * @desc Get user payment history
 * @route GET /api/payments/history
 * @access Private/User
 */
exports.getPaymentHistory = catchAsync(async (req, res) => {
  const payments = await Payment.find({ 
    booking: { $in: await Booking.find({ user: req.user.id }).select('_id') }
  })
  .populate({
    path: 'booking',
    populate: [
      { path: 'coach', select: 'user specializations hourlyRate' },
      { path: 'timeSlot', select: 'date startTime duration' }
    ]
  })
  .sort('-createdAt');

  res.json(formatResponse("success", "Payment history retrieved", { payments }));
});

/**
 * @desc Process a refund for a booking
 * @route POST /api/payments/refund
 * @access Private/Admin
 */
exports.refundPayment = catchAsync(async (req, res) => {
  const { bookingId, reason } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);

  if (booking.paymentStatus !== "paid") {
    throw new AppError("Booking is not paid", 400);
  }

  const refund = await stripe.refunds.create({
    payment_intent: booking.paymentId,
    reason: "requested_by_customer"
  });

  booking.paymentStatus = "refunded";
  booking.status = "cancelled";
  booking.cancellationReason = reason;
  booking.cancellationDate = new Date();
  await booking.save();

  const coach = await Coach.findById(booking.coach);
  coach.totalEarnings -= booking.paymentAmount;
  coach.totalSessions -= 1;
  await coach.save();

  res.json(formatResponse("success", "Payment refunded successfully", { booking, refund }));
});

/**
 * @desc Get coach earnings summary
 * @route GET /api/payments/coach/earnings
 * @access Private/Coach
 */
exports.getCoachEarnings = catchAsync(async (req, res) => {
  const earningsSummary = await Payment.aggregate([
    {
      $match: {
        coach: req.user._id,
        status: "succeeded"
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: "$coachPayout" },
        completedSessions: { $sum: 1 }
      }
    }
  ]);

  res.json(formatResponse("success", "Coach earnings retrieved", {
    totalEarnings: earningsSummary[0]?.totalEarnings || 0,
    completedSessions: earningsSummary[0]?.completedSessions || 0
  }));
});

/**
 * @desc Handle Stripe webhook events
 * @route POST /api/payments/webhook
 * @access Public
 */
exports.handleStripeWebhook = catchAsync(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new AppError(`Webhook Error: ${err.message}`, 400);
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      await handleSuccessfulPayment(event.data.object);
      break;
    case "payment_intent.payment_failed":
      await handleFailedPayment(event.data.object);
      break;
  }

  res.json({ received: true });
});

async function handleSuccessfulPayment(paymentIntent) {
  const booking = await Booking.findById(paymentIntent.metadata.bookingId);
  if (!booking) return;

  booking.paymentStatus = "paid";
  booking.status = "confirmed";
  await booking.save();

  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
  if (payment) {
    payment.status = "succeeded";
    await payment.save();
  }
}

async function handleFailedPayment(paymentIntent) {
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
  if (payment) {
    payment.status = "failed";
    await payment.save();
  }
}

/**
 * @desc Get payments for a coach
 * @route GET /api/coach/payments
 * @access Private/Coach
 */
exports.getCoachPayments = catchAsync(async (req, res) => {
  const coach = await Coach.findOne({ user: req.user.id });
  if (!coach) throw new AppError("Coach profile not found", 404);

  const payments = await Payment.find({
    booking: { $in: await Booking.find({ coach: coach._id }).select('_id') }
  })
  .populate({
    path: 'booking',
    populate: [
      { path: 'user', select: 'name email' },
      { path: 'timeSlot', select: 'date startTime duration' }
    ]
  })
  .sort('-createdAt');

  res.json(formatResponse("success", "Coach payments retrieved", { payments }));
});
