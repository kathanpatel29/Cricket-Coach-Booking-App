const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, isApproved: user.isApproved },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

const verifyPassword = async (enteredPassword, storedPassword) => {
  return await bcrypt.compare(enteredPassword, storedPassword);
};

module.exports = { generateToken, verifyPassword };
