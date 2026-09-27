const Category = require('../models/Category');

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Allowance', type: 'income', icon: 'hand-coins', color: '#10B981' },
  { name: 'Part-time Job', type: 'income', icon: 'briefcase', color: '#06B6D4' },
  { name: 'Scholarship', type: 'income', icon: 'graduation-cap', color: '#8B5CF6' },
  { name: 'Gift', type: 'income', icon: 'gift', color: '#EC4899' },
  { name: 'Other', type: 'income', icon: 'circle-dollar-sign', color: '#6B7280' },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', type: 'expense', icon: 'utensils', color: '#F97316' },
  { name: 'Transport', type: 'expense', icon: 'bus', color: '#3B82F6' },
  { name: 'Hostel/Rent', type: 'expense', icon: 'home', color: '#6366F1' },
  { name: 'Academics', type: 'expense', icon: 'book-open', color: '#14B8A6' },
  { name: 'Subscriptions', type: 'expense', icon: 'credit-card', color: '#A855F7' },
  { name: 'Entertainment', type: 'expense', icon: 'film', color: '#F43F5E' },
  { name: 'Miscellaneous', type: 'expense', icon: 'more-horizontal', color: '#9CA3AF' },
];

/**
 * Idempotently seed default/system categories into the database.
 * Avoids duplicates on repeated server starts using bulkWrite upserts.
 * 
 * @returns {Promise<{ created: number, existing: number, total: number }>}
 */
const seedDefaultCategories = async () => {
  const allDefaults = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];

  const operations = allDefaults.map((cat) => ({
    updateOne: {
      filter: {
        name: cat.name,
        type: cat.type,
        isDefault: true,
        user: null,
      },
      update: {
        $setOnInsert: {
          name: cat.name,
          type: cat.type,
          isDefault: true,
          user: null,
          icon: cat.icon,
          color: cat.color,
        },
      },
      upsert: true,
    },
  }));

  const result = await Category.bulkWrite(operations);
  const total = await Category.countDocuments({ isDefault: true, user: null });

  console.log(
    `[CategoryService] Default categories verified. Inserted: ${result.upsertedCount}, Total active defaults: ${total}`
  );

  return {
    created: result.upsertedCount,
    total,
  };
};

/**
 * Fetch all system default categories, optionally filtered by type
 * @param {string} [type] - Optional 'income' or 'expense'
 */
const getDefaultCategories = async (type = null) => {
  const query = { isDefault: true, user: null };
  if (type) {
    query.type = type;
  }
  return Category.find(query).sort({ type: 1, name: 1 });
};

module.exports = {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  seedDefaultCategories,
  getDefaultCategories,
};
