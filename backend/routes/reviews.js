const express = require("express")
const router = express.Router()
const reviewController = require("../controllers/reviewController")
const { protect, restrictTo } = require("../middleware/auth")

router.post("/", protect, restrictTo("client"), reviewController.createReview)
router.get("/:coachId", reviewController.getCoachReviews)

module.exports = router

