const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const { setupTestDB, createTestUser, createTestCoach } = require('../helpers/testUtils');
const Booking = require('../../models/Booking');
const User = require('../../models/User');
const Coach = require('../../models/Coach');
const bookingController = require('../../controllers/bookingController');

const app = express();
app.use(express.json());

// Mock auth middleware - simplified for quick testing
jest.mock('../../middleware/authMiddleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: '123456789', role: 'client', email: 'test@example.com' };
    next();
  },
  authorize: (role) => (req, res, next) => {
    req.user = { id: '123456789', role, email: 'test@example.com' };
    next();
  }
}));

// Setup routes
app.use((req, res, next) => { req.user = { id: '123456789', role: 'client' }; next(); });
app.get('/api/bookings/client', bookingController.getClientBookings);
app.post('/api/bookings', bookingController.createBooking);
app.get('/api/bookings/:id', bookingController.getBookingById);
app.patch('/api/bookings/reschedule/:id', bookingController.rescheduleBooking);
app.patch('/api/bookings/cancel/:id', bookingController.cancelBooking);

describe('Essential Booking Tests', () => {
  setupTestDB();
  
  let testUser, testCoach, testBooking;

  beforeAll(async () => {
    testUser = await createTestUser(User);
    const coachData = await createTestCoach(User, Coach);
    testCoach = coachData.coach;

    testBooking = await Booking.create({
      client: testUser._id,
      coach: testCoach._id,
      date: new Date(),
      timeSlot: '10:00',
      duration: 1,
      totalAmount: 50,
      platformFee: 5,
      coachEarnings: 45,
      status: 'pending'
    });
  });

  afterAll(async () => {
    await Booking.deleteMany({});
    await User.deleteMany({});
    await Coach.deleteMany({});
  });

  // Essential booking flow tests
  describe('Core Booking Functionality', () => {
    it('complete booking flow', async () => {
      // 1. Create booking
      const newBooking = {
        coachId: testCoach._id,
        date: new Date().toISOString().split('T')[0],
        timeSlot: '14:00',
        duration: 1,
        totalAmount: 50,
        platformFee: 5,
        coachEarnings: 45
      };

      const createResponse = await request(app)
        .post('/api/bookings')
        .send(newBooking);

      expect(createResponse.status).toBe(201);
      const bookingId = createResponse.body.data._id;

      // 2. Get booking details
      const getResponse = await request(app)
        .get(`/api/bookings/${bookingId}`);
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.timeSlot).toBe('14:00');

      // 3. Reschedule booking
      const rescheduleResponse = await request(app)
        .patch(`/api/bookings/reschedule/${bookingId}`)
        .send({ newDate: '2024-03-20', newTimeSlot: '15:00' });

      expect(rescheduleResponse.status).toBe(200);
      expect(rescheduleResponse.body.data.timeSlot).toBe('15:00');

      // 4. Cancel booking
      const cancelResponse = await request(app)
        .patch(`/api/bookings/cancel/${bookingId}`)
        .send({ reason: 'Test cancellation' });

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.data.status).toBe('cancelled');
    });

    // Quick validation tests
    it('handles invalid booking data', async () => {
      const invalidData = { date: 'invalid' };
      const response = await request(app)
        .post('/api/bookings')
        .send(invalidData);
      
      expect(response.status).toBe(400);
    });

    it('handles non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/bookings/${fakeId}`);
      
      expect(response.status).toBe(404);
    });
  });

  // Client bookings list
  describe('Client Bookings', () => {
    it('lists client bookings', async () => {
      const response = await request(app)
        .get('/api/bookings/client');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
    });
  });
}); 