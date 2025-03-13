const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/User");
const Coach = require("../models/Coach");
const { AppError, catchAsync } = require("../middlewares/errorMiddleware");
const { formatResponse } = require("../utils/responseFormatter");
const bcrypt = require("bcryptjs");

/**
 * @desc    Generate JWT Token
 * @param   {String} id - User ID
 * @returns {String} Signed JWT token
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "24h" });
};

/**
 * @desc    Register a new user, coach, or admin
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = catchAsync(async (req, res) => {
  const { name, email, password, role, adminSecretKey, specializations, experience, hourlyRate, bio } = req.body;

  // Check if email is already registered
  if (await User.findOne({ email })) {
    throw new AppError("Email already registered", 400);
  }

  // If registering as an admin, require the secret key
  if (role === "admin") {
    if (!adminSecretKey || adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
      throw new AppError("Invalid admin secret key", 403);
    }
  }

  // Create user
  const user = await User.create({ name, email, password, role: role || "user" });

  // If registering as a coach, create a coach profile
  if (role === "coach") {
    await Coach.create({
      user: user._id,
      specializations: specializations || [],
      experience: experience || 0,
      hourlyRate: hourlyRate || 0,
      bio: bio || "",
      status: "pending",
      isApproved: false
    });
  }

  // Remove password from response
  user.password = undefined;

  res.status(201).json({
    status: "success",
    message: role === "coach"
      ? "Registration successful. Your coach profile is pending approval."
      : "Registration successful. Please login to continue.",
    data: { user }
  });
});

/**
 * @desc    Login User or Admin
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = catchAsync(async (req, res) => {
  const { email, password, adminSecretKey } = req.body;

  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  // Find user and validate password
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Invalid email or password", 401);
  }

  // If logging in as admin, check the secret key
  if (user.role === "admin") {
    if (!adminSecretKey || adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
      throw new AppError("Invalid admin secret key", 403);
    }
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate JWT token
  const token = signToken(user._id);
  user.password = undefined; // Remove password before sending response

  res.json({
    status: "success",
    message: "Login successful",
    data: { token, user }
  });
});

/**
 * @desc    Get User Profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
exports.getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) throw new AppError("User not found", 404);

  res.json(formatResponse("success", "User profile retrieved", { user }));
});

/**
 * @desc    Update User Profile (Name, Email)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = catchAsync(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  // Check for email duplication
  if (email && email !== user.email && (await User.findOne({ email }))) {
    throw new AppError("Email already in use", 400);
  }

  user.name = name || user.name;
  user.email = email || user.email;
  await user.save();

  res.json(formatResponse("success", "Profile updated", { user }));
});

/**
 * @desc    Update Phone Number
 * @route   PUT /api/auth/profile/phone
 * @access  Private
 */
exports.updatePhone = catchAsync(async (req, res) => {
  const { phone } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  user.phone = phone;
  await user.save();

  res.json(formatResponse("success", "Phone updated successfully"));
});

/**
 * @desc    Change User Password
 * @route   PUT /api/auth/profile/password
 * @access  Private
 */
exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError("Both passwords are required", 400);

  const user = await User.findById(req.user._id).select("+password");
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new AppError("Incorrect current password", 401);
  }

  user.password = newPassword;
  await user.save();
  res.json(formatResponse("success", "Password updated successfully"));
});

/**
 * @desc    Middleware to Protect Routes (Require Authentication)
 */
exports.protect = catchAsync(async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new AppError("Please log in to access this route", 401);

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError("User no longer exists", 401);

  req.user = user;
  next();
});

/**
 * @desc    Middleware to Restrict Access to Specific Roles
 * @param   {...String} roles - Allowed roles
 */
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw new AppError("Not authorized", 403);
  next();
};
