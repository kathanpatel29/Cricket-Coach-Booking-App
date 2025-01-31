import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.js"
import bookingRoutes from "./routes/bookings.js"
import coachRoutes from "./routes/coaches.js"
import adminRoutes from "./routes/admin.js"
import errorHandler from "./middleware/errorHandler.js"

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  console.log("Request body:", req.body)
  next()
})

// Check if JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set in the environment variables")
  process.exit(1)
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Routes
app.use("/auth", authRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/coaches", coachRoutes)
app.use("/api", adminRoutes)

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" })
})

// Error handler
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

