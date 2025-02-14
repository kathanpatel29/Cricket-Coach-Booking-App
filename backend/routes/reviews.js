const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public routes
router.get("/", reviewController.getAllReviews);
router.get("/coach/:coachId", reviewController.getCoachReviews);
router.get("/:id", reviewController.getReviewById);

// Protected routes
router.use(protect);

// Client routes
router.post("/", authorize("client"), reviewController.createReview);
router.put("/:id", authorize("client"), reviewController.updateReview);
router.delete("/:id", authorize("client"), reviewController.deleteReview);

// Admin routes
router.patch("/:id/moderate", authorize("admin"), reviewController.moderateReview);

module.exports = router;