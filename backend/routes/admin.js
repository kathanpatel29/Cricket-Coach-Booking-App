import express from "express"
import { getUsers, getBookings } from "../controllers/adminController.js"
import auth from "../middleware/auth.js"
import admin from "../middleware/admin.js"

const router = express.Router()

router.get("/admin/users", auth, admin, getUsers)
router.get("/admin/bookings", auth, admin, getBookings)

export default router

