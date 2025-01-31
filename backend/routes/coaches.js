import express from "express"
import { getCoaches, getCoachById } from "../controllers/coachController.js"

const router = express.Router()

router.get("/", getCoaches)
router.get("/:id", getCoachById)

export default router

