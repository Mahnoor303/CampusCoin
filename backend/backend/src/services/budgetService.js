const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

/**
 * Calculates real-time usage and alert metrics for a specific budget
 * 
 * @param {Object} budget - Budget document (populated with category or with category ID)
 * @param {string|mongoose.Types.ObjectId} userId - User ID
 * @returns {Promise<Object>} Computed usage and alert status
 */
const calculateBudgetUsage = async (budget, userId) => {
  const categoryId = budget.category._id || budget.category;

  const startDate = new Date(budget.startDate);
  const endDate = new Date(budget.endDate);
  endDate.setHours(23, 59, 59, 999);

  // Aggregate total expenses in the budget category and date window
  const aggregation = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        category: new mongoose.Types.ObjectId(categoryId),
        type: 'expense',
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  const rawSpent = aggregation.length > 0 ? aggregation[0].totalSpent : 0;
  const transactionCount = aggregation.length > 0 ? aggregation[0].transactionCount : 0;

  const amountSpent = Math.round(rawSpent * 100) / 100;
  const limit = Math.round(budget.limit * 100) / 100;
  const remainingAmount = Math.max(0, Math.round((limit - amountSpent) * 100) / 100);
  const percentageUsed = limit > 0 ? Math.round((amountSpent / limit) * 10000) / 100 : 0;

  const threshold = budget.alertThreshold || 80;
  const isApproaching = percentageUsed >= threshold && percentageUsed < 100;
  const isExceeded = percentageUsed >= 100;

  let alertStatus = 'ok';
  if (isExceeded) {
    alertStatus = 'exceeded';
  } else if (isApproaching) {
    alertStatus = 'warning';
  }

  return {
    budgetId: budget._id,
    limit,
    amountSpent,
    remainingAmount,
    percentageUsed,
    alertThreshold: threshold,
    alertStatus,
    isApproaching,
    isExceeded,
    transactionCount,
    period: budget.period,
    startDate: budget.startDate,
    endDate: budget.endDate,
  };
};

/**
 * Retrieves user budgets with populated category and dynamic usage calculations
 * 
 * @param {string|mongoose.Types.ObjectId} userId 
 * @param {Object} [filters={}] 
 * @returns {Promise<Array<Object>>}
 */
const getBudgetsWithUsage = async (userId, filters = {}) => {
  const query = { user: userId };

  if (filters.period) {
    query.period = filters.period;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.activeOnly === 'true' || filters.activeOnly === true) {
    const now = new Date();
    query.startDate = { $lte: now };
    query.endDate = { $gte: now };
  }

  const budgets = await Budget.find(query)
    .populate('category', 'name type icon color isDefault')
    .sort({ startDate: -1 });

  const budgetsWithUsage = await Promise.all(
    budgets.map(async (b) => {
      const usage = await calculateBudgetUsage(b, userId);
      return {
        ...b.toObject(),
        usage,
      };
    })
  );

  return budgetsWithUsage;
};

module.exports = {
  calculateBudgetUsage,
  getBudgetsWithUsage,
};
