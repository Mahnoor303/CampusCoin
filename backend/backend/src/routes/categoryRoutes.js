const express = require('express');
const router = express.Router();

const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const {
  categoryCreateRules,
  categoryUpdateRules,
} = require('../validators/categoryValidator');

const { validate } = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { getDefaultCategories } = require('../services/categoryService');
const { sendSuccess } = require('../utils/apiResponse');

// Public route to get default categories
router.get('/defaults', async (req, res, next) => {
  try {
    const { type } = req.query;
    const categories = await getDefaultCategories(type);
    return sendSuccess(res, 200, 'Default categories retrieved', categories);
  } catch (error) {
    next(error);
  }
});

// Authenticated category routes
router.use(protect);

router.get('/', getCategories);
router.post('/', categoryCreateRules, validate, createCategory);
router.put('/:id', categoryUpdateRules, validate, updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
