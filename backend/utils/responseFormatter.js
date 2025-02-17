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

module.exports = { formatResponse };