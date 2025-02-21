require('dotenv').config();

module.exports = {
  // Database
  mongoURI: process.env.MONGODB_URI,
  
  // Server
  port: process.env.PORT || 5000,
  
  // Cors
  corsOptions: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
}; 