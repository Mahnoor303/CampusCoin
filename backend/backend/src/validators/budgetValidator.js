const { body, query } = require('express-validator');

const budgetCreateRules = [
  body('category')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid Category ID format'),

  body('limit')
    .notEmpty()
    .withMessage('Budget limit amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Budget limit must be a positive number greater than 0'),

  body('period')
    .optional()
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage("Budget period must be 'weekly', 'monthly', or 'yearly'"),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date string (e.g. 2026-09-01)'),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date string (e.g. 2026-09-30)')
    .custom((endDate, { req }) => {
      if (req.body.startDate && new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be chronologically after the start date');
      }
      return true;
    }),

  body('alertThreshold')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Alert threshold percentage must be an integer between 1 and 100'),
];

const budgetUpdateRules = [
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid Category ID format'),

  body('limit')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Budget limit must be a positive number greater than 0'),

  body('period')
    .optional()
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage("Budget period must be 'weekly', 'monthly', or 'yearly'"),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date string'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date string')
    .custom((endDate, { req }) => {
      if (req.body.startDate && new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be chronologically after the start date');
      }
      return true;
    }),

  body('alertThreshold')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Alert threshold percentage must be an integer between 1 and 100'),
];

const budgetFilterRules = [
  query('period')
    .optional()
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage("Period filter must be 'weekly', 'monthly', or 'yearly'"),

  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID format'),

  query('activeOnly')
    .optional()
    .isBoolean()
    .withMessage('activeOnly must be a boolean'),
];

module.exports = {
  budgetCreateRules,
  budgetUpdateRules,
  budgetFilterRules,
};
