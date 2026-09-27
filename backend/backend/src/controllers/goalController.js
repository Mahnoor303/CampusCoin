const mongoose = require('mongoose');
const Goal = require('../models/Goal');
const { calculateGoalProgress } = require('../services/goalService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { assertOwnership } = require('../utils/ownershipChecker');

/**
 * @desc    Create a new savings goal
 * @route   POST /api/goals
 * @access  Private
 */
const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, currentAmount = 0, deadline, status = 'in_progress', notes = '' } = req.body;

    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount);

    let initialStatus = status;
    if (current >= target) {
      initialStatus = 'completed';
    }

    const goal = await Goal.create({
      user: req.user._id,
      name: name.trim(),
      targetAmount: target,
      currentAmount: current,
      deadline: new Date(deadline),
      status: initialStatus,
      notes: notes ? notes.trim() : '',
    });

    const progress = calculateGoalProgress(goal);

    return sendSuccess(res, 201, 'Savings goal created successfully', {
      ...goal.toObject(),
      progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all savings goals for authenticated user
 * @route   GET /api/goals
 * @access  Private
 */
const getGoals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    const goals = await Goal.find(query).sort({ deadline: 1, createdAt: -1 });

    const goalsWithProgress = goals.map((g) => ({
      ...g.toObject(),
      progress: calculateGoalProgress(g),
    }));

    return sendSuccess(res, 200, 'Savings goals retrieved successfully', goalsWithProgress);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single savings goal by ID
 * @route   GET /api/goals/:id
 * @access  Private
 */
const getGoalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid goal identifier format');
    }

    const goal = await Goal.findById(id);

    if (!goal) {
      return sendError(res, 404, 'Savings goal not found');
    }

    assertOwnership(goal.user, req.user, 'Savings Goal');

    const progress = calculateGoalProgress(goal);

    return sendSuccess(res, 200, 'Savings goal retrieved successfully', {
      ...goal.toObject(),
      progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get progress details for a savings goal
 * @route   GET /api/goals/:id/progress
 * @access  Private
 */
const getGoalProgress = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid goal identifier format');
    }

    const goal = await Goal.findById(id);

    if (!goal) {
      return sendError(res, 404, 'Savings goal not found');
    }

    assertOwnership(goal.user, req.user, 'Savings Goal');

    const progress = calculateGoalProgress(goal);

    return sendSuccess(res, 200, 'Goal progress calculated successfully', progress);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a savings goal
 * @route   PUT /api/goals/:id
 * @access  Private
 */
const updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid goal identifier format');
    }

    const goal = await Goal.findById(id);

    if (!goal) {
      return sendError(res, 404, 'Savings goal not found');
    }

    assertOwnership(goal.user, req.user, 'Savings Goal');

    const { name, targetAmount, currentAmount, deadline, status, notes } = req.body;

    if (name) goal.name = name.trim();
    if (targetAmount !== undefined) goal.targetAmount = parseFloat(targetAmount);
    if (currentAmount !== undefined) goal.currentAmount = parseFloat(currentAmount);
    if (deadline) goal.deadline = new Date(deadline);
    if (notes !== undefined) goal.notes = notes ? notes.trim() : '';

    // Status logic: auto-complete if current meets target, or allow manual override
    if (status) {
      goal.status = status;
    } else if (goal.currentAmount >= goal.targetAmount && goal.status === 'in_progress') {
      goal.status = 'completed';
    }

    await goal.save();

    const progress = calculateGoalProgress(goal);

    return sendSuccess(res, 200, 'Savings goal updated successfully', {
      ...goal.toObject(),
      progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a savings goal
 * @route   DELETE /api/goals/:id
 * @access  Private
 */
const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid goal identifier format');
    }

    const goal = await Goal.findById(id);

    if (!goal) {
      return sendError(res, 404, 'Savings goal not found');
    }

    assertOwnership(goal.user, req.user, 'Savings Goal');

    await Goal.findByIdAndDelete(goal._id);

    return sendSuccess(res, 200, 'Savings goal deleted successfully', {
      deletedGoalId: id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  getGoalProgress,
  updateGoal,
  deleteGoal,
};
