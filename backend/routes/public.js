const express = require("express");
const { register, login } = require("../controllers/authController");
const { getAllCoaches, getCoachById, getAvailableDates, getTimeSlotsByDate } = require("../controllers/coachController");
const { getCoachAvailabilityByDate } = require("../controllers/bookingController");
const { validateMiddleware } = require("../middlewares/validateMiddleware");
const { getCoachReviews } = require("../controllers/reviewController");

const router = express.Router();

// Auth routes (public)
router.post("/auth/register", register);
router.post("/auth/login", login);

// Public coach routes
router.get("/coaches", getAllCoaches);
router.get("/coaches/:id", getCoachById);
router.get("/coaches/:id/availability", getCoachAvailabilityByDate);

// Direct time slot access routes
router.get("/available-dates/:coachId", getAvailableDates);
router.get("/time-slots/:coachId/:date", getTimeSlotsByDate);

// Public reviews routes
router.get("/reviews", (req, res) => {
  // This will be implemented to get public reviews
  res.status(200).json({ message: "Public reviews endpoint" });
});

// Get reviews for a specific coach
router.get("/coaches/:coachId/reviews", getCoachReviews);

module.exports = router; 