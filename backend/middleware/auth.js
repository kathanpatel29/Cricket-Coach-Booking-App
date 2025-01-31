import { verifyToken } from "../utils/jwtUtils.js"
import User from "../models/User.js"

export default async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      throw new Error("No token provided")
    }

    const decoded = verifyToken(token)
    const user = await User.findOne({ _id: decoded.id })

    if (!user) {
      throw new Error("User not found")
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: "Please authenticate" })
  }
}

