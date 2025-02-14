const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const compression = require('compression');

// Load env vars
dotenv.config();

// Increase file descriptor limit if running on Node.js
if (process.platform !== 'win32') {
  try {
    const limit = 65536;
    require('fs').setMaxListeners(limit);
    require('events').EventEmitter.defaultMaxListeners = limit;
  } catch (err) {
    console.warn('Could not update file descriptor limit:', err);
  }
}

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
const PORT = process.env.PORT || 5000;

// Enable compression
app.use(compression());

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Requested-With'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache control for static files
const cacheTime = 86400000 * 30; // 30 days
app.use(express.static(path.join(__dirname, '../frontend/dist'), {
  maxAge: cacheTime,
  etag: true
}));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Error Handler
app.use(errorHandler);

// Connect to database
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
