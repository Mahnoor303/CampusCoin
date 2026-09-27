const {
  getDashboardData,
  getReportSummary,
  getCategoryBreakdown,
  getMonthlyReport,
  getTrendsReport,
} = require('../services/reportService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get complete aggregated dataset for the React Dashboard
 * @route   GET /api/reports/dashboard
 * @access  Private
 */
const getDashboard = async (req, res, next) => {
  try {
    const data = await getDashboardData(req.user._id);
    return sendSuccess(res, 200, 'Dashboard data retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get financial summary metrics over a filtered timeframe
 * @route   GET /api/reports/summary
 * @access  Private
 */
const getSummary = async (req, res, next) => {
  try {
    const data = await getReportSummary(req.user._id, req.query);
    return sendSuccess(res, 200, 'Report summary retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get category breakdown report with percentages
 * @route   GET /api/reports/category-breakdown
 * @access  Private
 */
const getBreakdown = async (req, res, next) => {
  try {
    const data = await getCategoryBreakdown(req.user._id, req.query);
    return sendSuccess(res, 200, 'Category breakdown report retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly financial reports
 * @route   GET /api/reports/monthly
 * @access  Private
 */
const getMonthly = async (req, res, next) => {
  try {
    const data = await getMonthlyReport(req.user._id, req.query);
    return sendSuccess(res, 200, 'Monthly report retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get trend data points for chart visualizations
 * @route   GET /api/reports/trends
 * @access  Private
 */
const getTrends = async (req, res, next) => {
  try {
    const data = await getTrendsReport(req.user._id, req.query);
    return sendSuccess(res, 200, 'Financial trends report retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getSummary,
  getBreakdown,
  getMonthly,
  getTrends,
};
