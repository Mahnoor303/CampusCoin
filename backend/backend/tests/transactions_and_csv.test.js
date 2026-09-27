const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Transaction = require('../src/models/Transaction');
const { seedDefaultCategories } = require('../src/services/categoryService');

describe('CampusCoin Backend Step 2 — Transactions, Categories & CSV Import Suite', () => {
  let userAToken;
  let userAId;
  let userBToken;
  let userBId;

  let foodCategoryId;
  let allowanceCategoryId;
  let userACustomCategoryId;
  let userATx1Id;
  let userATx2Id;

  const testUserA = {
    name: 'Alex Rivera',
    email: 'alex.rivera@university.edu',
    password: 'password123',
    academicYear: '1st Year',
  };

  const testUserB = {
    name: 'Bella Thorne',
    email: 'bella.thorne@university.edu',
    password: 'password123',
    academicYear: '2nd Year',
  };

  beforeAll(async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campuscoin_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
    }

    // Clean up test users and seed categories
    await User.deleteMany({ email: { $in: [testUserA.email, testUserB.email] } });
    await seedDefaultCategories();

    // Register User A
    const resA = await request(app).post('/api/auth/register').send(testUserA);
    userAToken = resA.body.data.token;
    userAId = resA.body.data.user._id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send(testUserB);
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user._id;

    // Fetch default categories to reference in tests
    const foodCat = await Category.findOne({ name: 'Food', type: 'expense', isDefault: true });
    foodCategoryId = foodCat._id.toString();

    const allowanceCat = await Category.findOne({ name: 'Allowance', type: 'income', isDefault: true });
    allowanceCategoryId = allowanceCat._id.toString();
  });

  afterAll(async () => {
    // Cleanup transactions and users created in tests
    if (userAId) {
      await Transaction.deleteMany({ user: userAId });
      await Category.deleteMany({ user: userAId });
      await User.findByIdAndDelete(userAId);
    }
    if (userBId) {
      await Transaction.deleteMany({ user: userBId });
      await Category.deleteMany({ user: userBId });
      await User.findByIdAndDelete(userBId);
    }
    await mongoose.connection.close();
  });

  // =========================================================================
  // 1. CATEGORY MANAGEMENT (Step 2.1)
  // =========================================================================
  describe('1. Category Management APIs', () => {
    it('GET /api/categories should return system defaults for authenticated user', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(12);
    });

    it('POST /api/categories should create a custom category for User A', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Campus Gym',
          type: 'expense',
          icon: 'dumbbell',
          color: '#3B82F6',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Campus Gym');
      expect(res.body.data.type).toBe('expense');
      expect(res.body.data.user).toBe(userAId);
      expect(res.body.data.isDefault).toBe(false);

      userACustomCategoryId = res.body.data._id;
    });

    it('POST /api/categories should reject duplicate category name and type', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Campus Gym',
          type: 'expense',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('POST /api/categories should reject invalid category type', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Invalid Type Cat',
          type: 'invalid_type',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/categories/:id should reject normal user attempting to modify system default category', async () => {
      const res = await request(app)
        .put(`/api/categories/${foodCategoryId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Tampered Food' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot modify system default/i);
    });

    it('PUT /api/categories/:id should reject User B modifying User A category', async () => {
      const res = await request(app)
        .put(`/api/categories/${userACustomCategoryId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ name: 'Hacked Gym' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/categories/:id should allow User A to update their own category', async () => {
      const res = await request(app)
        .put(`/api/categories/${userACustomCategoryId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Campus Gym & Fitness', color: '#10B981' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Campus Gym & Fitness');
      expect(res.body.data.color).toBe('#10B981');
    });

    it('DELETE /api/categories/:id should reject deleting system default category', async () => {
      const res = await request(app)
        .delete(`/api/categories/${foodCategoryId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot be deleted/i);
    });
  });

  // =========================================================================
  // 2. TRANSACTION CREATION & VALIDATION (Step 2.2 & 2.3)
  // =========================================================================
  describe('2. Transaction Creation & Validation', () => {
    it('POST /api/transactions should create a valid Income transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          type: 'income',
          amount: 500,
          category: allowanceCategoryId,
          title: 'Monthly Parent Allowance',
          description: 'Allowance for September',
          date: '2026-09-01T10:00:00.000Z',
          recurring: {
            isRecurring: true,
            frequency: 'monthly',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(500);
      expect(res.body.data.type).toBe('income');
      expect(res.body.data.user).toBe(userAId);
      expect(res.body.data.category.name).toBe('Allowance');
      expect(res.body.data.recurring.isRecurring).toBe(true);

      userATx1Id = res.body.data._id;
    });

    it('POST /api/transactions should create a valid Expense transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          type: 'expense',
          amount: 25.5,
          category: foodCategoryId,
          title: 'Campus Canteen Lunch',
          description: 'Meal with classmates',
          date: '2026-09-05T12:30:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(25.5);
      expect(res.body.data.type).toBe('expense');
      expect(res.body.data.category.name).toBe('Food');

      userATx2Id = res.body.data._id;
    });

    it('POST /api/transactions should create expense with user custom category', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          type: 'expense',
          amount: 40,
          category: userACustomCategoryId,
          title: 'Monthly Gym Pass',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.category.name).toBe('Campus Gym & Fitness');
    });

    it('POST /api/transactions should REJECT expense transaction using income category (Type Mismatch)', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          type: 'expense',
          amount: 15,
          category: allowanceCategoryId, // Allowance is income!
          title: 'Invalid Expense',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/mismatch/i);
    });

    it('POST /api/transactions should REJECT income transaction using expense category (Type Mismatch)', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          type: 'income',
          amount: 100,
          category: foodCategoryId, // Food is expense!
          title: 'Invalid Income',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/mismatch/i);
    });

    it('POST /api/transactions should REJECT transaction with negative or zero amount', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          type: 'expense',
          amount: -10,
          category: foodCategoryId,
          title: 'Negative Amount',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/transactions should REJECT non-existent category ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          type: 'expense',
          amount: 10,
          category: fakeId,
          title: 'Fake Category',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 3. TRANSACTION RETRIEVAL, FILTERING & PAGINATION (Step 2.4)
  // =========================================================================
  describe('3. Transaction Retrieval, Filtering & Pagination', () => {
    it('GET /api/transactions should retrieve paginated list for User A', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(3);
    });

    it('GET /api/transactions with limit=2 should return only 2 records with pagination meta', async () => {
      const res = await request(app)
        .get('/api/transactions?page=1&limit=2')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.limit).toBe(2);
      expect(res.body.meta.hasNextPage).toBe(true);
    });

    it('GET /api/transactions?type=income should filter by income only', async () => {
      const res = await request(app)
        .get('/api/transactions?type=income')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((tx) => tx.type === 'income')).toBe(true);
    });

    it('GET /api/transactions?type=expense should filter by expense only', async () => {
      const res = await request(app)
        .get('/api/transactions?type=expense')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((tx) => tx.type === 'expense')).toBe(true);
    });

    it('GET /api/transactions?search=canteen should filter by keyword search', async () => {
      const res = await request(app)
        .get('/api/transactions?search=canteen')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toMatch(/canteen/i);
    });

    it('GET /api/transactions?startDate=2026-09-02 should filter by date range', async () => {
      const res = await request(app)
        .get('/api/transactions?startDate=2026-09-02&endDate=2026-09-30')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      // The Sept 1 transaction should not be in this range
      expect(res.body.data.every((tx) => new Date(tx.date) >= new Date('2026-09-02'))).toBe(true);
    });
  });

  // =========================================================================
  // 4. MULTI-TENANT OWNERSHIP PROTECTION (Step 2.2)
  // =========================================================================
  describe('4. Strict Multi-Tenant Data Isolation', () => {
    it('User B GET /api/transactions should NOT see any transactions belonging to User A', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.meta.total).toBe(0);
    });

    it('User B GET /api/transactions/:id should be FORBIDDEN (403) from accessing User A transaction', async () => {
      const res = await request(app)
        .get(`/api/transactions/${userATx1Id}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/access denied/i);
    });

    it('User B PUT /api/transactions/:id should be FORBIDDEN (403) from updating User A transaction', async () => {
      const res = await request(app)
        .put(`/api/transactions/${userATx1Id}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ amount: 9999 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify DB unchanged
      const tx = await Transaction.findById(userATx1Id);
      expect(tx.amount).toBe(500);
    });

    it('User B DELETE /api/transactions/:id should be FORBIDDEN (403) from deleting User A transaction', async () => {
      const res = await request(app)
        .delete(`/api/transactions/${userATx1Id}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify DB still contains transaction
      const tx = await Transaction.findById(userATx1Id);
      expect(tx).toBeDefined();
    });
  });

  // =========================================================================
  // 5. TRANSACTION UPDATE, GET BY ID & DELETE
  // =========================================================================
  describe('5. Transaction Item Operations (GET, PUT, DELETE)', () => {
    it('GET /api/transactions/:id should retrieve single transaction for owner', async () => {
      const res = await request(app)
        .get(`/api/transactions/${userATx2Id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(userATx2Id);
      expect(res.body.data.amount).toBe(25.5);
    });

    it('PUT /api/transactions/:id should update transaction details', async () => {
      const res = await request(app)
        .put(`/api/transactions/${userATx2Id}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          amount: 30,
          title: 'Campus Canteen Feast',
          notes: 'Added dessert',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(30);
      expect(res.body.data.title).toBe('Campus Canteen Feast');
      expect(res.body.data.notes).toBe('Added dessert');
    });

    it('PUT /api/transactions/:id should reject update if new category mismatches type', async () => {
      const res = await request(app)
        .put(`/api/transactions/${userATx2Id}`) // Expense transaction
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          category: allowanceCategoryId, // Income category
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/mismatch/i);
    });

    it('DELETE /api/categories/:id should prevent deleting category in use by transactions', async () => {
      const res = await request(app)
        .delete(`/api/categories/${userACustomCategoryId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/linked to/i);
    });

    it('DELETE /api/transactions/:id should delete transaction for owner', async () => {
      const res = await request(app)
        .delete(`/api/transactions/${userATx2Id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deletedTransactionId).toBe(userATx2Id);

      // Verify deletion in DB
      const check = await Transaction.findById(userATx2Id);
      expect(check).toBeNull();
    });
  });

  // =========================================================================
  // 6. TRANSACTION AGGREGATION / SUMMARY (Step 2.6)
  // =========================================================================
  describe('6. Transaction Summary & Aggregation (GET /api/transactions/summary)', () => {
    it('GET /api/transactions/summary should calculate income, expense, and balance accurately', async () => {
      const res = await request(app)
        .get('/api/transactions/summary')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalIncome).toBe(500);
      expect(res.body.data.totalExpense).toBe(40); // UserACustomCategory transaction
      expect(res.body.data.balance).toBe(460); // 500 - 40
      expect(res.body.data.transactionCount).toBe(2);
      expect(res.body.data.categoryBreakdown).toBeDefined();
      expect(res.body.data.categoryBreakdown.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/transactions/summary should return zeros when user has no transactions in date range', async () => {
      const res = await request(app)
        .get('/api/transactions/summary?startDate=2025-01-01&endDate=2025-01-31')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBe(0);
      expect(res.body.data.totalExpense).toBe(0);
      expect(res.body.data.balance).toBe(0);
      expect(res.body.data.transactionCount).toBe(0);
    });
  });

  // =========================================================================
  // 7. CSV IMPORT (Step 2.7)
  // =========================================================================
  describe('7. CSV Import (POST /api/import/transactions)', () => {
    it('should import valid transactions from raw CSV string in body', async () => {
      const csvData = [
        'date,type,amount,category,title,description,notes',
        '2026-09-10,expense,12.50,Food,Coffee & Sandwich,Campus cafeteria,Morning study',
        '2026-09-12,income,150.00,Part-time Job,Tutoring Session,Math tutoring,2 hours',
        '2026-09-14,expense,45.00,Transport,Monthly Bus Card,Public transit,Commute',
      ].join('\n');

      const res = await request(app)
        .post('/api/import/transactions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ csv: csvData });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRows).toBe(3);
      expect(res.body.data.importedRows).toBe(3);
      expect(res.body.data.failedRows).toBe(0);
      expect(res.body.data.errors.length).toBe(0);

      // Verify transactions in DB belong to user A
      const count = await Transaction.countDocuments({
        user: userAId,
        title: 'Coffee & Sandwich',
      });
      expect(count).toBe(1);
    });

    it('should safely reject invalid rows while importing valid ones', async () => {
      const mixedCSV = [
        'date,type,amount,category,title',
        '2026-09-15,expense,18.00,Food,Valid Canteen Meal',
        '2026-09-16,expense,-50.00,Food,Invalid Negative Amount', // Row 2: invalid amount
        '2026-09-17,expense,30.00,Allowance,Type Mismatched Category', // Row 3: Allowance is income!
        '2026-09-18,expense,25.00,NonExistentCategoryXYZ,Invalid Category Name', // Row 4: Category doesn't exist
        '2026-09-19,income,200.00,Scholarship,Valid Merit Scholarship', // Row 5: valid
      ].join('\n');

      const res = await request(app)
        .post('/api/import/transactions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ csvData: mixedCSV });

      expect(res.status).toBe(200);
      expect(res.body.data.totalRows).toBe(5);
      expect(res.body.data.importedRows).toBe(2); // rows 1 and 5
      expect(res.body.data.failedRows).toBe(3); // rows 2, 3, 4
      expect(res.body.data.errors).toHaveLength(3);

      expect(res.body.data.errors[0].row).toBe(2);
      expect(res.body.data.errors[0].reason).toMatch(/amount/i);

      expect(res.body.data.errors[1].row).toBe(3);
      expect(res.body.data.errors[1].reason).toMatch(/type/i);

      expect(res.body.data.errors[2].row).toBe(4);
      expect(res.body.data.errors[2].reason).toMatch(/does not exist/i);
    });

    it('should import transactions via multipart file upload', async () => {
      const fileContent = Buffer.from(
        'date,type,amount,category,title\n2026-09-20,expense,65.00,Academics,Data Structures Textbook'
      );

      const res = await request(app)
        .post('/api/import/transactions')
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', fileContent, 'my_expenses.csv');

      expect(res.status).toBe(200);
      expect(res.body.data.importedRows).toBe(1);

      const tx = await Transaction.findOne({
        user: userAId,
        title: 'Data Structures Textbook',
      });
      expect(tx).toBeDefined();
      expect(tx.amount).toBe(65);
    });

    it('should reject empty CSV input (400)', async () => {
      const res = await request(app)
        .post('/api/import/transactions')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ csv: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no csv data/i);
    });
  });
});
