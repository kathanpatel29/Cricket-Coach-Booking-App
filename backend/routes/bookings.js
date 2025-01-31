const express = require("express")
const router = express.Router()
const bookingController = require("../controllers/bookingController")
const { protect, restrictTo } = require("../middleware/auth")

router.post("/", protect, restrictTo("client"), bookingController.createBooking)
router.get("/client", protect, restrictTo("client"), bookingController.getClientBookings)
router.get("/coach", protect, restrictTo("coach"), bookingController.getCoachBookings)
router.put("/:id", protect, restrictTo("coach"), bookingController.updateBookingStatus)

module.exports = router

