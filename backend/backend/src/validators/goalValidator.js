const { body, query } = require('express-validator');

const goalCreateRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Goal name is required')
    .isLength({ max: 100 })
    .withMessage('Goal name cannot exceed 100 characters'),

  body('targetAmount')
    .notEmpty()
    .withMessage('Target amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be a positive number greater than 0'),

  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current amount cannot be negative'),

  body('deadline')
    .notEmpty()
    .withMessage('Goal deadline is required')
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 date string (e.g. 2026-12-31)'),

  body('status')
    .optional()
    .isIn(['in_progress', 'completed', 'cancelled'])
    .withMessage("Goal status must be 'in_progress', 'completed', or 'cancelled'"),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

const goalUpdateRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Goal name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Goal name cannot exceed 100 characters'),

  body('targetAmount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be a positive number greater than 0'),

  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current amount cannot be negative'),

  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 date string'),

  body('status')
    .optional()
    .isIn(['in_progress', 'completed', 'cancelled'])
    .withMessage("Goal status must be 'in_progress', 'completed', or 'cancelled'"),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

const goalFilterRules = [
  query('status')
    .optional()
    .isIn(['in_progress', 'completed', 'cancelled'])
    .withMessage("Filter status must be 'in_progress', 'completed', or 'cancelled'"),
];

module.exports = {
  goalCreateRules,
  goalUpdateRules,
  goalFilterRules,
};
