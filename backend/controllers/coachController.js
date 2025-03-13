const Coach = require("../models/Coach");
const User = require("../models/User");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const TimeSlot = require("../models/TimeSlot");
const { AppError, catchAsync } = require("../middlewares/errorMiddleware");
const { formatResponse } = require("../utils/responseFormatter");
const { addHours, parseISO, isBefore } = require("date-fns");

/**
 * @desc Create coach profile
 * @route POST /api/coach
 * @access Private/User
 */
exports.createCoachProfile = catchAsync(async (req, res) => {
  const existingCoach = await Coach.findOne({ user: req.user.id });
  if (existingCoach) throw new AppError("Coach profile already exists", 400);

  const coach = await Coach.create({ user: req.user._id, ...req.body, status: "pending", isApproved: false });

  await User.findByIdAndUpdate(req.user.id, { role: "coach", isApproved: false });

  res.status(201).json(formatResponse("success", "Coach profile created successfully. Pending admin approval.", { coach }));
});

/**
 * @desc Get all approved coaches
 * @route GET /api/coaches
 * @access Public
 */
exports.getAllCoaches = catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search,
    specialization,
    minPrice,
    maxPrice,
    sort = 'averageRating',
    order = 'desc',
    availableOn
  } = req.query;

  // Build query for coaches - Update to use status field instead of isApproved
  const query = { status: "approved" };

  // Search by name
  if (search) {
    // We'll need to join with the User model to search by name
    const users = await User.find({
      name: { $regex: search, $options: 'i' }
    }).select('_id');

    query.user = { $in: users.map(user => user._id) };
  }

  // Filter by specialization
  if (specialization) {
    query.specializations = { 
      $regex: specialization, 
      $options: 'i' 
    };
  }

  // Filter by price range
  if (minPrice) query.hourlyRate = { ...query.hourlyRate, $gte: parseInt(minPrice) };
  if (maxPrice) query.hourlyRate = { ...query.hourlyRate, $lte: parseInt(maxPrice) };

  // Find coaches matching query
  let coachQuery = Coach.find(query)
    .populate("user", "name email profileImage")
    .select("specializations experience hourlyRate bio averageRating totalReviews");

  // Handle availability date filtering
  if (availableOn) {
    // Find coaches who have available time slots on the specified date
    const startDate = new Date(availableOn);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(availableOn);
    endDate.setHours(23, 59, 59, 999);

    // Find available time slots for the date
    const availableTimeSlots = await TimeSlot.find({
      date: { $gte: startDate, $lte: endDate },
      status: "available"
    }).distinct('coach');

    // Add coach IDs with available slots to query
    query._id = { $in: availableTimeSlots };
    
    // Re-create the query with the availability filter
    coachQuery = Coach.find(query)
      .populate("user", "name email profileImage")
      .select("specializations experience hourlyRate bio averageRating totalReviews");
  }

  // Apply sorting
  const sortOrder = order === 'asc' ? 1 : -1;
  coachQuery.sort({ [sort]: sortOrder });

  // Apply pagination
  const total = await Coach.countDocuments(query);
  const coaches = await coachQuery
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json(formatResponse("success", "Coaches retrieved successfully", {
    coaches,
    pagination: { 
      totalPages: Math.ceil(total / limit), 
      currentPage: parseInt(page),
      totalCoaches: total
    }
  }));
});

/**
 * @desc Get coach profile by ID
 * @route GET /api/coach/:id
 * @access Public
 */
exports.getCoachById = catchAsync(async (req, res) => {
  const coach = await Coach.findById(req.params.id)
    .populate("user", "name email profileImage")
    .select("specializations experience hourlyRate bio reviews averageRating");

  if (!coach) throw new AppError("Coach not found", 404);

  res.json(formatResponse("success", "Coach profile retrieved successfully", { coach }));
});

/**
 * @desc Get current coach profile
 * @route GET /api/coach/profile
 * @access Private/Coach
 */
exports.getCoachProfile = catchAsync(async (req, res) => {
  // Populate all user fields that might be needed in the frontend
  const coach = await Coach.findOne({ user: req.user.id }).populate("user", "name email phone");

  if (!coach) throw new AppError("Coach profile not found", 404);
  
  // Log coach data to debug what's being sent to frontend
  console.log("Found coach profile:", {
    id: coach._id,
    userId: coach.user._id,
    experience: coach.experience,
    hourlyRate: coach.hourlyRate,
    bio: coach.bio,
    specializations: coach.specializations,
    status: coach.status
  });

  res.json(formatResponse("success", "Coach profile retrieved", { coach }));
});

