const express = require('express');
const router = express.Router();

const {
  createGoal,
  getGoals,
  getGoalById,
  getGoalProgress,
  updateGoal,
  deleteGoal,
} = require('../controllers/goalController');

const {
  goalCreateRules,
  goalUpdateRules,
  goalFilterRules,
} = require('../validators/goalValidator');

const { validate } = require('../middleware/validateMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', goalFilterRules, validate, getGoals);
router.post('/', goalCreateRules, validate, createGoal);
router.get('/:id', getGoalById);
router.get('/:id/progress', getGoalProgress);
router.put('/:id', goalUpdateRules, validate, updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
