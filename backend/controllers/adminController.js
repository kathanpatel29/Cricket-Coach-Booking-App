const User = require('../models/User');
const Coach = require('../models/Coach');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const { formatResponse } = require('../utils/responseFormatter');
const { AppError, catchAsync } = require('../middlewares/errorMiddleware');

/**
 * @desc Get all users
 * @route GET /api/admin/users
 * @access Private/Admin
 */
exports.getAllUsers = catchAsync(async (req, res) => {
  const { search } = req.query;
  const query = search
    ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
    : {};

  const users = await User.find(query).select('-password').sort('-createdAt');

  res.json(formatResponse('success', 'Users retrieved successfully', { users }));
});

/**
 * @desc Get user by ID
 * @route GET /api/admin/users/:id
 * @access Private/Admin
 */
exports.getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) throw new AppError('User not found', 404);
  res.json(formatResponse('success', 'User retrieved successfully', { user }));
});

/**
 * @desc Update user
 * @route PUT /api/admin/users/:id
 * @access Private/Admin
 */
exports.updateUser = catchAsync(async (req, res) => {
  const { name, email, role, isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user._id.toString() === req.user.id) throw new AppError('Use profile update for your own account', 400);

  if (email && email !== user.email && (await User.findOne({ email }))) {
    throw new AppError('Email already in use', 400);
  }

  Object.assign(user, { name, email, role, isActive });

  await user.save();
  res.json(formatResponse('success', 'User updated successfully', { user }));
});

/**
 * @desc Delete user
 * @route DELETE /api/admin/users/:id
 * @access Private/Admin
 */
exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user._id.toString() === req.user.id) throw new AppError('Cannot delete your own account', 400);

  await user.deleteOne();
  res.json(formatResponse('success', 'User deleted successfully'));
});

/**
 * @desc Get all coaches
 * @route GET /api/admin/coaches
 * @access Private/Admin
 */
exports.getAllCoaches = catchAsync(async (req, res) => {
  const coaches = await Coach.find()
    .populate('user', 'name email phone')
    .sort('-createdAt');

  res.json(formatResponse('success', 'Coaches retrieved successfully', { coaches }));
});

/**
 * @desc Approve coach
 * @route PUT /api/admin/coaches/:id/approve
 * @access Private/Admin
 */
exports.approveCoach = catchAsync(async (req, res) => {
  const coach = await Coach.findById(req.params.id);
  if (!coach) throw new AppError('Coach not found', 404);

  Object.assign(coach, { isApproved: true, status: 'approved', approvedAt: new Date(), approvedBy: req.user._id });
  await coach.save();

  await User.findByIdAndUpdate(coach.user, { role: 'coach' });

  res.json(formatResponse('success', 'Coach approved successfully'));
});

/**
 * @desc Reject coach
 * @route PUT /api/admin/coaches/:id/reject
 * @access Private/Admin
 */
exports.rejectCoach = catchAsync(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw new AppError('Rejection reason is required', 400);

  const coach = await Coach.findById(req.params.id);
  if (!coach) throw new AppError('Coach not found', 404);

  Object.assign(coach, { status: 'rejected', rejectionReason: reason });
  await coach.save();

  res.json(formatResponse('success', 'Coach application rejected'));
});

/**
 * @desc Get all bookings
 * @route GET /api/admin/bookings
 * @access Private/Admin
 */
exports.getAllBookings = catchAsync(async (req, res) => {
  // Enhance query to fully populate the required fields
  const bookings = await Booking.find()
    .populate('user', 'name email')
    .populate({
      path: 'coach',
      select: 'user hourlyRate',
      populate: {
        path: 'user',
        select: 'name email profileImage'
      }
    })
    .populate('timeSlot')
    .sort('-createdAt');

  // Process bookings to ensure consistent data structure
  const processedBookings = bookings.map(booking => {
    const bookingObj = booking.toObject();
    
    // Add convenient direct fields
    if (booking.timeSlot) {
      bookingObj.date = booking.timeSlot.date;
      bookingObj.startTime = booking.timeSlot.startTime;
      bookingObj.endTime = booking.timeSlot.endTime;
      bookingObj.duration = booking.timeSlot.duration;
    }
    
    // Ensure coach name is accessible
    const coachName = booking.coach?.user?.name || 'Unknown Coach';
    bookingObj.coachName = coachName;
    
    // Ensure user name is accessible
    const userName = booking.user?.name || 'Unknown User';
    bookingObj.userName = userName;
    
    return bookingObj;
  });

  res.json(formatResponse('success', 'Bookings retrieved successfully', { bookings: processedBookings }));
});

