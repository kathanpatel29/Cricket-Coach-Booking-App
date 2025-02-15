const request = require('supertest');
const express = require('express');

// Create a test app and import routes
const app = express();
const router = require('../../routes/bookings');
app.use('/api/bookings', router);

describe('Booking Routes', () => {
  describe('GET /api/bookings/client', () => {
    it.concurrent('should return empty bookings array', async () => {
      const response = await request(app)
        .get('/api/bookings/client');
      
      expect(response.status).toBe(200);
      expect(response.body.data.bookings).toEqual([]);
    });
  });

  describe('POST /api/bookings', () => {
    it.concurrent('should create a booking', async () => {
      const bookingData = {
        coachId: 'test-coach-id',
        date: '2024-03-15',
        timeSlot: '10:00',
        duration: 60
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.data._id).toBe('mock-booking-id');
      expect(response.body.data.coachId).toBe(bookingData.coachId);
    });
  });

  describe('GET /api/bookings/:id', () => {
    it.concurrent('should get booking by id', async () => {
      const bookingId = 'test-booking-id';
      const response = await request(app)
        .get(`/api/bookings/${bookingId}`);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(bookingId);
      expect(response.body.data.status).toBe('pending');
    });
  });

  describe('PATCH /api/bookings/reschedule/:id', () => {
    it.concurrent('should reschedule a booking', async () => {
      const bookingId = 'test-booking-id';
      const updateData = {
        newDate: '2024-03-16',
        newTimeSlot: '11:00'
      };

      const response = await request(app)
        .patch(`/api/bookings/reschedule/${bookingId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(bookingId);
      expect(response.body.data.newDate).toBe(updateData.newDate);
    });
  });

  describe('PATCH /api/bookings/cancel/:id', () => {
    it.concurrent('should cancel a booking', async () => {
      const bookingId = 'test-booking-id';
      
      const response = await request(app)
        .patch(`/api/bookings/cancel/${bookingId}`);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(bookingId);
      expect(response.body.data.status).toBe('cancelled');
    });
  });
}); 