const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    type: {
      type: String,
      required: [true, 'Please specify category type (income or expense)'],
      enum: {
        values: ['income', 'expense'],
        message: '{VALUE} is not a valid category type. Must be income or expense',
      },
    },
    // Null for global/system default categories; references user for custom categories
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    icon: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate category names per user or system default
categorySchema.index({ name: 1, type: 1, user: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
