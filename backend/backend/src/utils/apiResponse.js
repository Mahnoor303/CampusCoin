/**
 * Standard Success Response Helper
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {string} message - Human-readable success message
 * @param {*} data - Payload data
 * @param {Object} [meta] - Optional pagination or metadata
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = undefined) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== undefined && { meta }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Standard Error Response Helper
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {string} message - Error description
 * @param {*} [errors] - Specific validation error details or stack
 */
const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors !== null && { errors }),
  };

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};
