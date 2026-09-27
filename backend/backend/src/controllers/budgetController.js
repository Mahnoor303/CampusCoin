const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const { calculateBudgetUsage, getBudgetsWithUsage } = require('../services/budgetService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { assertOwnership } = require('../utils/ownershipChecker');

/**
 * Validates category exists, belongs to user or default, and is an expense category
 */
const validateBudgetCategory = async (categoryId, userId) => {
  const category = await Category.findOne({
    _id: categoryId,
    $or: [
      { isDefault: true, user: null },
      { user: userId },
    ],
  });

  if (!category) {
    const error = new Error('Category not found or you do not have permission to use it');
    error.statusCode = 400;
    throw error;
  }

  if (category.type !== 'expense') {
    const error = new Error(
      `Invalid category type: Budgets can only be set on 'expense' categories. '${category.name}' is an ${category.type} category.`
    );
    error.statusCode = 400;
    throw error;
  }

  return category;
};

/**
 * @desc    Create a new budget
 * @route   POST /api/budgets
 * @access  Private
 */
const createBudget = async (req, res, next) => {
  try {
    const { category, limit, period = 'monthly', startDate, endDate, alertThreshold } = req.body;

    // Validate category is an expense category
    const categoryDoc = await validateBudgetCategory(category, req.user._id);

    const budget = await Budget.create({
      user: req.user._id,
      category,
      limit: parseFloat(limit),
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      alertThreshold: alertThreshold ? parseInt(alertThreshold, 10) : 80,
    });

    await budget.populate('category', 'name type icon color isDefault');

    const usage = await calculateBudgetUsage(budget, req.user._id);

    return sendSuccess(res, 201, 'Budget created successfully', {
      ...budget.toObject(),
      usage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all budgets for authenticated user with dynamic usage
 * @route   GET /api/budgets
 * @access  Private
 */
const getBudgets = async (req, res, next) => {
  try {
    const budgets = await getBudgetsWithUsage(req.user._id, req.query);
    return sendSuccess(res, 200, 'Budgets retrieved successfully', budgets);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single budget by ID
 * @route   GET /api/budgets/:id
 * @access  Private
 */
const getBudgetById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid budget identifier format');
    }

    const budget = await Budget.findById(id).populate(
      'category',
      'name type icon color isDefault'
    );

    if (!budget) {
      return sendError(res, 404, 'Budget not found');
    }

    assertOwnership(budget.user, req.user, 'Budget');

    const usage = await calculateBudgetUsage(budget, req.user._id);

    return sendSuccess(res, 200, 'Budget retrieved successfully', {
      ...budget.toObject(),
      usage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get real-time usage for a specific budget
 * @route   GET /api/budgets/:id/usage
 * @access  Private
 */
const getBudgetUsage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid budget identifier format');
    }

    const budget = await Budget.findById(id).populate(
      'category',
      'name type icon color isDefault'
    );

    if (!budget) {
      return sendError(res, 404, 'Budget not found');
    }

    assertOwnership(budget.user, req.user, 'Budget');

    const usage = await calculateBudgetUsage(budget, req.user._id);

    return sendSuccess(res, 200, 'Budget usage calculated successfully', usage);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a budget
 * @route   PUT /api/budgets/:id
 * @access  Private
 */
const updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid budget identifier format');
    }

    const budget = await Budget.findById(id);

    if (!budget) {
      return sendError(res, 404, 'Budget not found');
    }

    assertOwnership(budget.user, req.user, 'Budget');

    const { category, limit, period, startDate, endDate, alertThreshold } = req.body;

    if (category) {
      await validateBudgetCategory(category, req.user._id);
      budget.category = category;
    }

    if (limit !== undefined) budget.limit = parseFloat(limit);
    if (period) budget.period = period;
    if (startDate) budget.startDate = new Date(startDate);
    if (endDate) budget.endDate = new Date(endDate);
    if (alertThreshold !== undefined) budget.alertThreshold = parseInt(alertThreshold, 10);

    await budget.save();
    await budget.populate('category', 'name type icon color isDefault');

    const usage = await calculateBudgetUsage(budget, req.user._id);

    return sendSuccess(res, 200, 'Budget updated successfully', {
      ...budget.toObject(),
      usage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a budget
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid budget identifier format');
    }

    const budget = await Budget.findById(id);

    if (!budget) {
      return sendError(res, 404, 'Budget not found');
    }

    assertOwnership(budget.user, req.user, 'Budget');

    await Budget.findByIdAndDelete(budget._id);

    return sendSuccess(res, 200, 'Budget deleted successfully', {
      deletedBudgetId: id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  getBudgetUsage,
  updateBudget,
  deleteBudget,
};
