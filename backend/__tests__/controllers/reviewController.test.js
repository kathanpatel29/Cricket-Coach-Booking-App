const request = require('supertest');
const express = require('express');
const { setupTestDB, createTestUser, createTestCoach } = require('../helpers/testUtils');
const User = require('../../models/User');
const Coach = require('../../models/Coach');
const Review = require('../../models/Review');
const reviewController = require('../../controllers/reviewController');

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: '123456789', role: 'client', email: 'client@example.com' };
  next();
});

// Setup review routes
app.post('/api/reviews', reviewController.createReview);
app.get('/api/reviews/coach/:coachId', reviewController.getCoachReviews);
app.patch('/api/reviews/:id', reviewController.updateReview);
app.delete('/api/reviews/:id', reviewController.deleteReview);

describe('Review Controller Tests', () => {
  setupTestDB();
  let testCoach, testReview;

  beforeAll(async () => {
    const coachData = await createTestCoach(User, Coach);
    testCoach = coachData.coach;
  });

  describe('Review Management', () => {
    it.concurrent('handles complete review flow', async () => {
      // Create review
      const reviewData = {
        coachId: testCoach._id,
        rating: 5,
        comment: 'Excellent coach!'
      };
      const createResponse = await request(app)
        .post('/api/reviews')
        .send(reviewData);
      expect(createResponse.status).toBe(201);
      testReview = createResponse.body.data;

      // Get coach reviews
      const getResponse = await request(app)
        .get(`/api/reviews/coach/${testCoach._id}`);
      expect(getResponse.status).toBe(200);
      expect(Array.isArray(getResponse.body.data.reviews)).toBe(true);

      // Update review
      const updateData = {
        rating: 4,
        comment: 'Updated review'
      };
      const updateResponse = await request(app)
        .patch(`/api/reviews/${testReview._id}`)
        .send(updateData);
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.rating).toBe(4);

      // Delete review
      const deleteResponse = await request(app)
        .delete(`/api/reviews/${testReview._id}`);
      expect(deleteResponse.status).toBe(200);
    });

    it.concurrent('handles invalid review data', async () => {
      const invalidData = { rating: 6 }; // Invalid rating > 5
      const response = await request(app)
        .post('/api/reviews')
        .send(invalidData);
      expect(response.status).toBe(400);
    });
  });
}); 