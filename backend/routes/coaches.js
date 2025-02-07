const express = require("express")
const router = express.Router()
const coachController = require("../controllers/coachController")
const { protect, restrictTo } = require("../middleware/auth")

// Admin routes - Move pendingCoaches BEFORE the :id routes
router.get("/pendingCoaches", protect, restrictTo("admin"), coachController.pendingCoaches)

// Public routes
router.get("/", coachController.getAllCoaches)
router.get("/:id", coachController.getCoachById)

// Coach routes (requires authentication)
router.post("/", protect, restrictTo("client"), coachController.createCoachProfile)
router.get("/profile/me", protect, restrictTo("coach"), coachController.getCoachProfile)
router.put("/profile", protect, restrictTo("coach"), coachController.updateCoachProfile)
router.put("/availability", protect, restrictTo("coach"), coachController.updateAvailability)

// Admin routes
router.patch("/:id/approve", protect, restrictTo("admin"), coachController.approveCoach)
router.patch("/:id/reject", protect, restrictTo("admin"), coachController.rejectCoach)

module.exports = router