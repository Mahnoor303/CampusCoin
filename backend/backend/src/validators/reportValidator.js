const { query } = require('express-validator');

const reportFilterRules = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO date string (YYYY-MM-DD)'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO date string (YYYY-MM-DD)'),

  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage("Type filter must be 'income' or 'expense'"),

  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid Category ID format'),

  query('month')
    .optional()
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Month must be in YYYY-MM format (e.g. 2026-09)'),

  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be a 4-digit valid year'),
];

module.exports = {
  reportFilterRules,
};
