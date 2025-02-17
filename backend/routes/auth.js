const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { validate, loginValidation, registerValidation } = require("../middleware/validationMiddleware");
const User = require("../models/User");

// Auth routes
router.post("/register", validate(registerValidation), authController.register);
router.post("/login", validate(loginValidation), authController.login);
router.post("/logout", protect, authController.logout);

// Profile route
router.get("/me", protect, authController.getMe);

router.post('/check-email', async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  res.json({ exists: !!user });
});

module.exports = router;
