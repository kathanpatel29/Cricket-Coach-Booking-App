const request = require('supertest');
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { setupTestDB, createTestUser, createTestCoach } = require('../helpers/testUtils');
const User = require('../../models/User');
const Coach = require('../../models/Coach');
const Booking = require('../../models/Booking');
const paymentController = require('../../controllers/paymentController');

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: '123456789', role: 'client', email: 'client@example.com' };
  next();
});

// Setup payment routes
app.post('/api/payments/create-intent', paymentController.createPaymentIntent);
app.post('/api/payments/confirm', paymentController.confirmPayment);
app.get('/api/payments/coach-earnings', paymentController.getCoachEarnings);

describe('Payment Integration Tests', () => {
  setupTestDB();
  let testCoach, testBooking;

  beforeAll(async () => {
    const coachData = await createTestCoach(User, Coach);
    testCoach = coachData.coach;

    testBooking = await Booking.create({
      client: '123456789',
      coach: testCoach._id,
      date: new Date(),
      timeSlot: '10:00',
      duration: 1,
      totalAmount: 5000, // $50.00
      platformFee: 500,  // $5.00
      coachEarnings: 4500, // $45.00
      status: 'pending'
    });
  });

  describe('Payment Processing', () => {
    it('creates and confirms payment intent', async () => {
      // Create payment intent
      const createResponse = await request(app)
        .post('/api/payments/create-intent')
        .send({
          bookingId: testBooking._id,
          amount: 5000
        });

      expect(createResponse.status).toBe(200);
      expect(createResponse.body.data).toHaveProperty('clientSecret');

      // Mock successful payment confirmation
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 5000,
        currency: 'usd',
        payment_method: 'pm_card_visa',
        confirm: true,
        return_url: 'http://localhost:5173/payment-success'
      });

      // Confirm payment
      const confirmResponse = await request(app)
        .post('/api/payments/confirm')
        .send({
          bookingId: testBooking._id,
          paymentIntentId: paymentIntent.id
        });

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body.data.status).toBe('completed');

      // Verify booking status updated
      const updatedBooking = await Booking.findById(testBooking._id);
      expect(updatedBooking.status).toBe('confirmed');
    });

    it('handles failed payments', async () => {
      // Create payment intent with failing card
      const createResponse = await request(app)
        .post('/api/payments/create-intent')
        .send({
          bookingId: testBooking._id,
          amount: 5000
        });

      // Mock failed payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 5000,
        currency: 'usd',
        payment_method: 'pm_card_chargeDeclined',
        confirm: true,
        return_url: 'http://localhost:5173/payment-failed'
      });

      // Attempt to confirm failed payment
      const confirmResponse = await request(app)
        .post('/api/payments/confirm')
        .send({
          bookingId: testBooking._id,
          paymentIntentId: paymentIntent.id
        });

      expect(confirmResponse.status).toBe(400);
      expect(confirmResponse.body.message).toContain('payment failed');

      // Verify booking status remains pending
      const updatedBooking = await Booking.findById(testBooking._id);
      expect(updatedBooking.status).toBe('pending');
    });
  });

  describe('Coach Earnings', () => {
    it('calculates coach earnings correctly', async () => {
      // Create multiple completed bookings
      await Booking.create([
        {
          client: '123456789',
          coach: testCoach._id,
          date: new Date(),
          timeSlot: '11:00',
          duration: 1,
          totalAmount: 5000,
          platformFee: 500,
          coachEarnings: 4500,
          status: 'completed'
        },
        {
          client: '123456789',
          coach: testCoach._id,
          date: new Date(),
          timeSlot: '14:00',
          duration: 2,
          totalAmount: 10000,
          platformFee: 1000,
          coachEarnings: 9000,
          status: 'completed'
        }
      ]);

      // Get coach earnings
      const response = await request(app)
        .get('/api/payments/coach-earnings')
        .query({
          coachId: testCoach._id,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalEarnings');
      expect(response.body.data.totalEarnings).toBe(13500); // Sum of all earnings
      expect(response.body.data.completedBookings).toBe(2);
    });
  });

  describe('Refund Processing', () => {
    it('processes refunds for cancelled bookings', async () => {
      // Create a completed booking
      const booking = await Booking.create({
        client: '123456789',
        coach: testCoach._id,
        date: new Date(),
        timeSlot: '15:00',
        duration: 1,
        totalAmount: 5000,
        platformFee: 500,
        coachEarnings: 4500,
        status: 'completed',
        paymentIntentId: 'pi_test123'
      });

      // Mock refund process
      const refundResponse = await request(app)
        .post(`/api/payments/refund/${booking._id}`)
        .send({ reason: 'customer_requested' });

      expect(refundResponse.status).toBe(200);
      expect(refundResponse.body.data.status).toBe('refunded');

      // Verify booking status updated
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.status).toBe('refunded');
    });
  });
}); 