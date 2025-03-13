const express = require("express");
const cors = require("cors");
const config = require("./config/config");
const securityMiddleware = require("./middlewares/securityMiddleware");
const { errorMiddleware } = require("./middlewares/errorMiddleware");
const connectDB = require("./config/db");

// Connect to MongoDB
connectDB();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced CORS configuration using our config module
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = config.cors.getAllowedOrigins();
    
    // Allow requests with no origin (like mobile apps, curl requests, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      console.warn(`Allowed origins: ${JSON.stringify(allowedOrigins)}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin', 
    'Access-Control-Request-Method', 
    'Access-Control-Request-Headers',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Content-Length', 'X-Rate-Limit'],
  maxAge: 86400 // 24 hours in seconds - how long the browser should cache CORS response
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Add CORS headers to all responses as a fallback
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = config.cors.getAllowedOrigins();
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  next();
});

securityMiddleware(app);

// Health check endpoint - no auth required
app.get("/api/health", (req, res) => {
  // Set CORS headers explicitly for the health check endpoint
  const origin = req.headers.origin;
  const allowedOrigins = config.cors.getAllowedOrigins();
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
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

// Route Middleware - Organized by role with linear paths
app.use("/api/public", publicRoutes);  // Public routes (no auth required)
app.use("/api/user", userRoutes);      // User-specific routes
app.use("/api/coach", coachRoutes);    // Coach-specific routes
app.use("/api/admin", adminRoutes);    // Admin-specific routes

// Error Middleware
app.use(errorMiddleware);

// Start Server
const PORT = config.port;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${config.env} mode`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});
