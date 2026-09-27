const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/* In-memory store for password reset tokens (single-instance dev server).
   Token -> { userId, expiresAt } — hashed before storage. */
const resetTokens = new Map();
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

const hashCode = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'student',
      academicYear,
      monthlyAllowanceBaseline,
      monthlySavingsGoal,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 400, 'An account with this email address already exists');
    }

    // Role safety: restrict admin self-registration if admin key is configured
    let assignedRole = 'student';
    if (role === 'admin') {
      const adminSecret = process.env.ADMIN_SECRET_KEY;
      if (adminSecret && req.body.adminSecretKey !== adminSecret) {
        return sendError(res, 403, 'Unauthorized to register as administrator');
      }
      assignedRole = 'admin';
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      academicYear: academicYear || '',
      monthlyAllowanceBaseline: monthlyAllowanceBaseline || 0,
      monthlySavingsGoal: monthlySavingsGoal || 0,
    });

    // Generate JWT
    const token = generateToken({ id: user._id, role: user.role });

    return sendSuccess(
      res,
      201,
      'User registered successfully',
      {
        token,
        user: user.toJSON(),
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password included for verification
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password');
    }

    if (user.isActive === false) {
      return sendError(res, 403, 'Account is deactivated. Please contact support.');
    }

    const token = generateToken({ id: user._id, role: user.role });

    return sendSuccess(
      res,
      200,
      'Logged in successfully',
      {
        token,
        user: user.toJSON(),
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by protect middleware
    return sendSuccess(res, 200, 'Authenticated user profile retrieved', {
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user / clear token session
 * @route   POST /api/auth/logout
 * @access  Public / Private
 */
const logout = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request a password reset token for an email address.
 *          Always returns 200 (never reveals whether the email exists).
 *          In dev the raw token is returned so the flow is testable
 *          without an email provider; in production you would email it.
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });

    if (!user) {
      // Do not leak account existence
      return sendSuccess(res, 200, 'If that email is registered, a reset link has been sent.');
    }

    const raw = crypto.randomBytes(32).toString('hex');
    resetTokens.set(hashCode(raw), {
      userId: user._id.toString(),
      expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
    });

    // Sweep expired tokens occasionally
    if (resetTokens.size > 100) {
      const now = Date.now();
      for (const [k, v] of resetTokens) if (v.expiresAt < now) resetTokens.delete(k);
    }

    const payload = { expiresInMinutes: RESET_TOKEN_TTL_MS / 60000 };
    if (process.env.NODE_ENV !== 'production') payload.resetToken = raw;

    return sendSuccess(res, 200, 'If that email is registered, a reset link has been sent.', payload);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using a valid reset token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const key = hashCode(token);
    const entry = resetTokens.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      resetTokens.delete(key);
      return sendError(res, 400, 'Reset token is invalid or has expired. Please request a new one.');
    }

    const user = await User.findById(entry.userId).select('+password');
    if (!user) {
      resetTokens.delete(key);
      return sendError(res, 400, 'Reset token is invalid or has expired. Please request a new one.');
    }

    user.password = password; // hashed by the pre-save hook
    await user.save();
    resetTokens.delete(key);

    const authToken = generateToken({ id: user._id, role: user.role });

    return sendSuccess(res, 200, 'Password reset successfully', {
      token: authToken,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
};