/**
 * @desc Update booking
 * @route PUT /api/admin/bookings/:id
 * @access Private/Admin
 */
exports.updateBooking = catchAsync(async (req, res) => {
  const { status, notes } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError('Booking not found', 404);

  Object.assign(booking, { status, adminNotes: notes, updatedBy: req.user._id });
  await booking.save();

  res.json(formatResponse('success', 'Booking updated successfully', { booking }));
});

/**
 * @desc Get dashboard statistics
 * @route GET /api/admin/stats
 * @access Private/Admin
 */
exports.getDashboardStats = catchAsync(async (req, res) => {
  const [totalUsers, totalBookings, totalRevenue] = await Promise.all([
    User.countDocuments(),
    Booking.countDocuments(),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
  ]);

  res.json({
    status: 'success',
    data: {
      totalUsers,
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0
    }
  });
});

/**
 * @desc Get pending reviews
 * @route GET /api/admin/reviews/pending
 * @access Private/Admin
 */
exports.getPendingReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ status: 'pending' })
    .populate('user', 'name email')
    .populate('coach', 'user')
    .sort('-createdAt');

  res.json(formatResponse('success', 'Pending reviews retrieved successfully', { reviews }));
});

/**
 * @desc Moderate review
 * @route PUT /api/admin/reviews/:id
 * @access Private/Admin
 */
exports.moderateReview = catchAsync(async (req, res) => {
  const { status, moderationNotes } = req.body;
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  Object.assign(review, { status, moderationNotes, moderatedBy: req.user._id, moderatedAt: new Date() });
  await review.save();

  res.json(formatResponse('success', 'Review moderated successfully', { review }));
});

/**
 * @desc Get all payments
 * @route GET /api/admin/payments
 * @access Private/Admin
 */
exports.getAllPayments = catchAsync(async (req, res) => {
  const { status, startDate, endDate, search } = req.query;
  
  let query = {};
  
  // Filter by status
  if (status) {
    query.status = status;
  }
  
  // Filter by date range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  // Search by booking ID or user email
  if (search) {
    const bookings = await Booking.find({
      $or: [
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null },
        { user: { $in: await User.find({ email: new RegExp(search, 'i') }).select('_id') } }
      ]
    }).select('_id');
    
    query.booking = { $in: bookings.map(b => b._id) };
  }
  
  const payments = await Payment.find(query)
    .populate({
      path: 'booking',
      populate: [
        { path: 'user', select: 'name email' },
        { path: 'coach', select: 'user specializations hourlyRate' },
        { path: 'timeSlot', select: 'date startTime duration' }
      ]
    })
    .sort('-createdAt');
  
  res.json(formatResponse('success', 'All payments retrieved', { payments }));
});

/**
 * @desc Get payment by ID
 * @route GET /api/admin/payments/:id
 * @access Private/Admin
 */
exports.getPaymentById = catchAsync(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate({
      path: 'booking',
      populate: [
        { path: 'user', select: 'name email' },
        { path: 'coach', select: 'user specializations hourlyRate' },
        { path: 'timeSlot', select: 'date startTime duration' }
      ]
    });
  
  if (!payment) throw new AppError('Payment not found', 404);
  
  res.json(formatResponse('success', 'Payment details retrieved', { payment }));
});

/**
 * @desc Update payment status
 * @route PUT /api/admin/payments/:id/status
 * @access Private/Admin
 */
