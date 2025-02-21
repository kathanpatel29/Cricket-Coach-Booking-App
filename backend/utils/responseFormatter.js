/**
 * Formats API responses consistently
 * @param {string} status - 'success' or 'error'
 * @param {string} message - Response message
 * @param {any} data - Response data (optional)
 * @returns {Object} Formatted response object
 */
const formatResponse = (status, message, data = null) => {
  const response = {
    status,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return response;
};

// Error response formatter
const errorResponse = (message, statusCode = 500) => {
  return {
    status: 'error',
    message,
    statusCode
  };
};

// Success response formatter
const successResponse = (res, statusCode, data, message) => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

module.exports = { formatResponse, errorResponse, successResponse };