/**
 * @desc Update coach profile
 * @route PUT /api/coach/profile
 * @access Private/Coach
 */
exports.updateCoachProfile = catchAsync(async (req, res) => {
  const coach = await Coach.findOne({ user: req.user.id });
  if (!coach) throw new AppError("Coach profile not found", 404);

  console.log("Updating coach profile with data:", req.body);
  
  // Make sure specializations is handled correctly
  if (req.body.specializations) {
    if (!Array.isArray(req.body.specializations)) {
      // Convert to array if it's not already
      req.body.specializations = [req.body.specializations];
    }
    console.log("Processing specializations:", req.body.specializations);
  }
  
  // Handle numeric fields
  if (req.body.experience) {
    req.body.experience = Number(req.body.experience);
  }
  
  if (req.body.hourlyRate) {
    req.body.hourlyRate = Number(req.body.hourlyRate);
  }

  // Update coach data
  Object.assign(coach, req.body);
  
  // Log the coach object before saving
  console.log("Coach object after update:", {
    id: coach._id,
    experience: coach.experience,
    hourlyRate: coach.hourlyRate,
    bio: coach.bio,
    specializations: coach.specializations,
  });
  
  await coach.save();
  
  // Return the updated coach data
  const updatedCoach = await Coach.findById(coach._id).populate("user", "name email phone");
  
  res.json(formatResponse("success", "Coach profile updated successfully", { coach: updatedCoach }));
});

/**
 * @desc Get coach dashboard statistics
 * @route GET /api/coach/dashboard
 * @access Private/Coach
 */
exports.getCoachDashboardStats = catchAsync(async (req, res) => {
  const coach = await Coach.findOne({ user: req.user.id });
  if (!coach) throw new AppError("Coach profile not found", 404);

  const totalSessions = await Booking.countDocuments({ coach: coach._id });
  const upcomingSessions = await Booking.countDocuments({
    coach: coach._id,
    date: { $gte: new Date() },
    status: "confirmed"
  });

  res.json(formatResponse("success", "Dashboard stats retrieved", { totalSessions, upcomingSessions }));
});

/**
 * @desc Get coach availability
 * @route GET /api/coach/availability
 * @access Private/Coach
 */
exports.getCoachAvailability = catchAsync(async (req, res) => {
  const coach = await Coach.findOne({ user: req.user.id });
  if (!coach) throw new AppError("Coach profile not found", 404);

  // Fetch only future available time slots
  const availability = await TimeSlot.find({
    coach: coach._id,
    status: "available",
    date: { $gte: new Date() }
  }).sort("date startTime");

  res.json(formatResponse("success", "Availability retrieved successfully", { availability }));
});

/**
 * @desc Update coach availability
 * @route PUT /api/coach/availability
 * @access Private/Coach
 */
exports.updateCoachAvailability = catchAsync(async (req, res) => {
  const { availability } = req.body;
  const coach = await Coach.findOne({ user: req.user.id });

  if (!coach) throw new AppError("Coach profile not found", 404);

  // Delete only future available slots (not affecting booked ones)
  await TimeSlot.deleteMany({
    coach: coach._id,
    status: "available",
    date: { $gte: new Date() }
  });

  // Insert new availability
  const timeSlots = await TimeSlot.create(
    availability.map(slot => ({
      coach: coach._id,
      date: new Date(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration || 60,
      status: "available"
    }))
  );

  res.json(formatResponse("success", "Availability updated successfully", { timeSlots }));
});

/**
 * @desc Get coach bookings
 * @route GET /api/coach/bookings
 * @access Private/Coach
 */
exports.getCoachBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ coach: req.user.id })
    .populate("user", "name email")
    .sort("-createdAt");

  res.json(formatResponse("success", "Coach bookings retrieved", { bookings }));
});

/**
 * @desc Get coach ratings & reviews
 * @route GET /api/coach/reviews
 * @access Public
 */
exports.getCoachReviews = catchAsync(async (req, res) => {
  const { coachId } = req.params;

  const reviews = await Review.find({ coach: coachId })
    .populate("user", "name")
    .sort("-createdAt");

  res.json(formatResponse("success", "Coach reviews retrieved", { reviews }));
});

