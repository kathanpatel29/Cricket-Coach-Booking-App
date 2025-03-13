const Booking = require("../models/Booking");
const Coach = require("../models/Coach");
const TimeSlot = require("../models/TimeSlot");
const Payment = require("../models/Payment");
const { AppError, catchAsync } = require("../middlewares/errorMiddleware");
const { formatResponse } = require("../utils/responseFormatter");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { startOfDay, endOfDay } = require("date-fns");
const { createNotification } = require("../controllers/notificationController");
const Notification = require("../models/Notification");

/**
 * @desc Create a new booking
 * @route POST /api/bookings
 * @access Private/User
 */
exports.createBooking = catchAsync(async (req, res) => {
  const { coachId, timeSlotId } = req.body;
  const userId = req.user._id;

  // Validate coach existence and approval
  const coach = await Coach.findById(coachId).populate("user", "isApproved");
  if (!coach || coach.status !== "approved") throw new AppError("Coach not found or not approved", 404);

  // Validate and fetch time slot
  const timeSlot = await TimeSlot.findById(timeSlotId);
  if (!timeSlot) throw new AppError("Time slot not found", 400);
  
  // Check if the time slot is available
  if (timeSlot.status !== "available") throw new AppError("Time slot is not available", 400);
  
  // Check if the time slot has remaining capacity
  if (timeSlot.isFull || timeSlot.bookedCount >= timeSlot.capacity) {
    throw new AppError("This time slot is fully booked", 400);
  }

  // Calculate payment amount (but don't process payment yet)
  const paymentAmount = coach.hourlyRate * (timeSlot.duration / 60);

  // Create new booking with pending_approval status
  const booking = await Booking.create({
    user: userId,
    coach: coach._id,
    timeSlot: timeSlot._id,
    status: "pending_approval",
    paymentStatus: "awaiting_approval",
    paymentAmount
  });

  // Update time slot's booked count and bookings array
  timeSlot.bookedCount += 1;
  if (!timeSlot.bookings) timeSlot.bookings = [];
  timeSlot.bookings.push(booking._id);
  await timeSlot.save();

  // Create notification for coach about new booking request
  await createNotification(coach.user, "booking_request", `New booking request from ${req.user.name}`, {
    bookingId: booking._id,
    userName: req.user.name,
    dateTime: `${new Date(timeSlot.date).toLocaleDateString()} at ${timeSlot.startTime}`
  });

  res.status(201).json(formatResponse("success", "Booking request created successfully", {
    booking,
    message: "Your booking request has been sent to the coach. You'll be notified once they approve or reject it."
  }));
});

/**
 * @desc Get user's bookings
 * @route GET /api/user/bookings
 * @access Private/User
 */
exports.getUserBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate({
      path: "coach",
      select: "user specializations hourlyRate status",
      populate: {
        path: "user",
        select: "name email profileImage"
      }
    })
    .populate("timeSlot")
    .sort({ createdAt: -1 });

  console.log("User bookings:", bookings);
  res.json(formatResponse("success", "User bookings retrieved", { bookings }));
});

/**
 * @desc Get coach's bookings
 * @route GET /api/coach/bookings
 * @access Private/Coach
 */
exports.getCoachBookings = catchAsync(async (req, res) => {
  const coach = await Coach.findOne({ user: req.user.id });
  if (!coach) throw new AppError("Coach profile not found", 404);

  const bookings = await Booking.find({ coach: coach._id })
    .populate("user", "name email profileImage")
    .populate("timeSlot")
    .sort({ createdAt: -1 });

  console.log("Coach bookings:", bookings);
  res.json(formatResponse("success", "Coach bookings retrieved", { bookings }));
});

/**
 * @desc Get booking by ID
 * @route GET /api/bookings/:id
 * @access Private
 */
exports.getBookingById = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("user", "name email")
    .populate({
      path: "coach",
      select: "user specializations hourlyRate",
      populate: {
        path: "user",
        select: "name email profileImage"
      }
    })
    .populate("timeSlot");

  if (!booking) throw new AppError("Booking not found", 404);
  
  // Restrict access based on user role
  // Admin can access any booking
  // Coach can access bookings for their services
  // User can only access their own bookings
  if (req.user.role === 'user' && booking.user._id.toString() !== req.user.id) {
    throw new AppError("You are not authorized to access this booking", 403);
  } else if (req.user.role === 'coach') {
    const coach = await Coach.findOne({ user: req.user.id });
    if (!coach || booking.coach._id.toString() !== coach._id.toString()) {
      throw new AppError("You are not authorized to access this booking", 403);
    }
  }

  res.json(formatResponse("success", "Booking details retrieved", { booking }));
});

