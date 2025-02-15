const request = require('supertest');
const express = require('express');
const { setupTestDB, createTestUser } = require('../helpers/testUtils');
const User = require('../../models/User');
const userController = require('../../controllers/userController');

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: '123456789', role: 'client', email: 'user@example.com' };
  next();
});

// Setup user routes
app.get('/api/users/profile', userController.getUserProfile);
app.patch('/api/users/profile', userController.updateProfile);
app.patch('/api/users/password', userController.updatePassword);

describe('User Controller Tests', () => {
  setupTestDB();
  let testUser;

  beforeAll(async () => {
    testUser = await createTestUser(User);
  });

  describe('User Profile Management', () => {
    it('handles complete user profile flow', async () => {
      // Get user profile
      const profileResponse = await request(app)
        .get('/api/users/profile');
      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.data).toHaveProperty('email');

      // Update profile
      const updateData = {
        name: 'Updated Name',
        phone: '1234567890'
      };
      const updateResponse = await request(app)
        .patch('/api/users/profile')
        .send(updateData);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.name).toBe('Updated Name');

      // Update password
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newPassword123'
      };
      const passwordResponse = await request(app)
        .patch('/api/users/password')
        .send(passwordData);
      expect(passwordResponse.status).toBe(200);
    });

    it('handles invalid profile updates', async () => {
      const invalidData = { email: 'invalid-email' };
      const response = await request(app)
        .patch('/api/users/profile')
        .send(invalidData);
      expect(response.status).toBe(400);
    });

    it('handles invalid password updates', async () => {
      const invalidData = {
        currentPassword: 'wrongpass',
        newPassword: 'newpass'
      };
      const response = await request(app)
        .patch('/api/users/password')
        .send(invalidData);
      expect(response.status).toBe(401);
    });
  });
}); 