const Coach = require("../models/Coach")
const User = require("../models/User")

exports.createCoachProfile = async (req, res) => {
  try {
    const { specialization, experience, hourlyRate, bio } = req.body
    const coach = await Coach.create({
      user: req.user.id,
      specialization,
      experience,
      hourlyRate,
      bio,
    })
    await User.findByIdAndUpdate(req.user.id, { role: "coach" })
    res.status(201).json(coach)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getAllCoaches = async (req, res) => {
  try {
    const coaches = await Coach.find().populate("user", "name email isApproved")
    res.json(coaches)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getCoachById = async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id).populate("user", "name email isApproved")
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" })
    }
    res.json(coach)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.updateCoachProfile = async (req, res) => {
  try {
    const { specialization, experience, hourlyRate, bio } = req.body
    const coach = await Coach.findOneAndUpdate(
      { user: req.user.id },
      { specialization, experience, hourlyRate, bio },
      { new: true },
    )
    res.json(coach)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.approveCoach = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true })
    if (!user) {
      return res.status(404).json({ message: "Coach not found" })
    }
    res.json({ message: "Coach approved successfully", user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.rejectCoach = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: "client" }, { new: true })
    if (!user) {
      return res.status(404).json({ message: "Coach not found" })
    }
    res.json({ message: "Coach rejected successfully", user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

