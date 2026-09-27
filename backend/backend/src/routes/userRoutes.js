const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
} = require('../controllers/userController');

const {
  updateProfileRules,
} = require('../validators/userValidator');

const { validate } = require('../middleware/validateMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendSuccess } = require('../utils/apiResponse');

// Authenticated user endpoints
router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfileRules, validate, updateProfile);

// Admin-only test/verification endpoint
router.get('/admin-test', protect, authorize('admin'), (req, res) => {
  return sendSuccess(res, 200, 'Admin authorization verified', {
    adminUser: req.user.email,
    role: req.user.role,
  });
});

module.exports = router;
