const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "coach", "admin"], default: "user" },
  phone: { type: String, match: /^\+?[\d\s-]{10,}$/ },
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  preferences: {
    timezone: { type: String, default: "UTC" },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  favoriteCoaches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Coach" }],
  isApproved: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role, isApproved: this.isApproved },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

const User = mongoose.model("User", userSchema);
module.exports = User;
