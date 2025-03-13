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

// Define allowed origins explicitly
const allowedOrigins = [
  "http://localhost:3000", // Local frontend
  "http://localhost:5000", // Local backend (if applicable)
  "https://cricket-coach-booking-app.vercel.app/",//frontend
  "https://cricket-coach-booking-app-backend.vercel.app/"//backend
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allows cookies & authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-Custom-Header",
    "Cache-Control",
  ],
  exposedHeaders: ["Authorization", "X-Custom-Header", "Cache-Control"], // Allow frontend access to custom headers
  optionsSuccessStatus: 204 // Prevents issues with preflight requests
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

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
app.use("/api/public", publicRoutes);
app.use("/api/user", userRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/admin", adminRoutes);

// Error Middleware
app.use(errorMiddleware);

// Start Server
const PORT = config.port;
const server = app.listen(PORT, () => 
  console.log(`Server running on port ${PORT} in ${config.env} mode`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  server.close(() => process.exit(1));
});
