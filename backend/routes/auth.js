const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validate, loginValidation, registerValidation } = require("../middleware/validationMiddleware");
const User = require("../models/User");

// Auth routes
router.post("/register", validate(registerValidation), authController.register);
router.post("/login", validate(loginValidation), authController.login);
router.post("/logout", protect, authController.logout);

// Profile routes - 
router.get("/me", protect, authController.getMe);
router.put("/profile", protect, authController.updateProfile);
router.put("/update-phone", protect, authController.updatePhone);
router.put("/change-password", protect, authController.changePassword);

// Coach specific routes
router.post("/coach/register", validate(registerValidation), authController.register);
router.get("/coach/status", protect, authorize('coach'), authController.getCoachStatus);

// Email check route
router.post('/check-email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
