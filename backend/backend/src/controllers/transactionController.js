const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { assertOwnership } = require('../utils/ownershipChecker');

/**
 * Helper to validate category existence, accessibility, and type matching
 */
const validateCategoryForTransaction = async (categoryId, transactionType, userId) => {
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

  if (category.type !== transactionType) {
    const error = new Error(
      `Category type mismatch: Category '${category.name}' is an ${category.type} category, but transaction type is ${transactionType}`
    );
    error.statusCode = 400;
    throw error;
  }

  return category;
};

/**
 * @desc    Create a new transaction
 * @route   POST /api/transactions
 * @access  Private
 */
const createTransaction = async (req, res, next) => {
  try {
    const {
      type,
      amount,
      category,
      title,
      description,
      date,
      notes,
      recurring,
      aiSuggestedCategory,
    } = req.body;

    // Validate category and ensure category.type === transaction.type
    await validateCategoryForTransaction(category, type, req.user._id);

    const transactionData = {
      user: req.user._id,
      type,
      amount: parseFloat(amount),
      category,
      title: title.trim(),
      description: description ? description.trim() : '',
      date: date ? new Date(date) : new Date(),
      notes: notes ? notes.trim() : '',
      recurring: recurring || { isRecurring: false, frequency: 'none', nextDueDate: null },
    };

    if (aiSuggestedCategory && mongoose.Types.ObjectId.isValid(aiSuggestedCategory)) {
      transactionData.aiSuggestedCategory = aiSuggestedCategory;
    }

    const transaction = await Transaction.create(transactionData);
    await transaction.populate('category', 'name type icon color isDefault');

    return sendSuccess(res, 201, 'Transaction recorded successfully', transaction);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get transactions for authenticated user with filtering, pagination, and sorting
 * @route   GET /api/transactions
 * @access  Private
 */
const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      startDate,
      endDate,
      search,
      sort = '-date',
      isRecurring,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Strict multi-tenant isolation: always match req.user._id
    const query = { user: req.user._id };

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { notes: searchRegex },
      ];
    }

    if (isRecurring !== undefined) {
      query['recurring.isRecurring'] = isRecurring === 'true';
    }

    // Supported sort keys
    const allowedSortFields = ['date', '-date', 'amount', '-amount', 'createdAt', '-createdAt'];
    const sortField = allowedSortFields.includes(sort) ? sort : '-date';

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('category', 'name type icon color isDefault')
        .sort(sortField)
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return sendSuccess(res, 200, 'Transactions retrieved successfully', transactions, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid transaction identifier format');
    }

    const transaction = await Transaction.findById(id).populate(
      'category',
      'name type icon color isDefault'
    );

    if (!transaction) {
      return sendError(res, 404, 'Transaction not found');
    }

    // Strict ownership verification
    assertOwnership(transaction.user, req.user, 'Transaction');

    return sendSuccess(res, 200, 'Transaction retrieved successfully', transaction);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a transaction
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid transaction identifier format');
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return sendError(res, 404, 'Transaction not found');
    }

    // Strict ownership verification
    assertOwnership(transaction.user, req.user, 'Transaction');

    const {
      type,
      amount,
      category,
      title,
      description,
      date,
      notes,
      recurring,
    } = req.body;

    const targetType = type || transaction.type;
    const targetCategory = category || transaction.category;

    // If category or type is changed, revalidate category matching
    if (category || type) {
      await validateCategoryForTransaction(targetCategory, targetType, req.user._id);
    }

    if (type) transaction.type = targetType;
    if (amount !== undefined) transaction.amount = parseFloat(amount);
    if (category) transaction.category = targetCategory;
    if (title) transaction.title = title.trim();
    if (description !== undefined) transaction.description = description ? description.trim() : '';
    if (date) transaction.date = new Date(date);
    if (notes !== undefined) transaction.notes = notes ? notes.trim() : '';
    if (recurring) transaction.recurring = recurring;

    await transaction.save();
    await transaction.populate('category', 'name type icon color isDefault');

    return sendSuccess(res, 200, 'Transaction updated successfully', transaction);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a transaction
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid transaction identifier format');
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return sendError(res, 404, 'Transaction not found');
    }

    // Strict ownership verification
    assertOwnership(transaction.user, req.user, 'Transaction');

    await Transaction.findByIdAndDelete(transaction._id);

    return sendSuccess(res, 200, 'Transaction deleted successfully', {
      deletedTransactionId: id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregated transaction statistics (total income, expense, balance, count)
 * @route   GET /api/transactions/summary
 * @access  Private
 */
const getTransactionSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Admins may summarise any user's data via ?userId= (platform-wide analytics).
    // Students are always scoped to their own data.
    const requestedUserId =
      req.user.role === 'admin' && req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)
        ? req.query.userId
        : req.user._id;

    const matchStage = {
      user: new mongoose.Types.ObjectId(requestedUserId),
    };

    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) {
        matchStage.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.date.$lte = end;
      }
    }

    const [summaryResult, categoryBreakdown] = await Promise.all([
      // Overall totals pipeline
      Transaction.aggregate([
        { $match: matchStage },
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
      ]),

      // Category breakdown pipeline
      Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$category',
            type: { $first: '$type' },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryDetails',
          },
        },
        { $unwind: '$categoryDetails' },
        {
          $project: {
            _id: 1,
            categoryId: '$_id',
            categoryName: '$categoryDetails.name',
            type: 1,
            icon: '$categoryDetails.icon',
            color: '$categoryDetails.color',
            totalAmount: { $round: ['$totalAmount', 2] },
            count: 1,
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),
    ]);

    const summary = summaryResult[0] || {
      totalIncome: 0,
      totalExpense: 0,
      incomeCount: 0,
      expenseCount: 0,
      totalCount: 0,
    };

    const totalIncome = Math.round(summary.totalIncome * 100) / 100;
    const totalExpense = Math.round(summary.totalExpense * 100) / 100;
    const balance = Math.round((totalIncome - totalExpense) * 100) / 100;

    return sendSuccess(res, 200, 'Transaction summary retrieved successfully', {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: summary.totalCount,
      incomeCount: summary.incomeCount,
      expenseCount: summary.expenseCount,
      categoryBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
};
