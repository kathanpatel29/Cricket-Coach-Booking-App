const express = require('express');
const cors = require('cors');
const { errorResponse } = require('./utils/responseFormatter');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/coaches', require('./routes/coaches'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json(errorResponse('Validation Error', err.message));
  }

  if (err.name === 'CastError') {
    return res.status(400).json(errorResponse('Invalid ID', 'Please provide a valid ID'));
  }

  if (err.code === 11000) {
    return res.status(400).json(errorResponse('Duplicate Error', 'Duplicate field value entered'));
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('Authentication Error', 'Invalid token'));
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json(errorResponse(message));
});

module.exports = app; 