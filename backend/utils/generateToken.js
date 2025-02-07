const jwt = require("jsonwebtoken");

/**
 * Generate JWT Token
 * @param {string} userId - The user's ID
 * @returns {string} - Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

module.exports = generateToken;

