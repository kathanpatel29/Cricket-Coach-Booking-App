// Mock booking routes
const { bookingController, client, validate } = require('./bookingController');

jest.mock('../../routes/bookings', () => {
  const express = require('express');
  const router = express.Router();

  // Mock routes with inline handlers
  router.get('/client', (req, res) => {
    res.json({ data: { bookings: [] } });
  });

  router.post('/', (req, res) => {
    res.status(201).json({
      data: {
        _id: 'mock-booking-id',
        ...req.body
      }
    });
  });

  router.get('/:id', (req, res) => {
    res.json({
      data: {
        _id: req.params.id,
        status: 'pending'
      }
    });
  });

  router.patch('/reschedule/:id', (req, res) => {
    res.json({
      data: {
        _id: req.params.id,
        ...req.body
      }
    });
  });

  router.patch('/cancel/:id', (req, res) => {
    res.json({
      data: {
        _id: req.params.id,
        status: 'cancelled'
      }
    });
  });

  return router;
}); 