/**
 * @desc Create time slot
 * @route POST /api/coach/time-slots
 * @access Private/Coach
 */
exports.createTimeSlot = catchAsync(async (req, res) => {
  try {
    console.log('==== DEBUG: createTimeSlot function called ====');
    console.log('Create time slot request body:', req.body);
    
    // Handle both single slot and array of slots
    const slots = req.body.slots || [req.body];
    console.log(`Processing ${slots.length} time slots`);
    
    // Find coach
    const user = req.user;
    console.log('User making request:', { 
      userId: user.id, 
      userName: user.name, 
      userRole: user.role, 
      userIsApproved: user.isApproved 
    });
    
    const coach = await Coach.findOne({ user: req.user.id });
    if (!coach) {
      console.log('Coach profile not found for user:', req.user.id);
      return res.status(404).json(formatResponse("error", "Coach profile not found", null));
    }
    
    console.log('Coach found:', { 
      coachId: coach._id, 
      coachStatus: coach.status, 
      coachIsApproved: coach.isApproved 
    });
    
    // Check if coach is approved
    if (!coach.isApproved && coach.status !== "approved") {
      console.log('Coach is not approved. Status:', coach.status, 'isApproved:', coach.isApproved);
      return res.status(403).json(formatResponse("error", "Your profile has not been approved yet", null));
    }
    console.log('Coach approval check passed');
    
    const createdSlots = [];
    const errors = [];
    
    // Process each slot
    for (const slot of slots) {
      const { date, startTime, endTime, duration, capacity } = slot;
      console.log('Processing slot:', { date, startTime, endTime, duration, capacity });
      
      try {
        // Check if date is parseable
        const slotDate = new Date(date);
        if (isNaN(slotDate.getTime())) {
          console.log('Invalid date format:', date);
          errors.push(`Invalid date format for slot: ${date}`);
          continue;
        }
        
        // Validate capacity if provided
        const slotCapacity = capacity ? parseInt(capacity) : 1;
        if (slotCapacity < 1) {
          console.log('Invalid capacity value:', capacity);
          errors.push(`Invalid capacity value: ${capacity}. Must be at least 1.`);
          continue;
        }
        
        // Create time slot
        console.log('Creating time slot with data:', {
          coach: coach._id,
          date: slotDate,
          startTime,
          endTime,
          duration: duration || 60,
          capacity: slotCapacity
        });
        
        const timeSlot = await TimeSlot.create({
          coach: coach._id,
          date: slotDate,
          startTime,
          endTime,
          duration: duration || 60,
          status: "available",
          capacity: slotCapacity
        });
        
        console.log('Successfully created time slot:', {
          id: timeSlot._id,
          coachId: timeSlot.coach,
          date: timeSlot.date,
          startTime: timeSlot.startTime,
          capacity: timeSlot.capacity
        });
        
        createdSlots.push(timeSlot);
      } catch (slotError) {
        console.error('Error creating individual time slot:', slotError);
        errors.push(`Error creating slot ${date} ${startTime}-${endTime}: ${slotError.message}`);
      }
    }
    
    if (createdSlots.length === 0) {
      console.log('Failed to create any time slots. Errors:', errors);
      return res.status(400).json(formatResponse("error", "Failed to create any time slots", { errors }));
    }
    
    console.log(`Successfully created ${createdSlots.length} time slots`);
    
    return res.status(201).json(formatResponse("success", `Created ${createdSlots.length} time slots successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}`, { 
      timeSlots: createdSlots,
      errors: errors.length > 0 ? errors : undefined
    }));
  } catch (error) {
    console.error('Error in createTimeSlot:', error);
    return res.status(500).json(formatResponse("error", "Failed to create time slots", null));
  }
});

/**
 * @desc Get coach time slots
 * @route GET /api/coach/time-slots
 * @access Private/Coach
 */
