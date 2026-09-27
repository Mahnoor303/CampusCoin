const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Budget must belong to a user'],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Budget must be linked to a category'],
      index: true,
    },
    limit: {
      type: Number,
      required: [true, 'Budget limit is required'],
      min: [0, 'Budget limit cannot be negative'],
    },
    period: {
      type: String,
      enum: {
        values: ['weekly', 'monthly', 'yearly'],
        message: '{VALUE} is not a valid budget period',
      },
      default: 'monthly',
    },
    startDate: {
      type: Date,
      required: [true, 'Budget start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Budget end date is required'],
    },
    alertThreshold: {
      type: Number,
      default: 80, // Percentage (e.g. 80%)
      min: [1, 'Alert threshold must be at least 1%'],
      max: [100, 'Alert threshold cannot exceed 100%'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user's budget per category and timeframe
budgetSchema.index({ user: 1, category: 1, startDate: 1, endDate: 1 });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