/**
 * @desc Update booking status
 * @route PATCH /api/bookings/:id/status
 * @access Private/Coach
 */
exports.updateBookingStatus = catchAsync(async (req, res) => {
  const { status, reason } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError("Booking not found", 404);

  if (!["confirmed", "completed", "cancelled", "no-show"].includes(status)) {
    throw new AppError("Invalid booking status", 400);
  }

  booking.status = status;
  if (status === "cancelled") {
    booking.cancellationReason = reason;
    booking.cancelledBy = req.user.id;
  }

  await booking.save();
  res.json(formatResponse("success", "Booking status updated", { booking }));
});

/**
 * @desc Cancel booking
 * @route PATCH /api/bookings/:id/cancel
 * @access Private/User
 */
exports.cancelBooking = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(id)
      .populate('coach', 'user')
      .populate('user', 'email name');

    if (!booking) {
      return res.status(404).json({ status: 'error', message: 'Booking not found' });
    }

    // Check if user is authorized to cancel this booking
    const isCoach = req.user.role === 'coach' && booking.coach._id.toString() === req.user.coachProfile._id.toString();
    const isBookingUser = booking.user._id.toString() === userId.toString();

    if (!isCoach && !isBookingUser) {
      return res.status(403).json({ status: 'error', message: 'You are not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled (not already completed or cancelled)
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: `Booking cannot be cancelled as it is already ${booking.status}`,
      });
    }

    // Process refund if payment has been made
    let refundProcessed = false;
    let refundError = null;

    if (booking.paymentStatus === 'paid' && booking.stripePaymentIntentId) {
      try {
        console.log(`Processing refund for booking ${booking._id} with payment intent ${booking.stripePaymentIntentId}`);
        
        // In a real application, you would use Stripe's API to create a refund
        // For this mock implementation, we'll simulate a successful refund
        // const refund = await stripe.refunds.create({
        //   payment_intent: booking.stripePaymentIntentId,
        // });
        
        // Mock successful refund
        const refund = { 
          id: `re_mock_${Date.now()}`,
          status: 'succeeded'
        };
        
        if (refund.status === 'succeeded') {
          booking.paymentStatus = 'refunded';
          booking.refundId = refund.id;
          refundProcessed = true;
          console.log(`Refund processed successfully: ${refund.id}`);
        }
      } catch (error) {
        console.error('Error processing refund:', error);
        refundError = error.message || 'Failed to process refund';
      }
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = userId;
    
    // Add cancellation reason if provided
    if (req.body.reason) {
      booking.cancellationReason = req.body.reason;
    }

    await booking.save();

    // Determine who cancelled
    const cancelledBy = isCoach ? 'coach' : 'user';

    // Send notifications
    // To the user if coach cancelled
    if (isCoach) {
      await Notification.create({
        recipient: booking.user._id,
        type: 'booking_cancelled',
        message: `Your booking with ${req.user.name} has been cancelled by the coach.${refundProcessed ? ' Your payment has been refunded.' : ''}`,
        relatedBooking: booking._id,
      });
    }
    
    // To the coach if user cancelled
    if (isBookingUser) {
      await Notification.create({
        recipient: booking.coach.user,
        type: 'booking_cancelled',
        message: `Booking with ${booking.user.name} has been cancelled by the user.`,
        relatedBooking: booking._id,
      });
    }

    // If there was a refund error but we still cancelled the booking
    if (refundError) {
      // Notify user about the refund issue
      await Notification.create({
        recipient: booking.user._id,
        type: 'refund_failed',
        message: `Your booking was cancelled but there was an issue processing your refund. Please contact support.`,
        relatedBooking: booking._id,
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        booking,
        refundProcessed,
        refundError
      },
      message: `Booking has been cancelled successfully${refundProcessed ? ' and payment has been refunded' : ''}${refundError ? ', but there was an issue with the refund' : ''}`,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while cancelling the booking',
    });
  }
});

