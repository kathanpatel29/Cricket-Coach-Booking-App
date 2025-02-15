const request = require('supertest');
const express = require('express');
const { setupTestDB, createTestUser, createTestCoach } = require('../helpers/testUtils');
const User = require('../../models/User');
const Coach = require('../../models/Coach');
const adminController = require('../../controllers/adminController');

const app = express();
app.use(express.json());

// Mock admin middleware
app.use((req, res, next) => {
  req.user = { id: '123456789', role: 'admin', email: 'admin@example.com' };
  next();
});

// Setup admin routes
app.get('/api/admin/users', adminController.getAllUsers);
app.get('/api/admin/coaches', adminController.getAllCoaches);
app.patch('/api/admin/coaches/:id/approve', adminController.approveCoach);
app.get('/api/admin/reports/bookings', adminController.getBookingReports);

describe('Admin Controller Tests', () => {
  setupTestDB();

  beforeAll(async () => {
    await createTestUser(User, { role: 'client' });
    await createTestCoach(User, Coach);
  });

  describe('Admin Core Functions', () => {
    it('manages users and coaches', async () => {
      // Get all users
      const usersResponse = await request(app)
        .get('/api/admin/users');
      expect(usersResponse.status).toBe(200);
      expect(Array.isArray(usersResponse.body.data.users)).toBe(true);

      // Get all coaches
      const coachesResponse = await request(app)
        .get('/api/admin/coaches');
      expect(coachesResponse.status).toBe(200);
      expect(Array.isArray(coachesResponse.body.data.coaches)).toBe(true);

      // Approve coach
      const coach = coachesResponse.body.data.coaches[0];
      const approveResponse = await request(app)
        .patch(`/api/admin/coaches/${coach._id}/approve`);
      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.data.isApproved).toBe(true);

      // Get booking reports
      const reportsResponse = await request(app)
        .get('/api/admin/reports/bookings');
      expect(reportsResponse.status).toBe(200);
      expect(reportsResponse.body.data).toBeDefined();
    });
  });
}); 