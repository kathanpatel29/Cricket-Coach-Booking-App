const dotenv = require('dotenv');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
console.log(`Loading environment from ${envFile}`);

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Configuration object
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',

  // Server
  port: parseInt(process.env.PORT || '5000', 10),

  // Database
  db: {
    uri: process.env.MONGODB_URI,
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expire: process.env.JWT_EXPIRE || '24h',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },

  // Frontend URL (Same for all environments, taken directly from .env)
  frontendURL: process.env.FRONTEND_URL,

  // CORS configuration
  cors: {
    getAllowedOrigins: () => {
      const origins = [config.frontendURL];
      // Add any additional origins from env if needed
      if (process.env.ADDITIONAL_CORS_ORIGINS) {
        origins.push(...process.env.ADDITIONAL_CORS_ORIGINS.split(','));
      }
      return origins;
    }
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  }
};

// Log configuration summary (without exposing secrets)
console.log(` Server configuration loaded for ${config.env} environment`);
console.log(` Frontend URL: ${config.frontendURL}`);
console.log(` Database: ${config.db.uri.replace(/\/\/.*@/, '//[credentials-hidden]@')}`);

module.exports = config;
