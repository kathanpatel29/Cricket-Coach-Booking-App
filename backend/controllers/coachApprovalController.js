const Coach = require("../models/Coach");
const User = require("../models/User");
const { AppError, catchAsync } = require("../middlewares/errorMiddleware");
const { formatResponse } = require("../utils/responseFormatter");
const { createNotification } = require("../controllers/notificationController");

/**
 * @desc Get all pending coach applications
 * @route GET /api/admin/coaches/pending
 * @access Private/Admin
 */
exports.getPendingCoaches = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const coaches = await Coach.find({ status: "pending" })
    .populate("user", "name email createdAt role")
    .select("specializations experience hourlyRate createdAt status bio")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  console.log('Fetched pending coaches with hourlyRate:', coaches.map(coach => ({
    id: coach._id,
    hourlyRate: coach.hourlyRate,
    specializations: coach.specializations
  })));

  const total = await Coach.countDocuments({ status: "pending" });

  res.json(formatResponse("success", "Pending coach applications retrieved", {
    coaches,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  }));
});

/**
 * @desc Approve a coach application
 * @route PUT /api/admin/coaches/:id/approve
 * @access Private/Admin
 */
exports.approveCoach = catchAsync(async (req, res) => {
  const { id } = req.params;

  const coach = await Coach.findById(id).populate("user");
  if (!coach) throw new AppError("Coach profile not found", 404);

  coach.status = "approved";
  coach.isApproved = true;
  coach.approvedAt = new Date();
  coach.approvedBy = req.user.id;

  await coach.save();

  // Create notification for coach
  await createNotification(coach.user, "approval", "Your coach application has been approved");

  // Update user role to "coach"
  const updatedUser = await User.findByIdAndUpdate(
    coach.user._id,
    { isApproved: true, role: "coach" },
    { new: true }
  ).select("-password");

  res.json(formatResponse("success", "Coach approved successfully", { coach, user: updatedUser }));
});

/**
 * @desc Reject a coach application
 * @route PUT /api/admin/coaches/:id/reject
 * @access Private/Admin
 */
exports.rejectCoach = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason) throw new AppError("Rejection reason is required", 400);

  const coach = await Coach.findById(id).populate("user");
  if (!coach) throw new AppError("Coach profile not found", 404);

  coach.status = "rejected";
  coach.isApproved = false;
  coach.rejectionReason = reason;
  coach.approvedAt = null;
  coach.approvedBy = null;

  await coach.save();

  // Create notification for coach
  await createNotification(coach.user, "approval", "Your coach application has been rejected");

  // Reset user role to "user"
  await User.findByIdAndUpdate(coach.user._id, { isApproved: false, role: "user" });

  res.json(formatResponse("success", "Coach application rejected", { coach }));
});

/**
 * @desc Get coach approval history
 * @route GET /api/admin/coaches/history
 * @access Private/Admin
 */
exports.getCoachApprovalHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = {};

  if (status) query.isApproved = status === "approved";

  const coaches = await Coach.find(query)
    .populate("user", "name email")
    .populate("approvedBy", "name")
    .populate("rejectedBy", "name")
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json(formatResponse("success", "Coach approval history retrieved", {
    coaches,
    pagination: { total: coaches.length, page: parseInt(page), pages: Math.ceil(coaches.length / limit) }
  }));
});
