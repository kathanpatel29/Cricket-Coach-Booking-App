const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const { protect, restrictTo } = require("../middleware/auth")

router.post("/register", authController.register)
router.post("/login", authController.login)
router.get("/me", protect, authController.getMe)

// New admin routes
router.get("/admin/stats", protect, restrictTo("admin"), authController.getAdminStats)
router.get("/admin/pending-coaches", protect, restrictTo("admin"), authController.getPendingCoaches)
router.get("/admin/recent-reviews", protect, restrictTo("admin"), authController.getRecentReviews)

module.exports = router

