require("dotenv").config()
const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const connectDB = require("./config/db")
const authRoutes = require("./routes/auth")
const coachRoutes = require("./routes/coaches")
const bookingRoutes = require("./routes/bookings")
const reviewRoutes = require("./routes/reviews")
const paymentRoutes = require("./routes/payments")

const app = express()

// Connect to MongoDB
connectDB()

app.use(cors())
app.use(express.json())

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]
  if (!token) return res.status(401).json({ message: "Access denied" })

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET)
    req.user = verified
    next()
  } catch (err) {
    res.status(400).json({ message: "Invalid token" })
  }
}

app.use("/api/auth", authRoutes)
app.use("/api/coaches", verifyToken, coachRoutes)
app.use("/api/bookings", verifyToken, bookingRoutes)
app.use("/api/reviews", verifyToken, reviewRoutes)
app.use("/api/payments", verifyToken, paymentRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

