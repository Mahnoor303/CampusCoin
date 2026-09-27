const express = require('express');
const router = express.Router();

const {
  createBudget,
  getBudgets,
  getBudgetById,
  getBudgetUsage,
  updateBudget,
  deleteBudget,
} = require('../controllers/budgetController');

const {
  budgetCreateRules,
  budgetUpdateRules,
  budgetFilterRules,
} = require('../validators/budgetValidator');

const { validate } = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', budgetFilterRules, validate, getBudgets);
router.post('/', budgetCreateRules, validate, createBudget);
router.get('/:id', getBudgetById);
router.get('/:id/usage', getBudgetUsage);
router.put('/:id', budgetUpdateRules, validate, updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
