const Coach = require("../models/Coach");
const User = require("../models/User");
const { AppError, catchAsync } = require("../utils/errorHandler");
const { successResponse } = require("../utils/responseFormatter");

exports.getPendingCoaches = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const coaches = await Coach.find({ isApproved: false })
    .populate('user', 'name email createdAt')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Coach.countDocuments({ isApproved: false });

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

  coach.isApproved = true;
  coach.approvedAt = new Date();
  coach.approvedBy = req.user.id;
  coach.approvalNotes = notes;

  await coach.save();

  // Update user status
  await User.findByIdAndUpdate(coach.user._id, {
    isApproved: true,
    approvedAt: new Date()
  });

  successResponse(res, 200, coach, "Coach approved successfully");
});

exports.rejectCoach = catchAsync(async (req, res) => {
  const { coachId } = req.params;
  const { reason } = req.body;

  const coach = await Coach.findById(coachId).populate('user');
  if (!coach) {
    throw new AppError("Coach profile not found", 404);
  }

  coach.isApproved = false;
  coach.rejectionReason = reason;
  coach.rejectedAt = new Date();
  coach.rejectedBy = req.user.id;

  await coach.save();

  successResponse(res, 200, coach, "Coach application rejected");
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