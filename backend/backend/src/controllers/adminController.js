const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const Insight = require("../models/Insight");
const { sendSuccess, sendError } = require("../utils/apiResponse");

/**
 * @desc  Platform-wide statistics for admin overview
 * @route GET /api/admin/dashboard
 * @access Private/Admin
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      totalStudents,
      totalAdmins,
      newUsersThisMonth,
      totalTransactions,
      transactionsThisMonth,
      totalBudgets,
      totalGoals,
      totalInsights,
      platformTotals,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Transaction.countDocuments({}),
      Transaction.countDocuments({ date: { $gte: startOfMonth } }),
      Budget.countDocuments({}),
      Goal.countDocuments({}),
      Insight.countDocuments({}),
      Transaction.aggregate([
        {
          $group: {
            _id: null,
            totalVolume: { $sum: "$amount" },
            totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
            totalExpense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          },
        },
      ]),
    ]);

    const pt =
      platformTotals.length > 0
        ? platformTotals[0]
        : { totalVolume: 0, totalIncome: 0, totalExpense: 0 };

    return sendSuccess(res, 200, "Admin dashboard data retrieved", {
      users: {
        total: totalUsers,
        active: activeUsers,
        students: totalStudents,
        admins: totalAdmins,
        newThisMonth: newUsersThisMonth,
      },
      transactions: { total: totalTransactions, thisMonth: transactionsThisMonth },
      budgets: { total: totalBudgets },
      goals: { total: totalGoals },
      insights: { total: totalInsights },
      platformFinancials: {
        totalVolume: Math.round(pt.totalVolume * 100) / 100,
        totalIncome: Math.round(pt.totalIncome * 100) / 100,
        totalExpense: Math.round(pt.totalExpense * 100) / 100,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  List all users (paginated, searchable). Passwords never returned.
 * @route GET /api/admin/users
 * @access Private/Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      const re = new RegExp(search, "i");
      query.$or = [{ name: re }, { email: re }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      200,
      "Users retrieved",
      { users },
      {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      }
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Get a single user profile. Password never returned.
 * @route GET /api/admin/users/:id
 * @access Private/Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password -__v");
    if (!user) return sendError(res, 404, "User not found");
    return sendSuccess(res, 200, "User retrieved", { user });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Change a user's role. Admin cannot demote themselves.
 * @route PATCH /api/admin/users/:id/role
 * @access Private/Admin
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["student", "admin"].includes(role)) {
      return sendError(res, 400, "Invalid role. Allowed values: student, admin");
    }
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 400, "You cannot change your own role");
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!user) return sendError(res, 404, "User not found");
    return sendSuccess(res, 200, "User role updated", { user });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Hard-delete a user and all their associated data.
 *        Admin cannot delete themselves.
 * @route DELETE /api/admin/users/:id
 * @access Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 400, "You cannot delete your own account");
    }
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, "User not found");

    const uid = user._id;
    await Promise.all([
      Transaction.deleteMany({ user: uid }),
      Budget.deleteMany({ user: uid }),
      Goal.deleteMany({ user: uid }),
      Insight.deleteMany({ user: uid }),
      User.findByIdAndDelete(uid),
    ]);

    return sendSuccess(res, 200, "User and all associated data deleted", {
      deletedUserId: uid,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Aggregated platform statistics including monthly trend
 * @route GET /api/admin/statistics
 * @access Private/Admin
 */
const getPlatformStatistics = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months, 10) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (months - 1));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const [userGrowth, transactionTrend, categoryUsage] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Transaction.aggregate([
        { $match: { date: { $gte: startDate } } },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" }, type: "$type" },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Transaction.aggregate([
        { $match: { type: "expense" } },
        { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "cat",
          },
        },
        { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ["$cat.name", "Uncategorised"] },
            total: { $round: ["$total", 2] },
            count: 1,
          },
        },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return sendSuccess(res, 200, "Platform statistics retrieved", {
      userGrowth,
      transactionTrend,
      categoryUsage,
      periodMonths: months,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Activate or deactivate a user account.
 *        Admin cannot deactivate themselves.
 * @route PATCH /api/admin/users/:id/status
 * @access Private/Admin
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return sendError(res, 400, "isActive must be a boolean (true or false)");
    }
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 400, "You cannot deactivate your own account");
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!user) return sendError(res, 404, "User not found");
    return sendSuccess(res, 200, `User account ${isActive ? "activated" : "deactivated"}`, { user });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  List a specific user's transactions (admin inspection view)
 * @route GET /api/admin/users/:id/transactions
 * @access Private/Admin
 */
const getUserTransactions = async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;
    const transactions = await Transaction.find({ user: req.params.id })
      .populate("category", "name type icon color")
      .sort({ date: -1 })
      .limit(Math.min(200, Math.max(1, parseInt(limit, 10) || 100)));
    return sendSuccess(res, 200, "User transactions retrieved", transactions);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminDashboard,
  getAllUsers,
  getUserById,
  getUserTransactions,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getPlatformStatistics,
};
