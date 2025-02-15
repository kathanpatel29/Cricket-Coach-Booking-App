const request = require('supertest');
const express = require('express');
const { setupTestDB, createTestUser, createTestCoach } = require('../helpers/testUtils');
const User = require('../../models/User');
const Coach = require('../../models/Coach');
const Booking = require('../../models/Booking');
const Report = require('../../models/Report');
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
app.get('/api/reports/revenue', reportController.getRevenueReports);
app.get('/api/reports/coaches', reportController.getCoachPerformanceReports);
app.get('/api/reports/analytics', reportController.getAnalytics);
app.post('/api/reports/export', reportController.exportReport);

describe('Reporting System Tests', () => {
  setupTestDB();
  let testClient, testCoach, testBookings;

  beforeAll(async () => {
    const clientData = await createTestUser(User);
    testClient = clientData.user;

    const coachData = await createTestCoach(User, Coach);
    testCoach = coachData.coach;

    // Create multiple bookings with different statuses and dates
    testBookings = await Booking.create([
      {
        client: testClient._id,
        coach: testCoach._id,
        date: new Date(),
        timeSlot: '10:00',
        duration: 1,
        totalAmount: 5000,
        status: 'completed',
        platformFee: 500,
        coachEarnings: 4500
      },
      {
        client: testClient._id,
        coach: testCoach._id,
        date: new Date(),
        timeSlot: '14:00',
        duration: 2,
        totalAmount: 10000,
        status: 'completed',
        platformFee: 1000,
        coachEarnings: 9000
      },
      {
        client: testClient._id,
        coach: testCoach._id,
        date: new Date(),
        timeSlot: '16:00',
        duration: 1,
        totalAmount: 5000,
        status: 'cancelled',
        platformFee: 500,
        coachEarnings: 4500
      }
    ]);
  });

  describe('Booking Reports', () => {
    it('generates booking summary report', async () => {
      const response = await request(app)
        .get('/api/reports/bookings')
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        totalBookings: 3,
        completedBookings: 2,
        cancelledBookings: 1,
        averageSessionDuration: 1.33, // (1 + 2 + 1) / 3
        bookingsByStatus: {
          completed: 2,
          cancelled: 1
        }
      });
    });

    it('filters booking reports by date range', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const response = await request(app)
        .get('/api/reports/bookings')
        .query({
          startDate: futureDate.toISOString(),
          endDate: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.data.totalBookings).toBe(0);
    });
  });

  describe('Revenue Reports', () => {
    it('generates revenue summary report', async () => {
      const response = await request(app)
        .get('/api/reports/revenue')
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        totalRevenue: 15000, // Sum of completed bookings
        platformRevenue: 1500, // Sum of platform fees
        coachEarnings: 13500, // Sum of coach earnings
        averageBookingValue: 7500, // 15000 / 2 completed bookings
        revenueByPeriod: expect.any(Object)
      });
    });

    it('calculates revenue trends', async () => {
      const response = await request(app)
        .get('/api/reports/revenue/trends')
        .query({
          period: 'monthly'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('trends');
      expect(response.body.data.trends).toHaveProperty('revenue');
      expect(response.body.data.trends).toHaveProperty('bookings');
    });
  });

  describe('Coach Performance Reports', () => {
    it('generates coach performance metrics', async () => {
      const response = await request(app)
        .get('/api/reports/coaches')
        .query({
          coachId: testCoach._id,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        totalSessions: 2, // Completed sessions
        cancellationRate: 0.33, // 1/3 bookings cancelled
        totalEarnings: 13500,
        averageSessionRating: expect.any(Number),
        bookingTrends: expect.any(Object)
      });
    });

    it('ranks coaches by performance', async () => {
      const response = await request(app)
        .get('/api/reports/coaches/rankings')
        .query({
          metric: 'earnings',
          period: 'monthly'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('rankings');
      expect(Array.isArray(response.body.data.rankings)).toBe(true);
    });
  });

  describe('Analytics Reports', () => {
    it('generates platform analytics', async () => {
      const response = await request(app)
        .get('/api/reports/analytics')
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        userMetrics: {
          totalUsers: expect.any(Number),
          activeUsers: expect.any(Number),
          userGrowth: expect.any(Number)
        },
        bookingMetrics: {
          conversionRate: expect.any(Number),
          repeatBookingRate: expect.any(Number)
        },
        financialMetrics: {
          revenueGrowth: expect.any(Number),
          averageOrderValue: expect.any(Number)
        }
      });
    });

    it('identifies peak booking times', async () => {
      const response = await request(app)
        .get('/api/reports/analytics/peak-times');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('peakHours');
      expect(response.body.data).toHaveProperty('peakDays');
      expect(response.body.data).toHaveProperty('seasonalTrends');
    });
  });

  describe('Report Export', () => {
    it('exports reports in various formats', async () => {
      const formats = ['csv', 'pdf', 'excel'];

      for (const format of formats) {
        const response = await request(app)
          .post('/api/reports/export')
          .send({
            reportType: 'bookings',
            format,
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          });

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(new RegExp(format));
        expect(response.body).toBeDefined();
      }
    });

    it('handles custom report parameters', async () => {
      const response = await request(app)
        .post('/api/reports/export')
        .send({
          reportType: 'custom',
          metrics: ['revenue', 'bookings', 'userGrowth'],
          groupBy: 'weekly',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('customReport');
      expect(response.body.data.customReport).toHaveProperty('metrics');
    });
  });

  describe('Report Access Control', () => {
    it('restricts access to authorized users', async () => {
      // Change auth middleware to non-admin user
      app.use((req, res, next) => {
        req.user = { id: '123456789', role: 'client', email: 'client@example.com' };
        next();
      });

      const response = await request(app)
        .get('/api/reports/revenue');

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('unauthorized');
    });

    it('limits report data based on user role', async () => {
      // Change auth middleware to coach user
      app.use((req, res, next) => {
        req.user = { id: testCoach._id, role: 'coach', email: 'coach@example.com' };
        next();
      });

      const response = await request(app)
        .get('/api/reports/coaches')
        .query({ coachId: testCoach._id });

      expect(response.status).toBe(200);
      // Coach should only see their own data
      expect(response.body.data.coachId).toBe(testCoach._id.toString());
    });
  });
}); 