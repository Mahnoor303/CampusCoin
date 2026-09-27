const { sendError } = require('../utils/apiResponse');

/**
 * Handle 404 Not Found for undefined routes
 */
const notFound = (req, res, next) => {
  sendError(res, 404, `Endpoint not found: ${req.method} ${req.originalUrl}`);
};

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid resource identifier: ${err.value}`;
  }

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value '${val}' entered for ${field}. Please use another value.`;
  }

  // Handle Mongoose schema validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error occurred';
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // In development, provide debug stack if requested
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && !errors && err.stack) {
    errors = { stack: err.stack };
  }

  sendError(res, statusCode, message, errors);
};

module.exports = {
  notFound,
  errorHandler,
};
