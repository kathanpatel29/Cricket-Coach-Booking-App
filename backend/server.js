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
app.use(cors({
  origin: [
    'https://cricket-coach-booking-app.vercel.app',
    'https://cricket-coach-booking-app-frontend.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

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

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;