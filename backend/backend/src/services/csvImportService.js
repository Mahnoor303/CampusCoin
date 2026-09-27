const { parse } = require('csv-parse/sync');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

/**
 * Parses and processes a CSV string into transactions for a specific user
 * 
 * @param {string} csvContent - Raw CSV text
 * @param {string|mongoose.Types.ObjectId} userId - Current authenticated user ID
 * @returns {Promise<{ totalRows: number, importedRows: number, failedRows: number, errors: Array<{ row: number, reason: string }> }>}
 */
const processTransactionsCSV = async (csvContent, userId) => {
  if (!csvContent || csvContent.trim() === '') {
    const error = new Error('Empty CSV data provided');
    error.statusCode = 400;
    throw error;
  }

  let records;
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    const error = new Error(`Malformed CSV format: ${err.message}`);
    error.statusCode = 400;
    throw error;
  }

  if (!records || records.length === 0) {
    return {
      totalRows: 0,
      importedRows: 0,
      failedRows: 0,
      errors: [],
    };
  }

  // Fetch all accessible categories (System defaults + user's custom categories)
  const accessibleCategories = await Category.find({
    $or: [
      { isDefault: true, user: null },
      { user: userId },
    ],
  });

  // Build lookup maps for fast matching
  const categoryByNameAndType = new Map();
  const categoryById = new Map();

  accessibleCategories.forEach((cat) => {
    categoryByNameAndType.set(`${cat.name.toLowerCase()}_${cat.type.toLowerCase()}`, cat);
    categoryByNameAndType.set(cat.name.toLowerCase(), cat); // fallback for name only
    categoryById.set(cat._id.toString(), cat);
  });

  const validTransactions = [];
  const errors = [];

  records.forEach((record, idx) => {
    const rowNum = idx + 1; // 1-indexed data row

    // Normalize keys to lowercase for flexible header handling
    const normalized = {};
    Object.keys(record).forEach((key) => {
      normalized[key.trim().toLowerCase()] = record[key];
    });

    const typeRaw = normalized.type || '';
    const type = typeRaw.toLowerCase().trim();
    const amountRaw = normalized.amount;
    const categoryRaw = normalized.category || normalized.categoryname || normalized.category_name || '';
    const titleRaw = normalized.title || normalized.name || normalized.description || '';
    const description = normalized.description || '';
    const dateRaw = normalized.date;
    const notes = normalized.notes || '';

    // 1. Validate Type
    if (!type || !['income', 'expense'].includes(type)) {
      errors.push({
        row: rowNum,
        reason: `Invalid transaction type '${typeRaw}'. Must be 'income' or 'expense'.`,
      });
      return;
    }

    // 2. Validate Amount
    const amount = parseFloat(amountRaw);
    if (isNaN(amount) || amount <= 0) {
      errors.push({
        row: rowNum,
        reason: `Invalid amount '${amountRaw}'. Amount must be a positive number greater than 0.`,
      });
      return;
    }

    // 3. Validate Date
    let date = new Date();
    if (dateRaw && dateRaw.trim() !== '') {
      const parsedDate = new Date(dateRaw);
      if (isNaN(parsedDate.getTime())) {
        errors.push({
          row: rowNum,
          reason: `Invalid date format '${dateRaw}'. Please provide a valid date (e.g. YYYY-MM-DD).`,
        });
        return;
      }
      date = parsedDate;
    }

    // 4. Validate Title
    const title = titleRaw.trim() !== '' ? titleRaw.trim() : categoryRaw.trim();
    if (!title) {
      errors.push({
        row: rowNum,
        reason: 'Title or description is required.',
      });
      return;
    }

    // 5. Validate Category
    if (!categoryRaw || categoryRaw.trim() === '') {
      errors.push({
        row: rowNum,
        reason: 'Category is required.',
      });
      return;
    }

    const trimmedCat = categoryRaw.trim();
    let matchedCategory = null;

    // Try ID lookup
    if (mongoose.Types.ObjectId.isValid(trimmedCat)) {
      matchedCategory = categoryById.get(trimmedCat);
    }

    // Try name + type lookup
    if (!matchedCategory) {
      matchedCategory = categoryByNameAndType.get(`${trimmedCat.toLowerCase()}_${type}`);
    }

    // Try name-only lookup
    if (!matchedCategory) {
      matchedCategory = categoryByNameAndType.get(trimmedCat.toLowerCase());
    }

    if (!matchedCategory) {
      errors.push({
        row: rowNum,
        reason: `Category '${trimmedCat}' does not exist or is inaccessible.`,
      });
      return;
    }

    // Check category type matches transaction type
    if (matchedCategory.type !== type) {
      errors.push({
        row: rowNum,
        reason: `Category '${matchedCategory.name}' is an ${matchedCategory.type} category, but row transaction type is ${type}.`,
      });
      return;
    }

    validTransactions.push({
      user: userId,
      type,
      amount,
      category: matchedCategory._id,
      title: title.substring(0, 100),
      description: description.substring(0, 500),
      date,
      notes: notes.substring(0, 1000),
      recurring: { isRecurring: false, frequency: 'none', nextDueDate: null },
    });
  });

  if (validTransactions.length > 0) {
    await Transaction.insertMany(validTransactions);
  }

  return {
    totalRows: records.length,
    importedRows: validTransactions.length,
    failedRows: errors.length,
    errors,
  };
};

module.exports = {
  processTransactionsCSV,
};
