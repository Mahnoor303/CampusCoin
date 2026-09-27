const { body } = require('express-validator');

const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),

  body('academicYear')
    .optional()
    .trim()
    .isString(),

  body('monthlyAllowanceBaseline')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly allowance baseline must be a non-negative number'),

  body('monthlySavingsGoal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly savings goal must be a non-negative number'),

  body('avatar')
    .optional()
    .isString(),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),

  body('phone')
    .optional()
    .trim()
    .isString(),

  // Enforce security rule: users cannot change their role via profile update
  body('role')
    .custom((value) => {
      if (value !== undefined) {
        throw new Error('Modifying user role is not permitted through this endpoint');
      }
      return true;
    }),

  // Protect sensitive fields
  body('password')
    .custom((value) => {
      if (value !== undefined) {
        throw new Error('Password cannot be changed via profile update');
      }
      return true;
    }),
];

module.exports = {
  updateProfileRules,
};
