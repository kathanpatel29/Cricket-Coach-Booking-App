const request = require('supertest');
const express = require('express');
const { setupTestDB, createTestUser, createTestCoach } = require('../helpers/testUtils');
const User = require('../../models/User');
const Coach = require('../../models/Coach');
const Booking = require('../../models/Booking');
const reportController = require('../../controllers/reportController');

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: '123456789', role: 'admin', email: 'admin@example.com' };
  next();
});

// Setup report routes
app.get('/api/reports/bookings', reportController.getBookingReports);
app.get('/api/reports/earnings', reportController.getEarningsReport);
app.get('/api/reports/coaches', reportController.getCoachPerformanceReport);
app.get('/api/reports/export', reportController.exportReports);

describe('Report Controller Tests', () => {
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
      totalAmount: 50,
      platformFee: 5,
      coachEarnings: 45,
      status: 'completed'
    });
  });

  describe('Report Generation', () => {
    it('generates all types of reports', async () => {
      // Booking reports
      const bookingResponse = await request(app)
        .get('/api/reports/bookings')
        .query({ 
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });
      expect(bookingResponse.status).toBe(200);
      expect(bookingResponse.body.data).toHaveProperty('totalBookings');

      // Earnings report
      const earningsResponse = await request(app)
        .get('/api/reports/earnings')
        .query({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
      expect(earningsResponse.status).toBe(200);
      expect(earningsResponse.body.data).toHaveProperty('totalEarnings');

      // Coach performance report
      const performanceResponse = await request(app)
        .get('/api/reports/coaches')
        .query({ coachId: testCoach._id });
      expect(performanceResponse.status).toBe(200);
      expect(performanceResponse.body.data).toHaveProperty('performance');

      // Export reports
      const exportResponse = await request(app)
        .get('/api/reports/export')
        .query({ type: 'bookings' });
      expect(exportResponse.status).toBe(200);
    });

    it('handles invalid report parameters', async () => {
      const response = await request(app)
        .get('/api/reports/bookings')
        .query({ 
          startDate: 'invalid-date',
          endDate: new Date().toISOString()
        });
      expect(response.status).toBe(400);
    });
  });
}); 