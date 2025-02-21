const Coach = require("../models/Coach");
const User = require("../models/User");
const { AppError, catchAsync } = require("../utils/errorHandler");
const { successResponse } = require("../utils/responseFormatter");

exports.getPendingCoaches = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const coaches = await Coach.find({ 
    status: 'pending',
    isApproved: false 
  })
    .populate({
      path: 'user',
      select: 'name email createdAt role'
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Coach.countDocuments({ 
    status: 'pending',
    isApproved: false 
  });

  // Log for debugging
  console.log('Found pending coaches:', coaches.length);
  console.log('Total count:', total);

  successResponse(res, 200, {
    coaches,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

exports.approveCoach = catchAsync(async (req, res) => {
  const { coachId } = req.params;
  const { notes } = req.body;

  const coach = await Coach.findById(coachId).populate('user');
  if (!coach) {
    throw new AppError("Coach profile not found", 404);
  }

  // Update coach status
  coach.status = 'approved';
  coach.isApproved = true;
  coach.approvedAt = new Date();
  coach.approvedBy = req.user.id;
  coach.approvalNotes = notes;

  await coach.save();

  // Update user status
  await User.findByIdAndUpdate(coach.user._id, {
    isApproved: true,
    role: 'coach'
  });

  successResponse(res, 200, { coach }, "Coach approved successfully");
});

exports.rejectCoach = catchAsync(async (req, res) => {
  const { coachId } = req.params;
  const { reason } = req.body;

  const coach = await Coach.findById(coachId).populate('user');
  if (!coach) {
    throw new AppError("Coach profile not found", 404);
  }

  // Update coach status
  coach.status = 'rejected';
  coach.isApproved = false;
  coach.rejectionReason = reason;
  coach.approvedAt = null;
  coach.approvedBy = null;

  await coach.save();

  // Update user status
  await User.findByIdAndUpdate(coach.user._id, {
    isApproved: false,
    role: 'user'  // Reset role to user when rejected
  });

  successResponse(res, 200, { coach }, "Coach application rejected");
});

exports.getCoachApprovalHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = {};

  if (status) {
    query.isApproved = status === 'approved';
  }

  const coaches = await Coach.find(query)
    .populate('user', 'name email')
    .populate('approvedBy', 'name')
    .populate('rejectedBy', 'name')
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Coach.countDocuments(query);

  successResponse(res, 200, {
    coaches,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});