/**
 * @desc Get available slots for a coach
 * @route GET /api/bookings/slots/:coachId
 * @access Public
 */
exports.getAvailableSlots = catchAsync(async (req, res) => {
  const { coachId } = req.params;
  const timeSlots = await TimeSlot.find({ coach: coachId, status: "available" }).sort("startTime");

  res.json(formatResponse("success", "Available slots retrieved", { timeSlots }));
});

/**
 * @desc Accept a booking request
 * @route PUT /api/coach/bookings/:id/accept
 * @access Private/Coach
 */
exports.acceptBooking = catchAsync(async (req, res) => {
  const bookingId = req.params.id;
  
  // Find the booking
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);
  
  // Verify coach ownership
  const coach = await Coach.findOne({ user: req.user.id });
  if (!coach || booking.coach.toString() !== coach._id.toString()) {
    throw new AppError("Unauthorized to accept this booking", 403);
  }
  
  // Check if booking is in a valid state to accept
  if (booking.status !== "pending") {
    throw new AppError(`Cannot accept booking with status: ${booking.status}`, 400);
  }
  
  // Update booking status
  booking.status = "confirmed";
  await booking.save();
  
  // Notify the user
  await createNotification(
    booking.user,
    "booking",
    `Your booking request has been accepted by the coach`
  );
  
  res.json(formatResponse("success", "Booking accepted successfully", { booking }));
});

/**
 * @desc Reject a booking request
 * @route PUT /api/coach/bookings/:id/reject
 * @access Private/Coach
 */
exports.rejectBooking = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const { reason } = req.body;
  
  // Find the booking
  const booking = await Booking.findById(bookingId)
    .populate("user")
    .populate("coach")
    .populate("timeSlot");
    
  if (!booking) throw new AppError("Booking not found", 404);
  
  // Find coach profile for the current user
  const coach = await Coach.findOne({ user: req.user.id });
  if (!coach) throw new AppError("Coach profile not found", 404);
  
  // Verify this coach owns this booking
  if (booking.coach._id.toString() !== coach._id.toString()) {
    throw new AppError("You are not authorized to manage this booking", 403);
  }
  
  // Verify booking is in pending_approval state
  if (booking.status !== "pending_approval") {
    throw new AppError("This booking cannot be rejected because it's not in pending approval state", 400);
  }
  
  // Find the time slot to update
  const timeSlot = await TimeSlot.findById(booking.timeSlot);
  if (timeSlot) {
    // Decrease booked count
    timeSlot.bookedCount = Math.max(0, timeSlot.bookedCount - 1);
    
    // Remove this booking from bookings array if it exists
    if (timeSlot.bookings && timeSlot.bookings.length > 0) {
      timeSlot.bookings = timeSlot.bookings.filter(
        id => id.toString() !== booking._id.toString()
      );
    }
    
    await timeSlot.save();
  }
  
  // Update booking status to rejected
  booking.status = "rejected";
  booking.rejectionReason = reason || "No reason provided";
  await booking.save();
  
  // Create notification for user
  await createNotification(booking.user._id, "booking_rejected", 
    `Your booking request has been rejected by the coach`, {
      bookingId: booking._id,
      coachName: req.user.name,
      reason: booking.rejectionReason,
      dateTime: `${new Date(booking.timeSlot.date).toLocaleDateString()} at ${booking.timeSlot.startTime}`
    }
  );
  
  res.json(formatResponse("success", "Booking request rejected", {
    booking,
    message: "The user has been notified about the rejection."
  }));
});

/**
 * @desc Get coach's available time slots by date
 * @route GET /api/public/coaches/:id/availability
 * @access Public
 */
exports.getCoachAvailabilityByDate = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  
  if (!date) {
    throw new AppError("Date parameter is required", 400);
  }
  
  // Validate coach existence and approval
  const coach = await Coach.findById(id);
  if (!coach || (!coach.isApproved && coach.status !== "approved")) {
    throw new AppError("Coach not found or not approved", 404);
  }
  
  // Create date range for the requested date (start to end of day)
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  // Get available time slots
  const availableSlots = await TimeSlot.find({
    coach: coach._id,
    status: "available",
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ startTime: 1 });
  
  res.json(formatResponse("success", "Coach availability retrieved successfully", { 
    availableSlots,
    coach: {
      id: coach._id,
      hourlyRate: coach.hourlyRate
    }
  }));
});

