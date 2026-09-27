const insightService = require("../services/insightService");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const Insight = require("../models/Insight");

/**
 * @desc  Get persisted insights for the authenticated user
 * @route GET /api/insights
 * @access Private
 */
const getInsights = async (req, res, next) => {
  try {
    const month = req.query.month || insightService.currentMonthStr();
    const insights = await insightService.getUserInsights(req.user._id, month);
    return sendSuccess(res, 200, "Insights retrieved", { insights, month });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Regenerate insights for the current month and persist them
 * @route POST /api/insights/generate
 * @access Private
 */
const generateInsights = async (req, res, next) => {
  try {
    const insights = await insightService.generateAndSaveInsights(req.user._id);
    return sendSuccess(res, 200, "Insights generated", {
      insights,
      count: insights.length,
      month: insightService.currentMonthStr(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Get real-time saving tips (not persisted)
 * @route GET /api/insights/tips
 * @access Private
 */
const getTips = async (req, res, next) => {
  try {
    const tips = await insightService.generateTips(req.user._id);
    return sendSuccess(res, 200, "Saving tips generated", {
      tips,
      count: tips.length,
      month: insightService.currentMonthStr(),
      disclaimer:
        "These tips are based on your recorded transaction data and transparent mathematical rules. They are not professional financial advice.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Mark an insight as read
 * @route PATCH /api/insights/:id/read
 * @access Private
 */
const markInsightRead = async (req, res, next) => {
  try {
    const insight = await Insight.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    ).populate("category", "name type icon color");

    if (!insight) {
      return sendError(res, 404, "Insight not found");
    }
    return sendSuccess(res, 200, "Insight marked as read", { insight });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Toggle pinned status of an insight
 * @route PATCH /api/insights/:id/pin
 * @access Private
 */
const toggleInsightPin = async (req, res, next) => {
  try {
    const existing = await Insight.findOne({ _id: req.params.id, user: req.user._id });
    if (!existing) {
      return sendError(res, 404, "Insight not found");
    }
    existing.isPinned = !existing.isPinned;
    await existing.save();
    await existing.populate("category", "name type icon color");
    return sendSuccess(res, 200, "Insight pin toggled", { insight: existing });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInsights, generateInsights, getTips, markInsightRead, toggleInsightPin };
