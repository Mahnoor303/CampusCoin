const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @desc    Get all available categories (System defaults + user's custom categories)
 * @route   GET /api/categories
 * @access  Private
 */
const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;

    const query = {
      $or: [
        { isDefault: true, user: null },
        { user: req.user._id },
      ],
    };

    if (type) {
      if (!['income', 'expense'].includes(type)) {
        return sendError(res, 400, "Category filter type must be 'income' or 'expense'");
      }
      query.type = type;
    }

    const categories = await Category.find(query).sort({ isDefault: -1, type: 1, name: 1 });

    return sendSuccess(res, 200, 'Categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a custom category for authenticated user
 * @route   POST /api/categories
 * @access  Private
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;
    const trimmedName = name.trim();

    // Check if category with this name and type already exists for user or system default
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      type,
      $or: [
        { isDefault: true, user: null },
        { user: req.user._id },
      ],
    });

    if (existingCategory) {
      return sendError(
        res,
        400,
        `A category named '${trimmedName}' with type '${type}' already exists`
      );
    }

    const category = await Category.create({
      name: trimmedName,
      type,
      user: req.user._id,
      isDefault: false,
      icon: icon || (type === 'income' ? 'circle-dollar-sign' : 'tag'),
      color: color || (type === 'income' ? '#10B981' : '#6366F1'),
    });

    return sendSuccess(res, 201, 'Category created successfully', category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a custom category
 * @route   PUT /api/categories/:id
 * @access  Private
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    // System categories cannot be modified by regular users
    if (category.isDefault || !category.user) {
      if (req.user.role !== 'admin') {
        return sendError(res, 403, 'Cannot modify system default categories');
      }
    } else if (category.user.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied: You do not own this category');
    }

    const { name, type, icon, color } = req.body;

    // Check name collision if name or type is changing
    const newName = name ? name.trim() : category.name;
    const newType = type || category.type;

    if (name || type) {
      const duplicate = await Category.findOne({
        _id: { $ne: category._id },
        name: { $regex: new RegExp(`^${newName}$`, 'i') },
        type: newType,
        $or: [
          { isDefault: true, user: null },
          { user: req.user._id },
        ],
      });

      if (duplicate) {
        return sendError(
          res,
          400,
          `A category named '${newName}' with type '${newType}' already exists`
        );
      }
    }

    if (name) category.name = newName;
    if (type) category.type = newType;
    if (icon !== undefined) category.icon = icon;
    if (color !== undefined) category.color = color;

    await category.save();

    return sendSuccess(res, 200, 'Category updated successfully', category);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a custom category
 * @route   DELETE /api/categories/:id
 * @access  Private
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    // System categories cannot be deleted
    if (category.isDefault || !category.user) {
      return sendError(res, 403, 'System default categories cannot be deleted');
    }

    // Must be owner
    if (category.user.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Access denied: You do not own this category');
    }

    // Check if category is in use by transactions
    const transactionCount = await Transaction.countDocuments({
      user: req.user._id,
      category: category._id,
    });

    if (transactionCount > 0) {
      return sendError(
        res,
        400,
        `Cannot delete category: It is currently linked to ${transactionCount} transaction(s). Please reassign or delete those transactions first.`
      );
    }

    await Category.findByIdAndDelete(category._id);

    return sendSuccess(res, 200, 'Category deleted successfully', {
      deletedCategoryId: id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
