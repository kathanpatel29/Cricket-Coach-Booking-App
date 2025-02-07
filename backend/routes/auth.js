const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect, restrictTo } = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", protect, authController.getMe); // Protected route for logged-in users
router.get("/admin/stats", protect, restrictTo("admin"), authController.getAdminStats);
router.get("/admin/users", protect, restrictTo("admin"), authController.getAllUsers);
router.delete("/admin/users/:id", protect, restrictTo("admin"), authController.deleteUser);

module.exports = router;
