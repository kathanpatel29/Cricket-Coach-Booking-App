const express = require("express");
const cors = require("cors");
const config = require("./config/config");
const securityMiddleware = require("./middlewares/securityMiddleware");
const { errorMiddleware } = require("./middlewares/errorMiddleware");
const connectDB = require("./config/db");

// Connect to MongoDB
connectDB();

const app = express();

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simplified CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.cors.getAllowedOrigins();
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Apply security middleware
securityMiddleware(app);

// Health check endpoint - no auth required
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

// Import Routes
const publicRoutes = require("./routes/public");
const userRoutes = require("./routes/user");
const coachRoutes = require("./routes/coach");
const adminRoutes = require("./routes/admin");

// Route Middleware - Organized by role
app.use("/api/public", publicRoutes);  // Public routes (no auth required)
app.use("/api/user", userRoutes);      // User-specific routes
app.use("/api/coach", coachRoutes);    // Coach-specific routes
app.use("/api/admin", adminRoutes);    // Admin-specific routes

// Error Middleware
app.use(errorMiddleware);

// Start Server
const PORT = config.port;
const server = app.listen(PORT, () => 
  console.log(`Server running on port ${PORT} in ${config.env} mode`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  server.close(() => process.exit(1));
});
