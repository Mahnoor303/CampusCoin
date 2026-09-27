const { body, query } = require('express-validator');

const transactionCreateRules = [
  body('type')
    .notEmpty()
    .withMessage('Transaction type is required')
    .isIn(['income', 'expense'])
    .withMessage("Transaction type must be either 'income' or 'expense'"),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),

  body('category')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid Category ID format'),

  body('title')
    .trim()
    .notEmpty()
    .withMessage('Transaction title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date string (e.g. 2026-09-25)'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),

  body('recurring.isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),

  body('recurring.frequency')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly', 'yearly'])
    .withMessage("Recurring frequency must be 'none', 'daily', 'weekly', 'monthly', or 'yearly'"),

  body('recurring.nextDueDate')
    .optional()
    .isISO8601()
    .withMessage('Next due date must be a valid date'),
];

const transactionUpdateRules = [
  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage("Transaction type must be either 'income' or 'expense'"),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),

  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid Category ID format'),

  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date string'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),

  body('recurring.isRecurring')
    .optional()
    .isBoolean(),

  body('recurring.frequency')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly', 'yearly'])
    .withMessage("Recurring frequency must be 'none', 'daily', 'weekly', 'monthly', or 'yearly'"),

  body('recurring.nextDueDate')
    .optional()
    .isISO8601()
    .withMessage('Next due date must be a valid date'),
];

const transactionFilterRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage("Filter type must be 'income' or 'expense'"),

  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category filter ID'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid date format (YYYY-MM-DD)'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid date format (YYYY-MM-DD)'),
];

module.exports = {
  transactionCreateRules,
  transactionUpdateRules,
  transactionFilterRules,
};