/**
 * @desc Coach approves a booking request
 * @route PUT /api/coach/bookings/:bookingId/approve
 * @access Private/Coach
 */
exports.approveBooking = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  
  // Find the booking
  const booking = await Booking.findById(bookingId)
    .populate("user")
    .populate("coach")
    .populate("timeSlot");
    
  if (!booking) throw new AppError("Booking not found", 404);
  
  // Find coach profile for the current user
  const coach = await Coach.findOne({ user: req.user.id });
  if (!coach) throw new AppError("Coach profile not found", 404);
  
  // Verify this coach owns this booking
  if (booking.coach._id.toString() !== coach._id.toString()) {
    throw new AppError("You are not authorized to manage this booking", 403);
  }
  
  // Verify booking is in pending_approval state
  if (booking.status !== "pending_approval") {
    throw new AppError("This booking cannot be approved because it's not in pending approval state", 400);
  }
  
  // Update booking status to approved
  booking.status = "approved";
  booking.paymentStatus = "awaiting_payment";
  booking.approvalDate = new Date();
  await booking.save();
  
  // Create notification for user
  await createNotification(booking.user._id, "booking_approved", 
    `Your booking request has been approved by ${req.user.name}`, {
      bookingId: booking._id,
      coachName: req.user.name,
      dateTime: `${new Date(booking.timeSlot.date).toLocaleDateString()} at ${booking.timeSlot.startTime}`
    }
  );
  
  res.json(formatResponse("success", "Booking request approved", {
    booking,
    message: "The user has been notified and can now proceed with payment."
  }));
});

/**
 * @desc Process payment for an approved booking
 * @route POST /api/user/bookings/:bookingId/payment
 * @access Private/User
 */
exports.processPayment = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  
  // Find the booking
  const booking = await Booking.findById(bookingId)
    .populate("coach")
    .populate("timeSlot");
    
  if (!booking) throw new AppError("Booking not found", 404);
  
  // Verify user owns this booking
  if (booking.user.toString() !== req.user.id) {
    throw new AppError("You are not authorized to pay for this booking", 403);
  }
  
  // Verify booking is in approved state
  if (booking.status !== "approved" || booking.paymentStatus !== "awaiting_payment") {
    throw new AppError("This booking is not ready for payment", 400);
  }
  
  // Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.paymentAmount * 100), // Convert to cents
    currency: "cad",
    metadata: { 
      bookingId: booking._id.toString(), 
      coachId: booking.coach._id.toString(), 
      userId: req.user.id
    }
  });

  // Store payment details
  await Payment.create({
    booking: booking._id,
    amount: booking.paymentAmount,
    status: "pending",
    stripePaymentIntentId: paymentIntent.id,
    stripeUserSecret: paymentIntent.client_secret
  });
  
  res.json(formatResponse("success", "Payment intent created", {
    clientSecret: paymentIntent.client_secret,
    booking,
    paymentAmount: booking.paymentAmount
  }));
});

/**
 * @desc Mark a booking as completed by the coach
 * @route PUT /api/coach/bookings/:id/complete
 * @access Private/Coach
 */
exports.completeBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const coachId = req.user.coach;

  // Find the booking
  const booking = await Booking.findById(id);
  if (!booking) throw new AppError("Booking not found", 404);

  // Verify that this booking belongs to the coach
  if (booking.coach.toString() !== coachId.toString()) {
    throw new AppError("You are not authorized to complete this booking", 403);
  }

  // Check if the booking is in a valid state to be completed
  if (booking.status === 'cancelled' || booking.status === 'rejected') {
    throw new AppError("Cannot complete a cancelled or rejected booking", 400);
  }

  if (booking.status === 'completed') {
    throw new AppError("This booking is already marked as completed", 400);
  }

  // Update the booking status
  booking.status = 'completed';
  booking.completedAt = new Date();
  await booking.save();

  // Create a notification for the user
  await createNotification({
    recipient: booking.user,
    type: 'booking_completed',
    title: 'Booking Completed',
    message: `Your booking with ${req.user.name} has been marked as completed.`,
    relatedId: booking._id,
    relatedModel: 'Booking'
  });

  // Return success response
  return formatResponse(res, {
    status: "success",
    message: "Booking marked as completed successfully",
    data: { booking }
  });
});
