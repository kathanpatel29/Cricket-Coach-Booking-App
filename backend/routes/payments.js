const express = require("express")
const router = express.Router()
const paymentController = require("../controllers/paymentController")
const { protect, restrictTo } = require("../middleware/auth")

router.post("/create-payment-intent", protect, restrictTo("client"), paymentController.createPaymentIntent)
router.post("/confirm-payment", protect, restrictTo("client"), paymentController.confirmPayment)

module.exports = router

