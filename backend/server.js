const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const compression = require('compression');

// Load env vars
dotenv.config();

// Routes
const authRoutes = require('./routes/auth.js');
const userRoutes = require('./routes/users.js');
const coachRoutes = require('./routes/coaches.js');
const bookingRoutes = require('./routes/bookings.js');
const paymentRoutes = require('./routes/payments.js');
const adminRoutes = require('./routes/admin.js');

// Middleware
const { errorHandler } = require('./middleware/errorMiddleware.js');
const { connectDB } = require('./config/db.js');

const app = express();

// Enable compression
app.use(compression());

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://cricket-coach-booking-app.vercel.app'
    : 'http://localhost:3000',
  credentials: true, // Allows cookies and authentication headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma'  // ✅ Added to fix the error
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Enable CORS Middleware
app.use(cors(corsOptions));

// ✅ Explicitly Handle Preflight OPTIONS Requests
app.options('*', (req, res) => {
  res.header("Access-Control-Allow-Origin", corsOptions.origin);
  res.header("Access-Control-Allow-Methods", corsOptions.methods.join(','));
  res.header("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(','));
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204); // No Content
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Cricket Coach Booking API is running' });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    status: 404
  });
});

// Error Handler
app.use(errorHandler);

// Connect to database before starting server
connectDB();

const startServer = async () => {
  const PORT = process.env.PORT || 5000;

  try {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, trying ${PORT + 1}`);
        server.close();
        app.listen(PORT + 1);
      } else {
        console.error('Server error:', error);
      }
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
