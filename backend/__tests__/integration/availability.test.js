const request = require('supertest');
const express = require('express');
const { setupTestDB, createTestUser, createTestCoach } = require('../helpers/testUtils');
const User = require('../../models/User');
const Coach = require('../../models/Coach');
const Booking = require('../../models/Booking');
const Availability = require('../../models/Availability');
const availabilityController = require('../../controllers/availabilityController');

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: '123456789', role: 'coach', email: 'coach@example.com' };
  next();
});

// Setup availability routes
app.post('/api/availability', availabilityController.setAvailability);
app.get('/api/availability/:coachId', availabilityController.getAvailability);
app.post('/api/availability/validate', availabilityController.validateTimeSlot);

describe('Coach Availability and Booking Validation Tests', () => {
  setupTestDB();
  let testCoach, testClient;

  beforeAll(async () => {
    const coachData = await createTestCoach(User, Coach);
    testCoach = coachData.coach;

    const clientData = await createTestUser(User);
    testClient = clientData.user;
  });

  describe('Availability Management', () => {
    it('sets coach availability successfully', async () => {
      const availabilityData = {
        coachId: testCoach._id,
        weeklySchedule: {
          monday: [{ start: '09:00', end: '17:00' }],
          wednesday: [{ start: '10:00', end: '18:00' }],
          friday: [{ start: '09:00', end: '13:00' }]
        },
        exceptions: [
          {
            date: new Date('2024-04-01'),
            available: false,
            reason: 'Holiday'
          }
        ]
      };

      const response = await request(app)
        .post('/api/availability')
        .send(availabilityData);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('weeklySchedule');
      expect(response.body.data.weeklySchedule.monday).toHaveLength(1);
      expect(response.body.data.exceptions).toHaveLength(1);
    });

    it('validates time slot format', async () => {
      const invalidData = {
        coachId: testCoach._id,
        weeklySchedule: {
          monday: [{ start: 'invalid', end: '17:00' }]
        }
      };

      const response = await request(app)
        .post('/api/availability')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid time format');
    });

    it('prevents overlapping time slots', async () => {
      const overlappingData = {
        coachId: testCoach._id,
        weeklySchedule: {
          monday: [
            { start: '09:00', end: '17:00' },
            { start: '16:00', end: '18:00' }
          ]
        }
      };

      const response = await request(app)
        .post('/api/availability')
        .send(overlappingData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('overlapping');
    });
  });

  describe('Availability Retrieval', () => {
    beforeEach(async () => {
      await Availability.create({
        coachId: testCoach._id,
        weeklySchedule: {
          monday: [{ start: '09:00', end: '17:00' }],
          wednesday: [{ start: '10:00', end: '18:00' }]
        }
      });
    });

    it('retrieves coach availability correctly', async () => {
      const response = await request(app)
        .get(`/api/availability/${testCoach._id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.weeklySchedule).toHaveProperty('monday');
      expect(response.body.data.weeklySchedule.monday[0]).toMatchObject({
        start: '09:00',
        end: '17:00'
      });
    });

    it('returns available time slots for a specific date', async () => {
      const date = new Date();
      date.setDate(date.getDate() + (8 - date.getDay()) % 7); // Next Monday

      const response = await request(app)
        .get(`/api/availability/${testCoach._id}`)
        .query({ date: date.toISOString() });

      expect(response.status).toBe(200);
      expect(response.body.data.availableSlots).toBeDefined();
      expect(Array.isArray(response.body.data.availableSlots)).toBe(true);
    });
  });

  describe('Booking Validation', () => {
    beforeEach(async () => {
      // Set up coach availability
      await Availability.create({
        coachId: testCoach._id,
        weeklySchedule: {
          monday: [{ start: '09:00', end: '17:00' }]
        }
      });

      // Create an existing booking
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7);
      
      await Booking.create({
        coach: testCoach._id,
        client: testClient._id,
        date: nextMonday,
        timeSlot: '10:00',
        duration: 1,
        status: 'confirmed'
      });
    });

    it('validates available time slot successfully', async () => {
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7);

      const response = await request(app)
        .post('/api/availability/validate')
        .send({
          coachId: testCoach._id,
          date: nextMonday,
          timeSlot: '14:00',
          duration: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(true);
    });

    it('detects booking conflicts', async () => {
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7);

      const response = await request(app)
        .post('/api/availability/validate')
        .send({
          coachId: testCoach._id,
          date: nextMonday,
          timeSlot: '10:00', // Already booked
          duration: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(false);
      expect(response.body.data.reason).toContain('already booked');
    });

    it('handles coach unavailability', async () => {
      const nextTuesday = new Date();
      nextTuesday.setDate(nextTuesday.getDate() + (9 - nextTuesday.getDay()) % 7);

      const response = await request(app)
        .post('/api/availability/validate')
        .send({
          coachId: testCoach._id,
          date: nextTuesday,
          timeSlot: '10:00',
          duration: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(false);
      expect(response.body.data.reason).toContain('not available');
    });

    it('validates booking duration constraints', async () => {
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7);

      const response = await request(app)
        .post('/api/availability/validate')
        .send({
          coachId: testCoach._id,
          date: nextMonday,
          timeSlot: '16:30', // Only 30 minutes left in schedule
          duration: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(false);
      expect(response.body.data.reason).toContain('duration exceeds');
    });
  });

  describe('Exception Handling', () => {
    it('handles coach holiday exceptions', async () => {
      // Set availability with holiday exception
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7);

      await Availability.create({
        coachId: testCoach._id,
        weeklySchedule: {
          monday: [{ start: '09:00', end: '17:00' }]
        },
        exceptions: [{
          date: nextMonday,
          available: false,
          reason: 'Holiday'
        }]
      });

      const response = await request(app)
        .post('/api/availability/validate')
        .send({
          coachId: testCoach._id,
          date: nextMonday,
          timeSlot: '10:00',
          duration: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(false);
      expect(response.body.data.reason).toContain('Holiday');
    });

    it('handles special availability exceptions', async () => {
      // Set availability with special hours
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7);

      await Availability.create({
        coachId: testCoach._id,
        weeklySchedule: {
          monday: [{ start: '09:00', end: '17:00' }]
        },
        exceptions: [{
          date: nextMonday,
          available: true,
          timeSlots: [{ start: '18:00', end: '20:00' }]
        }]
      });

      const response = await request(app)
        .post('/api/availability/validate')
        .send({
          coachId: testCoach._id,
          date: nextMonday,
          timeSlot: '19:00',
          duration: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.data.available).toBe(true);
    });
  });
}); 