const { body } = require('express-validator');

const categoryCreateRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),

  body('type')
    .notEmpty()
    .withMessage('Category type is required')
    .isIn(['income', 'expense'])
    .withMessage("Category type must be either 'income' or 'expense'"),

  body('icon')
    .optional()
    .trim()
    .isString(),

  body('color')
    .optional()
    .trim()
    .isString()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex code (e.g. #EF4444)'),
];

const categoryUpdateRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),

  body('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage("Category type must be either 'income' or 'expense'"),

  body('icon')
    .optional()
    .trim()
    .isString(),

  body('color')
    .optional()
    .trim()
    .isString()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex code (e.g. #EF4444)'),
];

module.exports = {
  categoryCreateRules,
  categoryUpdateRules,
};
