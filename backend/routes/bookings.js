import express from "express"
import { createBooking, getBookings, getBookingById, updateBooking } from "../controllers/bookingController.js"
import auth from "../middleware/auth.js"

const router = express.Router()

router.post("/", auth, createBooking)
router.get("/", auth, getBookings)
router.get("/:id", auth, getBookingById)
router.patch("/:id", auth, updateBooking)

export default router

