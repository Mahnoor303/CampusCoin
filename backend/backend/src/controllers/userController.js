const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 404, 'User profile not found');
    }

    return sendSuccess(res, 200, 'Profile retrieved successfully', {
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Explicitly prevent non-admin users from escalating privileges or altering core credentials
    if (req.body.role && req.body.role !== user.role && req.user.role !== 'admin') {
      return sendError(res, 403, 'Modifying user role is not permitted');
    }

    // Allowed profile fields to update
    const allowedUpdates = [
      'name',
      'academicYear',
      'monthlyAllowanceBaseline',
      'monthlySavingsGoal',
      'avatar',
      'bio',
      'phone',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    const updatedUser = await user.save();

    return sendSuccess(res, 200, 'Profile updated successfully', {
      user: updatedUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
