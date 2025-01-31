const express = require("express")
const router = express.Router()
const coachController = require("../controllers/coachController")
const { protect, restrictTo } = require("../middleware/auth")

router.get("/", coachController.getAllCoaches)
router.get("/:id", coachController.getCoachById)
router.post("/", protect, restrictTo("client"), coachController.createCoachProfile)
router.put("/", protect, restrictTo("coach"), coachController.updateCoachProfile)
router.patch("/:id/approve", protect, restrictTo("admin"), coachController.approveCoach)
router.patch("/:id/reject", protect, restrictTo("admin"), coachController.rejectCoach)

module.exports = router

