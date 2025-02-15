const request = require('supertest');
const express = require('express');
const { setupTestDB } = require('../helpers/testUtils');
const User = require('../../models/User');
const authController = require('../../controllers/authController');

const app = express();
app.use(express.json());

// Setup routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

describe('Essential Auth Tests', () => {
  setupTestDB();

  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test@123',
    role: 'client'
  };

  describe('Authentication Flow', () => {
    it.concurrent('complete auth flow', async () => {
      // 1. Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.data).toHaveProperty('token');

      // 2. Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data).toHaveProperty('token');
    });

    // Validation tests
    it.concurrent('prevents duplicate registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(400);
    });

    it.concurrent('handles invalid login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpass'
        });

      expect(response.status).toBe(401);
    });
  });
}); 