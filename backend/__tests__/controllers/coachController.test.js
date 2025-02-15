const request = require('supertest');
const express = require('express');
const { setupTestDB, createTestUser, createTestCoach } = require('../helpers/testUtils');
const User = require('../../models/User');
const Coach = require('../../models/Coach');
const coachController = require('../../controllers/coachController');

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: '123456789', role: 'coach', email: 'coach@example.com' };
  next();
});

// Setup coach routes
app.get('/api/coaches', coachController.getAllCoaches);
app.get('/api/coaches/:id', coachController.getCoachById);
app.post('/api/coaches', coachController.createCoachProfile);
app.patch('/api/coaches/:id', coachController.updateCoachProfile);
app.patch('/api/coaches/:id/availability', coachController.updateAvailability);

describe('Coach Controller Tests', () => {
  setupTestDB();
  let testCoach;

  beforeAll(async () => {
    const coachData = await createTestCoach(User, Coach);
    testCoach = coachData.coach;
  });

  describe('Coach Profile Management', () => {
    it.concurrent('handles complete coach profile flow', async () => {
      // Get all coaches
      const listResponse = await request(app)
        .get('/api/coaches');
      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body.data.coaches)).toBe(true);

      // Get specific coach
      const getResponse = await request(app)
        .get(`/api/coaches/${testCoach._id}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data._id.toString()).toBe(testCoach._id.toString());

      // Update coach profile
      const updateData = {
        bio: 'Updated bio',
        hourlyRate: 60,
        specializations: ['batting', 'fielding']
      };
      const updateResponse = await request(app)
        .patch(`/api/coaches/${testCoach._id}`)
        .send(updateData);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.hourlyRate).toBe(60);

      // Update availability
      const availabilityData = {
        slots: [
          {
            date: new Date().toISOString().split.concurrent('T')[0],
            times: ['09:00', '10:00', '11:00']
          }
        ]
      };
      const availResponse = await request(app)
        .patch(`/api/coaches/${testCoach._id}/availability`)
        .send(availabilityData);
      expect(availResponse.status).toBe(200);
      expect(availResponse.body.data.availability).toBeDefined();
    });

    it.concurrent('handles invalid coach data', async () => {
      const invalidData = { hourlyRate: 'invalid' };
      const response = await request(app)
        .patch(`/api/coaches/${testCoach._id}`)
        .send(invalidData);
      expect(response.status).toBe(400);
    });
  });
}); 