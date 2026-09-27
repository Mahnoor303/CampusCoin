const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 401, 'Authentication required: No token provided');
  }

  try {
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return sendError(res, 401, 'Authentication failed: User no longer exists');
    }

    if (user.isActive === false) {
      return sendError(res, 403, 'Account is deactivated. Please contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Authentication failed: Token has expired');
    }
    return sendError(res, 401, 'Authentication failed: Invalid token');
  }
};

/**
 * Middleware for role-based access control
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'student')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};
