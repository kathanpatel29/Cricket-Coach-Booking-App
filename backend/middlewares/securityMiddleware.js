const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const securityMiddleware = (app) => {
  app.use(helmet()); // Secure HTTP headers
  app.use(morgan("dev")); // Logging
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })); // Rate limiter
};

module.exports = securityMiddleware;
