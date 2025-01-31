const Booking = require("../models/Booking")
const Coach = require("../models/Coach")

exports.createBooking = async (req, res) => {
  try {
    const { coachId, date, duration } = req.body
    const coach = await Coach.findById(coachId)
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" })
    }
    const totalAmount = coach.hourlyRate * duration
    const booking = await Booking.create({
      client: req.user.id,
      coach: coachId,
      date,
      duration,
      totalAmount,
    })
    res.status(201).json(booking)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getClientBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ client: req.user.id })
      .populate("coach", "user specialization")
      .populate("client", "name email")
    res.json(bookings)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getCoachBookings = async (req, res) => {
  try {
    const coach = await Coach.findOne({ user: req.user.id })
    if (!coach) {
      return res.status(404).json({ message: "Coach profile not found" })
    }
    const bookings = await Booking.find({ coach: coach._id })
      .populate("client", "name email")
      .populate("coach", "user specialization")
    res.json(bookings)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }
    res.json(booking)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

