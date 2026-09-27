const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const { calculateBudgetUsage } = require('./budgetService');
const { calculateGoalProgress } = require('./goalService');

/**
 * Builds standard date match criteria for transaction aggregations
 */
const buildDateMatch = (userId, startDate, endDate, category, type) => {
  const match = {
    user: new mongoose.Types.ObjectId(userId),
  };

  if (startDate || endDate) {
    match.date = {};
    if (startDate) {
      match.date.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      match.date.$lte = end;
    }
  }

  if (category) {
    match.category = new mongoose.Types.ObjectId(category);
  }

  if (type) {
    match.type = type;
  }

  return match;
};

/**
 * Aggregates complete dashboard dataset for frontend React application
 * 
 * @param {string|mongoose.Types.ObjectId} userId 
 * @returns {Promise<Object>}
 */
const getDashboardData = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  // Start & End of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Start of 6 months ago
  const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    lifetimeSummaryResult,
    currentMonthSummaryResult,
    recentTransactions,
    expenseBreakdownResult,
    incomeBreakdownResult,
    sixMonthTrendResult,
    activeBudgetsDocs,
    activeGoalsDocs,
  ] = await Promise.all([
    // 1. Lifetime Totals
    Transaction.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
          totalCount: { $sum: 1 },
        },
      },
    ]),

    // 2. Current Month Totals
    Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
          totalCount: { $sum: 1 },
        },
      },
    ]),

    // 3. Recent 5 Transactions
    Transaction.find({ user: userObjectId })
      .populate('category', 'name type icon color isDefault')
      .sort({ date: -1, createdAt: -1 })
      .limit(5),

    // 4. Current Month Expense Category Breakdown
    Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          categoryId: '$_id',
          name: '$category.name',
          type: '$category.type',
          icon: '$category.icon',
          color: '$category.color',
          totalAmount: { $round: ['$totalAmount', 2] },
          count: 1,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),

    // 5. Current Month Income Category Breakdown
    Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          type: 'income',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          categoryId: '$_id',
          name: '$category.name',
          type: '$category.type',
          icon: '$category.icon',
          color: '$category.color',
          totalAmount: { $round: ['$totalAmount', 2] },
          count: 1,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),

    // 6. Last 6 Months Income vs Expense Trend
    Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          date: { $gte: startOfSixMonthsAgo, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          income: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          expense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // 7. Active Budgets
    Budget.find({
      user: userObjectId,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate('category', 'name type icon color isDefault'),

    // 8. Active Savings Goals
    Goal.find({
      user: userObjectId,
      status: 'in_progress',
    }).sort({ deadline: 1 }),
  ]);

  // Compute Lifetime Summary
  const lifetimeRaw = lifetimeSummaryResult[0] || { totalIncome: 0, totalExpense: 0, totalCount: 0 };
  const lifetimeIncome = Math.round(lifetimeRaw.totalIncome * 100) / 100;
  const lifetimeExpense = Math.round(lifetimeRaw.totalExpense * 100) / 100;
  const lifetimeBalance = Math.round((lifetimeIncome - lifetimeExpense) * 100) / 100;
  const savingsRate =
    lifetimeIncome > 0
      ? Math.max(0, Math.round(((lifetimeIncome - lifetimeExpense) / lifetimeIncome) * 10000) / 100)
      : 0;

  // Compute Current Month Summary
  const monthRaw = currentMonthSummaryResult[0] || { totalIncome: 0, totalExpense: 0, totalCount: 0 };
  const monthIncome = Math.round(monthRaw.totalIncome * 100) / 100;
  const monthExpense = Math.round(monthRaw.totalExpense * 100) / 100;
  const monthBalance = Math.round((monthIncome - monthExpense) * 100) / 100;

  // Calculate percentages for category breakdowns
  const expenseByCategory = expenseBreakdownResult.map((cat) => ({
    ...cat,
    percentage: monthExpense > 0 ? Math.round((cat.totalAmount / monthExpense) * 10000) / 100 : 0,
  }));

  const incomeByCategory = incomeBreakdownResult.map((cat) => ({
    ...cat,
    percentage: monthIncome > 0 ? Math.round((cat.totalAmount / monthIncome) * 10000) / 100 : 0,
  }));

  // Format 6 Months Trend (ensuring all 6 months exist in chronological order)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yr = d.getFullYear();
    const mo = d.getMonth() + 1;
    const monthKey = `${yr}-${String(mo).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    const matched = sixMonthTrendResult.find(
      (t) => t._id.year === yr && t._id.month === mo
    );

    const inc = matched ? Math.round(matched.income * 100) / 100 : 0;
    const exp = matched ? Math.round(matched.expense * 100) / 100 : 0;
    const net = Math.round((inc - exp) * 100) / 100;

    monthlyTrend.push({
      month: monthKey,
      monthLabel,
      income: inc,
      expense: exp,
      net,
    });
  }

  // Calculate dynamic usage for active budgets
  const activeBudgets = await Promise.all(
    activeBudgetsDocs.map(async (b) => {
      const usage = await calculateBudgetUsage(b, userId);
      return {
        _id: b._id,
        category: b.category,
        limit: b.limit,
        period: b.period,
        startDate: b.startDate,
        endDate: b.endDate,
        usage,
      };
    })
  );

  // Compute progress for active goals
  const activeGoals = activeGoalsDocs.map((g) => {
    const progress = calculateGoalProgress(g);
    return {
      _id: g._id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: g.deadline,
      status: g.status,
      notes: g.notes,
      progress,
    };
  });

  return {
    summary: {
      totalIncome: lifetimeIncome,
      totalExpense: lifetimeExpense,
      balance: lifetimeBalance,
      savingsRate,
      transactionCount: lifetimeRaw.totalCount,
    },
    currentMonth: {
      monthName: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      income: monthIncome,
      expense: monthExpense,
      balance: monthBalance,
      transactionCount: monthRaw.totalCount,
    },
    recentTransactions,
    expenseByCategory,
    incomeByCategory,
    activeBudgets,
    activeGoals,
    monthlyTrend,
  };
};

/**
 * Filtered report summary metrics
 */
const getReportSummary = async (userId, { startDate, endDate, category, type }) => {
  const match = buildDateMatch(userId, startDate, endDate, category, type);

  const aggregation = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        totalExpense: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
        incomeCount: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, 1, 0] },
        },
        expenseCount: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, 1, 0] },
        },
        totalCount: { $sum: 1 },
      },
    },
  ]);

  const raw = aggregation[0] || {
    totalIncome: 0,
    totalExpense: 0,
    incomeCount: 0,
    expenseCount: 0,
    totalCount: 0,
  };

  const totalIncome = Math.round(raw.totalIncome * 100) / 100;
  const totalExpense = Math.round(raw.totalExpense * 100) / 100;
  const balance = Math.round((totalIncome - totalExpense) * 100) / 100;

  // Calculate average daily spending if date range is given
  let dailyAverageExpense = null;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    dailyAverageExpense = Math.round((totalExpense / diffDays) * 100) / 100;
  }

  return {
    totalIncome,
    totalExpense,
    balance,
    transactionCount: raw.totalCount,
    incomeCount: raw.incomeCount,
    expenseCount: raw.expenseCount,
    dailyAverageExpense,
  };
};

/**
 * Category breakdown report
 */
const getCategoryBreakdown = async (userId, { startDate, endDate, type = 'expense' }) => {
  const match = buildDateMatch(userId, startDate, endDate, null, type);

  const breakdown = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        categoryId: '$_id',
        name: '$category.name',
        type: '$category.type',
        icon: '$category.icon',
        color: '$category.color',
        totalAmount: { $round: ['$totalAmount', 2] },
        count: 1,
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);

  const overallTotal = breakdown.reduce((sum, item) => sum + item.totalAmount, 0);

  const results = breakdown.map((item) => ({
    ...item,
    percentage: overallTotal > 0 ? Math.round((item.totalAmount / overallTotal) * 10000) / 100 : 0,
  }));

  return {
    type,
    totalAmount: Math.round(overallTotal * 100) / 100,
    categoryCount: results.length,
    categories: results,
  };
};

/**
 * Month-by-month financial report
 */
const getMonthlyReport = async (userId, { year, monthsCount = 6 }) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const targetYear = year ? parseInt(year, 10) : now.getFullYear();

  const match = {
    user: userObjectId,
    date: {
      $gte: new Date(targetYear, 0, 1),
      $lte: new Date(targetYear, 11, 31, 23, 59, 59, 999),
    },
  };

  const monthlyAgg = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $month: '$date' },
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        totalExpense: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const months = [];
  for (let m = 1; m <= 12; m++) {
    const found = monthlyAgg.find((item) => item._id === m);
    const inc = found ? Math.round(found.totalIncome * 100) / 100 : 0;
    const exp = found ? Math.round(found.totalExpense * 100) / 100 : 0;
    const net = Math.round((inc - exp) * 100) / 100;
    const d = new Date(targetYear, m - 1, 1);

    months.push({
      monthNumber: m,
      month: `${targetYear}-${String(m).padStart(2, '0')}`,
      monthName: d.toLocaleString('en-US', { month: 'long' }),
      income: inc,
      expense: exp,
      net,
      transactionCount: found ? found.count : 0,
    });
  }

  return {
    year: targetYear,
    months,
  };
};

/**
 * Trends report (daily or monthly time series)
 */
const getTrendsReport = async (userId, { startDate, endDate }) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const trendAgg = await Transaction.aggregate([
    {
      $match: {
        user: userObjectId,
        date: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' },
        },
        income: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        expense: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const trends = trendAgg.map((item) => {
    const inc = Math.round(item.income * 100) / 100;
    const exp = Math.round(item.expense * 100) / 100;
    return {
      date: item._id,
      income: inc,
      expense: exp,
      net: Math.round((inc - exp) * 100) / 100,
      count: item.count,
    };
  });

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    totalDataPoints: trends.length,
    trends,
  };
};

module.exports = {
  getDashboardData,
  getReportSummary,
  getCategoryBreakdown,
  getMonthlyReport,
  getTrendsReport,
};
