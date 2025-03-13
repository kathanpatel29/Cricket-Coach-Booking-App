const TimeSlot = require("../models/TimeSlot");
const Coach = require("../models/Coach");
const { AppError, catchAsync } = require("../middlewares/errorMiddleware");
const { startOfWeek, endOfWeek, format } = require("date-fns");
const { formatResponse } = require("../utils/responseFormatter");

/**
 * @desc Get coach availability for a date range
 * @route GET /api/availability
 * @access Public
 */
exports.getAvailability = catchAsync(async (req, res) => {
  const { coachId, startDate, endDate } = req.query;

  const coach = await Coach.findById(coachId).populate("user", "isApproved");
  if (!coach || !coach.user.isApproved) throw new AppError("Coach not found or not approved", 404);

  const start = startDate ? new Date(startDate) : startOfWeek(new Date());
  const end = endDate ? new Date(endDate) : endOfWeek(start);

  const availableSlots = await TimeSlot.find({
    coach: coachId,
    date: { $gte: start, $lte: end },
    status: "available"
  }).sort({ date: 1, startTime: 1 });

  res.json(formatResponse("success", "Coach availability retrieved", { availableSlots }));
});

/**
 * @desc Block time slots for a specific date
 * @route PUT /api/availability/block
 * @access Private/Coach
 */
exports.blockTimeSlots = catchAsync(async (req, res) => {
  const { date, reason } = req.body;
  const coach = await Coach.findOne({ user: req.user._id });

  if (!coach) throw new AppError("Coach profile not found", 404);

  const slots = await TimeSlot.find({ coach: coach._id, date: new Date(date), status: "available" });

  await TimeSlot.updateMany(
    { _id: { $in: slots.map(slot => slot._id) } },
    { status: "cancelled", cancellationReason: reason || "Blocked by coach" }
  );

  res.json(formatResponse("success", `Blocked ${slots.length} time slots for ${date}`));
});