exports.getTimeSlots = catchAsync(async (req, res) => {
  try {
    console.log('==== DEBUG: getTimeSlots function called ====');
    
    const user = req.user;
    console.log('User making request:', { 
      userId: user.id, 
      userName: user.name, 
      userRole: user.role, 
      userIsApproved: user.isApproved 
    });
    
    const coach = await Coach.findOne({ user: req.user.id });
    if (!coach) {
      console.log('Coach profile not found for user:', req.user.id);
      return res.status(404).json(formatResponse("error", "Coach profile not found", null));
    }
    
    console.log('Coach found:', { 
      coachId: coach._id, 
      coachStatus: coach.status, 
      coachIsApproved: coach.isApproved 
    });
    
    // Get all time slots for the coach
    console.log('Searching for time slots with coach ID:', coach._id);
    const timeSlots = await TimeSlot.find({ coach: coach._id })
      .sort({ date: 1, startTime: 1 });
    
    console.log(`Query returned ${timeSlots ? timeSlots.length : 0} time slots`);
    
    // If no time slots exist, return an empty array
    if (!timeSlots || timeSlots.length === 0) {
      console.log('No time slots found for coach:', coach._id);
      
      // Additional check - look for any time slots in the system
      const totalSlotsInSystem = await TimeSlot.countDocuments({});
      console.log(`Total time slots in the entire system: ${totalSlotsInSystem}`);
      
      // Check if there are any slots with a similar coach ID (in case of ObjectId vs String issues)
      const allTimeSlots = await TimeSlot.find({});
      console.log('All time slots in system:', allTimeSlots.map(slot => ({ 
        id: slot._id,
        coachId: slot.coach,
        date: slot.date,
        start: slot.startTime
      })));
      
      return res.json(formatResponse("success", "No time slots found", { data: [] }));
    }

    console.log(`Found ${timeSlots.length} time slots for coach:`, coach._id);
    console.log('First few time slots:', timeSlots.slice(0, 3).map(slot => ({
      id: slot._id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status
    })));
    
    return res.json(formatResponse("success", "Time slots retrieved successfully", { data: timeSlots }));
  } catch (error) {
    console.error('Error in getTimeSlots:', error);
    return res.status(500).json(formatResponse("error", "Failed to retrieve time slots", null));
  }
});

/**
 * @desc Delete time slot
 * @route DELETE /api/coach/time-slots/:id
 * @access Private/Coach
 */
exports.deleteTimeSlot = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const coach = await Coach.findOne({ user: req.user.id });
  if (!coach) throw new AppError("Coach profile not found", 404);
  
  // Find time slot
  const timeSlot = await TimeSlot.findById(id);
  if (!timeSlot) throw new AppError("Time slot not found", 404);
  
  // Check if coach owns the time slot
  if (timeSlot.coach.toString() !== coach._id.toString()) {
    throw new AppError("Not authorized to delete this time slot", 403);
  }
  
  // Check if time slot is booked
  if (timeSlot.status === "booked") {
    throw new AppError("Cannot delete a booked time slot", 400);
  }
  
  // Check if time slot is within 24 hours
  const slotDate = parseISO(`${timeSlot.date.toISOString().split('T')[0]}T${timeSlot.startTime}`);
  if (isBefore(slotDate, addHours(new Date(), 24))) {
    throw new AppError("Cannot delete a time slot within 24 hours of start time", 400);
  }
  
  // Delete time slot
  await timeSlot.deleteOne();
  
  res.json(formatResponse("success", "Time slot deleted successfully", {}));
});

/**
 * @desc Update time slot status
 * @route PATCH /api/coach/time-slots/:id
 * @access Private/Coach
 */
exports.updateTimeSlot = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, capacity } = req.body;
  
  const coach = await Coach.findOne({ user: req.user.id });
  if (!coach) throw new AppError("Coach profile not found", 404);
  
  // Find time slot
  const timeSlot = await TimeSlot.findById(id);
  if (!timeSlot) throw new AppError("Time slot not found", 404);
  
  // Check if coach owns the time slot
  if (timeSlot.coach.toString() !== coach._id.toString()) {
    throw new AppError("Not authorized to update this time slot", 403);
  }
  
  // Check if time slot is booked and being marked as available
  if (timeSlot.status === "booked" && status === "available") {
    throw new AppError("Cannot mark a booked time slot as available", 400);
  }
  
  // Validate capacity if provided
  if (capacity !== undefined) {
    // Make sure capacity is a number and at least 1
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new AppError("Capacity must be a positive integer", 400);
    }
    
    // Check if the new capacity is less than current bookedCount
    if (capacity < timeSlot.bookedCount) {
      throw new AppError("Cannot set capacity lower than current number of bookings", 400);
    }
    
    // Update capacity
    timeSlot.capacity = capacity;
  }
  
  // Update time slot status if provided
  if (status) {
    timeSlot.status = status;
  }
  
  await timeSlot.save();
  
  res.json(formatResponse("success", "Time slot updated successfully", { timeSlot }));
});

