const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Goal must belong to a user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      maxlength: [100, 'Goal name cannot exceed 100 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [0.01, 'Target amount must be greater than zero'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative'],
    },
    deadline: {
      type: Date,
      required: [true, 'Target deadline is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['in_progress', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid goal status',
      },
      default: 'in_progress',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, deadline: 1 });

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
