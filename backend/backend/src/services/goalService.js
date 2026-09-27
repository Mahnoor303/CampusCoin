/**
 * Computes progress metrics for a savings goal
 * 
 * @param {Object} goal - Goal document or object
 * @returns {Object} Computed progress details
 */
const calculateGoalProgress = (goal) => {
  const targetAmount = Math.round(goal.targetAmount * 100) / 100;
  const currentAmount = Math.round(goal.currentAmount * 100) / 100;
  const remainingAmount = Math.max(0, Math.round((targetAmount - currentAmount) * 100) / 100);
  const percentageCompleted =
    targetAmount > 0
      ? Math.min(100, Math.round((currentAmount / targetAmount) * 10000) / 100)
      : 0;

  const isCompleted = currentAmount >= targetAmount || goal.status === 'completed';
  const now = new Date();
  const deadlineDate = new Date(goal.deadline);
  const isOverdue = now > deadlineDate && !isCompleted && goal.status !== 'cancelled';

  return {
    goalId: goal._id,
    name: goal.name,
    targetAmount,
    currentAmount,
    remainingAmount,
    percentageCompleted,
    deadline: goal.deadline,
    status: goal.status,
    isCompleted,
    isOverdue,
  };
};

module.exports = {
  calculateGoalProgress,
};