/**
 * @desc Sync coach approval status with user approval status
 * @route POST /api/coach/sync-approval
 * @access Private/Coach
 */
exports.syncApprovalStatus = catchAsync(async (req, res) => {
  try {
    // Get user details
    const user = req.user;
    console.log(`Syncing approval status for user: ${user.name} (${user.id})`);
    console.log(`Current user approval status: ${user.isApproved ? 'Approved' : 'Not approved'}`);

    // Find associated coach profile
    const coach = await Coach.findOne({ user: user.id });
    if (!coach) {
      return res.status(404).json(formatResponse("error", "Coach profile not found", null));
    }

    console.log(`Current coach profile approval status: ${coach.isApproved ? 'Approved' : 'Not approved'}`);
    
    // Get the correct values from user
    const correctApprovalStatus = !!user.isApproved;
    const correctStatus = correctApprovalStatus ? "approved" : "pending";
    
    // Update coach profile to match user approval status
    const updatedCoach = await Coach.findByIdAndUpdate(
      coach._id,
      { 
        isApproved: correctApprovalStatus,
        status: correctStatus
      },
      { new: true }
    );

    console.log(`Updated coach profile: isApproved=${updatedCoach.isApproved}, status=${updatedCoach.status}`);
    
    return res.json(formatResponse("success", "Coach approval status synchronized successfully", { 
      coachId: coach._id,
      previousStatus: { isApproved: coach.isApproved, status: coach.status },
      currentStatus: { isApproved: updatedCoach.isApproved, status: updatedCoach.status }
    }));
  } catch (error) {
    console.error('Error syncing coach approval status:', error);
    return res.status(500).json(formatResponse("error", "Failed to sync coach approval status", null));
  }
});

/**
 * @desc Get all available dates with time slots
 * @route GET /api/public/available-dates/:coachId
 * @access Public
 */
exports.getAvailableDates = catchAsync(async (req, res) => {
  try {
    const { coachId } = req.params;

    // Validate the coach exists and is approved
    const coach = await Coach.findById(coachId);
    if (!coach) {
      return res.status(404).json(formatResponse("error", "Coach not found", null));
    }
    
    if (coach.status !== "approved") {
      return res.status(403).json(formatResponse("error", "Coach is not currently available", null));
    }

    // Find all available time slots for this coach
    const availableTimeSlots = await TimeSlot.find({
      coach: coachId,
      status: "available",
      date: { $gte: new Date() } // Only future dates
    }).select('date').sort({ date: 1 });

    // Extract unique dates
    const uniqueDates = [...new Set(
      availableTimeSlots.map(slot => {
        const date = new Date(slot.date);
        return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      })
    )];

    return res.json(formatResponse("success", "Available dates retrieved successfully", { 
      dates: uniqueDates,
      coach: coach._id
    }));
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return res.status(500).json(formatResponse("error", "Failed to retrieve available dates", null));
  }
});

/**
 * @desc Get time slots for a specific date
 * @route GET /api/public/time-slots/:coachId/:date
 * @access Public
 */
exports.getTimeSlotsByDate = catchAsync(async (req, res) => {
  try {
    const { coachId, date } = req.params;

    // Validate the coach exists and is approved
    const coach = await Coach.findById(coachId);
    if (!coach) {
      return res.status(404).json(formatResponse("error", "Coach not found", null));
    }
    
    if (coach.status !== "approved") {
      return res.status(403).json(formatResponse("error", "Coach is not currently available", null));
    }

    // Create start and end of the selected date
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json(formatResponse("error", "Invalid date format. Use YYYY-MM-DD", null));
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Find available time slots for this coach on the specified date
    const timeSlots = await TimeSlot.find({
      coach: coachId,
      status: "available",
      date: { $gte: startDate, $lte: endDate }
    }).sort({ startTime: 1 });

    // Format time slots for frontend display
    const formattedTimeSlots = timeSlots.map(slot => ({
      id: slot._id,
      date: new Date(slot.date).toISOString().split('T')[0],
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration,
      status: slot.status,
      formattedStartTime: slot.startTime,
      formattedEndTime: slot.endTime
    }));

    return res.json(formatResponse("success", "Time slots retrieved successfully", { 
      timeSlots: formattedTimeSlots,
      date: date
    }));
  } catch (error) {
    console.error('Error fetching time slots by date:', error);
    return res.status(500).json(formatResponse("error", "Failed to retrieve time slots", null));
  }
});
