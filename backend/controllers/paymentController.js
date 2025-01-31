const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const Booking = require("../models/Booking")

exports.createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.totalAmount * 100, // Stripe expects amount in cents
      currency: "usd",
      metadata: { bookingId: booking._id.toString() },
    })
    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.confirmPayment = async (req, res) => {
  try {
    const { bookingId } = req.body
    const booking = await Booking.findByIdAndUpdate(bookingId, { status: "paid" }, { new: true })
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }
    res.json(booking)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