exports.updatePaymentStatus = catchAsync(async (req, res) => {
  const { status, notes } = req.body;
  
  if (!['pending', 'succeeded', 'failed', 'refunded'].includes(status)) {
    throw new AppError('Invalid payment status', 400);
  }
  
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new AppError('Payment not found', 404);
  
  payment.status = status;
  if (notes) payment.adminNotes = notes;
  await payment.save();
  
  // Update booking payment status if needed
  if (payment.booking) {
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.paymentStatus = status === 'succeeded' ? 'paid' : 
                             status === 'refunded' ? 'refunded' : 
                             status === 'failed' ? 'failed' : 'pending';
      await booking.save();
    }
  }
  
  res.json(formatResponse('success', 'Payment status updated', { payment }));
});

/**
 * @desc Get admin dashboard data
 * @route GET /api/admin/dashboard
 * @access Private/Admin
 */
exports.getAdminDashboard = catchAsync(async (req, res) => {
  // Get stats
  const [
    totalUsers,
    totalCoaches,
    pendingCoaches,
    totalBookings,
    totalReviews
  ] = await Promise.all([
    User.countDocuments(),
    Coach.countDocuments({ status: 'approved' }),
    Coach.countDocuments({ status: 'pending' }),
    Booking.countDocuments(),
    Review.countDocuments()
  ]);

  // Get total revenue
  const revenueResult = await Payment.aggregate([
    { $match: { status: 'succeeded' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const totalRevenue = revenueResult[0]?.total || 0;

  // Get average rating
  const ratingResult = await Review.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: null, average: { $avg: '$rating' } } }
  ]);
  
  const averageRating = ratingResult[0]?.average || 0;

  // Get recent users (last 5)
  const recentUsers = await User.find()
    .sort('-createdAt')
    .limit(5)
    .select('name email role createdAt');

  // Get pending coach approvals (last 5)
  const pendingCoachList = await Coach.find({ status: 'pending' })
    .sort('-createdAt')
    .limit(5)
    .populate('user', 'name email')
    .select('specializations experience hourlyRate createdAt bio');

  // Get recent bookings (last 5)
  const recentBookings = await Booking.find()
    .sort('-createdAt')
    .limit(5)
    .populate('user', 'name')
    .populate('coach', 'user')
    .select('status date time amount createdAt');

  // Format recent bookings for frontend
  const formattedBookings = recentBookings.map(booking => ({
    id: booking._id,
    userName: booking.user?.name || 'Unknown User',
    coachName: booking.coach?.user?.name || 'Unknown Coach',
    date: booking.date,
    status: booking.status,
    amount: booking.amount
  }));

  // Get recent reviews (last 5)
  const recentReviews = await Review.find()
    .sort('-createdAt')
    .limit(5)
    .populate('user', 'name')
    .populate({
      path: 'coach',
      populate: { path: 'user', select: 'name' }
    })
    .select('rating comment status createdAt');

  // Format recent reviews for frontend
  const formattedReviews = recentReviews.map(review => ({
    id: review._id,
    userName: review.user?.name || 'Unknown User',
    coachName: review.coach?.user?.name || 'Unknown Coach',
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    createdAt: review.createdAt,
    isModerated: review.status !== 'pending'
  }));

  // Return dashboard data with expected structure
  res.json(formatResponse('success', 'Dashboard data retrieved successfully', {
    stats: {
      totalUsers,
      totalCoaches,
      pendingCoaches,
      totalBookings,
      totalRevenue,
      averageRating: parseFloat(averageRating.toFixed(1))
    },
    recentUsers,
    pendingCoaches: pendingCoachList.map(coach => ({
      id: coach._id,
      name: coach.user?.name || 'Unknown',
      email: coach.user?.email || 'Unknown',
      experience: coach.experience,
      specializations: coach.specializations,
      hourlyRate: coach.hourlyRate || 0,
      createdAt: coach.createdAt,
      bio: coach.bio || 'No bio provided'
    })),
    recentBookings: formattedBookings,
    recentReviews: formattedReviews
  }));
});
