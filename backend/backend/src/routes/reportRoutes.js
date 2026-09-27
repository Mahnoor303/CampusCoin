const express = require('express');
const router = express.Router();

const {
  getDashboard,
  getSummary,
  getBreakdown,
  getMonthly,
  getTrends,
} = require('../controllers/reportController');

const {
  reportFilterRules,
} = require('../validators/reportValidator');

const { validate } = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/summary', reportFilterRules, validate, getSummary);
router.get('/category-breakdown', reportFilterRules, validate, getBreakdown);
router.get('/monthly', reportFilterRules, validate, getMonthly);
router.get('/trends', reportFilterRules, validate, getTrends);

module.exports = router;
