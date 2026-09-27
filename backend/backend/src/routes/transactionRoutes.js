const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
} = require('../controllers/transactionController');

const {
  transactionCreateRules,
  transactionUpdateRules,
  transactionFilterRules,
} = require('../validators/transactionValidator');

const { validate } = require('../middleware/validateMiddleware');

// All transaction endpoints require authentication
router.use(protect);

// Summary & Aggregation route
router.get('/summary', getTransactionSummary);
router.get('/admin/summary', protect, authorize('admin'), getTransactionSummary);

// Collection routes
router.get('/', transactionFilterRules, validate, getTransactions);
router.post('/', transactionCreateRules, validate, createTransaction);

// Item routes
router.get('/:id', getTransactionById);
router.put('/:id', transactionUpdateRules, validate, updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
