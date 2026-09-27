const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Transaction = require('../src/models/Transaction');
const Budget = require('../src/models/Budget');
const Goal = require('../src/models/Goal');
const { seedDefaultCategories } = require('../src/services/categoryService');

describe('CampusCoin Backend Step 3 — Budgets, Goals, Dashboard & Reports Suite', () => {
  let userAToken;
  let userAId;
  let userBToken;
  let userBId;

  let foodCatId;
  let transportCatId;
  let allowanceCatId;

  let testBudgetId;
  let testGoalId;

  const testUserA = {
    name: 'Marcus Vance',
    email: 'marcus.vance@university.edu',
    password: 'password123',
    academicYear: '3rd Year',
  };

  const testUserB = {
    name: 'Chloe Bennett',
    email: 'chloe.bennett@university.edu',
    password: 'password123',
    academicYear: '4th Year',
  };

  beforeAll(async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campuscoin_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
    }

    // Clean up test users
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

    // Fetch default categories
    const food = await Category.findOne({ name: 'Food', type: 'expense', isDefault: true });
    foodCatId = food._id.toString();

    const transport = await Category.findOne({ name: 'Transport', type: 'expense', isDefault: true });
    transportCatId = transport._id.toString();

    const allowance = await Category.findOne({ name: 'Allowance', type: 'income', isDefault: true });
    allowanceCatId = allowance._id.toString();

    // Create seed transactions for User A in current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const txs = [
      {
        user: userAId,
        type: 'income',
        amount: 600,
        category: allowanceCatId,
        title: 'Monthly Allowance',
        date: new Date(Date.UTC(currentYear, currentMonth, 5, 12, 0, 0)),
      },
      {
        user: userAId,
        type: 'expense',
        amount: 80,
        category: foodCatId,
        title: 'Grocery Run',
        date: new Date(Date.UTC(currentYear, currentMonth, 8, 12, 0, 0)),
      },
      {
        user: userAId,
        type: 'expense',
        amount: 40,
        category: foodCatId,
        title: 'Dinner with friends',
        date: new Date(Date.UTC(currentYear, currentMonth, 10, 12, 0, 0)),
      },
      {
        user: userAId,
        type: 'expense',
        amount: 50,
        category: transportCatId,
        title: 'Metro Pass',
        date: new Date(Date.UTC(currentYear, currentMonth, 12, 12, 0, 0)),
      },
    ];

    await Transaction.insertMany(txs);
  });

  afterAll(async () => {
    if (userAId) {
      await Transaction.deleteMany({ user: userAId });
      await Budget.deleteMany({ user: userAId });
      await Goal.deleteMany({ user: userAId });
      await User.findByIdAndDelete(userAId);
    }
    if (userBId) {
      await Transaction.deleteMany({ user: userBId });
      await Budget.deleteMany({ user: userBId });
      await Goal.deleteMany({ user: userBId });
      await User.findByIdAndDelete(userBId);
    }
    await mongoose.connection.close();
  });

  // =========================================================================
  // 1. BUDGET MANAGEMENT & VALIDATION
  // =========================================================================
  describe('1. Budget Management APIs', () => {
    it('POST /api/budgets should create a budget for an expense category', async () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          category: foodCatId,
          limit: 150,
          period: 'monthly',
          startDate,
          endDate,
          alertThreshold: 75,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.limit).toBe(150);
      expect(res.body.data.alertThreshold).toBe(75);
      expect(res.body.data.usage).toBeDefined();
      expect(res.body.data.usage.amountSpent).toBe(120); // 80 + 40
      expect(res.body.data.usage.percentageUsed).toBe(80); // 120 / 150 = 80%
      expect(res.body.data.usage.alertStatus).toBe('warning'); // >= 75% threshold

      testBudgetId = res.body.data._id;
    });

    it('POST /api/budgets should REJECT budget on an income category', async () => {
      const now = new Date();
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          category: allowanceCatId, // Allowance is income!
          limit: 200,
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/only be set on 'expense' categories/i);
    });

    it('POST /api/budgets should REJECT invalid date range (endDate <= startDate)', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          category: foodCatId,
          limit: 100,
          startDate: '2026-09-30',
          endDate: '2026-09-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/budgets should return user budgets with usage calculations', async () => {
      const res = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].usage.amountSpent).toBe(120);
    });

    it('GET /api/budgets/:id should retrieve a single budget with usage', async () => {
      const res = await request(app)
        .get(`/api/budgets/${testBudgetId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(testBudgetId);
      expect(res.body.data.usage).toBeDefined();
    });

    it('GET /api/budgets/:id/usage should return specific usage calculation', async () => {
      const res = await request(app)
        .get(`/api/budgets/${testBudgetId}/usage`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.limit).toBe(150);
      expect(res.body.data.amountSpent).toBe(120);
      expect(res.body.data.remainingAmount).toBe(30);
      expect(res.body.data.percentageUsed).toBe(80);
      expect(res.body.data.alertStatus).toBe('warning');
      expect(res.body.data.isApproaching).toBe(true);
      expect(res.body.data.isExceeded).toBe(false);
    });

    it('PUT /api/budgets/:id should update budget limit and threshold', async () => {
      const res = await request(app)
        .put(`/api/budgets/${testBudgetId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          limit: 200,
          alertThreshold: 85,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.limit).toBe(200);
      expect(res.body.data.alertThreshold).toBe(85);
      expect(res.body.data.usage.percentageUsed).toBe(60); // 120 / 200 = 60%
      expect(res.body.data.usage.alertStatus).toBe('ok');
    });

    it('PUT /api/budgets/:id with lower limit should trigger exceeded alert', async () => {
      const res = await request(app)
        .put(`/api/budgets/${testBudgetId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          limit: 100, // Spent is 120, so 120% used
        });

      expect(res.status).toBe(200);
      expect(res.body.data.usage.percentageUsed).toBe(120);
      expect(res.body.data.usage.alertStatus).toBe('exceeded');
      expect(res.body.data.usage.isExceeded).toBe(true);
      expect(res.body.data.usage.remainingAmount).toBe(0);
    });

    it('User B should be FORBIDDEN (403) from accessing or modifying User A budget', async () => {
      const getRes = await request(app)
        .get(`/api/budgets/${testBudgetId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(getRes.status).toBe(403);

      const putRes = await request(app)
        .put(`/api/budgets/${testBudgetId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ limit: 999 });
      expect(putRes.status).toBe(403);

      const delRes = await request(app)
        .delete(`/api/budgets/${testBudgetId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(delRes.status).toBe(403);
    });
  });

  // =========================================================================
  // 2. SAVINGS GOALS & PROGRESS
  // =========================================================================
  describe('2. Savings Goals & Progress APIs', () => {
    it('POST /api/goals should create a new savings goal', async () => {
      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Semester Laptop Fund',
          targetAmount: 800,
          currentAmount: 200,
          deadline: '2026-12-31',
          notes: 'Saving for a new coding laptop',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Semester Laptop Fund');
      expect(res.body.data.targetAmount).toBe(800);
      expect(res.body.data.currentAmount).toBe(200);
      expect(res.body.data.status).toBe('in_progress');
      expect(res.body.data.progress).toBeDefined();
      expect(res.body.data.progress.percentageCompleted).toBe(25); // 200 / 800 = 25%
      expect(res.body.data.progress.remainingAmount).toBe(600);

      testGoalId = res.body.data._id;
    });

    it('GET /api/goals should return user goals with progress', async () => {
      const res = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].progress.percentageCompleted).toBe(25);
    });

    it('GET /api/goals/:id should return single goal', async () => {
      const res = await request(app)
        .get(`/api/goals/${testGoalId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(testGoalId);
    });

    it('GET /api/goals/:id/progress should return dedicated progress calculation', async () => {
      const res = await request(app)
        .get(`/api/goals/${testGoalId}/progress`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.targetAmount).toBe(800);
      expect(res.body.data.currentAmount).toBe(200);
      expect(res.body.data.remainingAmount).toBe(600);
      expect(res.body.data.percentageCompleted).toBe(25);
      expect(res.body.data.isCompleted).toBe(false);
    });

    it('PUT /api/goals/:id should update goal and auto-complete if target reached', async () => {
      const res = await request(app)
        .put(`/api/goals/${testGoalId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          currentAmount: 850,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.currentAmount).toBe(850);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.progress.percentageCompleted).toBe(100);
      expect(res.body.data.progress.remainingAmount).toBe(0);
      expect(res.body.data.progress.isCompleted).toBe(true);
    });

    it('User B should be FORBIDDEN (403) from accessing User A goal', async () => {
      const res = await request(app)
        .get(`/api/goals/${testGoalId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 3. DASHBOARD API
  // =========================================================================
  describe('3. Unified Dashboard API (GET /api/reports/dashboard)', () => {
    it('GET /api/reports/dashboard should return comprehensive aggregated data', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;

      // 1. Summary
      expect(data.summary).toBeDefined();
      expect(data.summary.totalIncome).toBe(600);
      expect(data.summary.totalExpense).toBe(170); // 80 + 40 + 50
      expect(data.summary.balance).toBe(430); // 600 - 170
      expect(data.summary.savingsRate).toBe(71.67); // 430 / 600

      // 2. Current Month Snapshot
      expect(data.currentMonth).toBeDefined();
      expect(data.currentMonth.income).toBe(600);
      expect(data.currentMonth.expense).toBe(170);

      // 3. Recent Transactions
      expect(Array.isArray(data.recentTransactions)).toBe(true);
      expect(data.recentTransactions.length).toBeLessThanOrEqual(5);
      expect(data.recentTransactions[0].category).toBeDefined();

      // 4. Category Breakdowns
      expect(Array.isArray(data.expenseByCategory)).toBeDefined();
      expect(data.expenseByCategory.length).toBeGreaterThanOrEqual(2); // Food & Transport
      expect(data.expenseByCategory[0].percentage).toBeGreaterThan(0);

      expect(Array.isArray(data.incomeByCategory)).toBeDefined();
      expect(data.incomeByCategory.length).toBeGreaterThanOrEqual(1); // Allowance

      // 5. Active Budgets
      expect(Array.isArray(data.activeBudgets)).toBe(true);
      expect(data.activeBudgets.length).toBeGreaterThanOrEqual(1);
      expect(data.activeBudgets[0].usage).toBeDefined();

      // 6. Active Goals
      expect(Array.isArray(data.activeGoals)).toBe(true);

      // 7. Monthly Trend
      expect(Array.isArray(data.monthlyTrend)).toBe(true);
      expect(data.monthlyTrend).toHaveLength(6);
    });

    it('GET /api/reports/dashboard should return zero states for new user B', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalIncome).toBe(0);
      expect(res.body.data.summary.totalExpense).toBe(0);
      expect(res.body.data.summary.balance).toBe(0);
      expect(res.body.data.recentTransactions).toHaveLength(0);
      expect(res.body.data.expenseByCategory).toHaveLength(0);
      expect(res.body.data.activeBudgets).toHaveLength(0);
    });
  });

  // =========================================================================
  // 4. FINANCIAL REPORTS (SUMMARY, CATEGORY, MONTHLY, TRENDS)
  // =========================================================================
  describe('4. Financial Report APIs', () => {
    it('GET /api/reports/summary should return summary with date filtering', async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/reports/summary?startDate=${start}&endDate=${end}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBe(600);
      expect(res.body.data.totalExpense).toBe(170);
      expect(res.body.data.balance).toBe(430);
      expect(res.body.data.dailyAverageExpense).toBeGreaterThan(0);
    });

    it('GET /api/reports/category-breakdown should return grouped category metrics', async () => {
      const res = await request(app)
        .get('/api/reports/category-breakdown?type=expense')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe('expense');
      expect(res.body.data.totalAmount).toBe(170);
      expect(res.body.data.categories.length).toBe(2);

      const foodItem = res.body.data.categories.find((c) => c.name === 'Food');
      expect(foodItem.totalAmount).toBe(120);
      expect(foodItem.percentage).toBe(70.59); // 120 / 170 = 70.59%
    });

    it('GET /api/reports/monthly should return full 12 months dataset', async () => {
      const currentYear = new Date().getFullYear();
      const res = await request(app)
        .get(`/api/reports/monthly?year=${currentYear}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.year).toBe(currentYear);
      expect(res.body.data.months).toHaveLength(12);

      const thisMonth = res.body.data.months[new Date().getMonth()];
      expect(thisMonth.income).toBe(600);
      expect(thisMonth.expense).toBe(170);
    });

    it('GET /api/reports/trends should return time series daily points', async () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/reports/trends?startDate=${start}&endDate=${end}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.trends).toBeDefined();
      expect(res.body.data.trends.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 5. DELETION CLEANUP
  // =========================================================================
  describe('5. Budget & Goal Deletion', () => {
    it('DELETE /api/budgets/:id should delete budget for owner', async () => {
      const res = await request(app)
        .delete(`/api/budgets/${testBudgetId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deletedBudgetId).toBe(testBudgetId);

      const check = await Budget.findById(testBudgetId);
      expect(check).toBeNull();
    });

    it('DELETE /api/goals/:id should delete goal for owner', async () => {
      const res = await request(app)
        .delete(`/api/goals/${testGoalId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deletedGoalId).toBe(testGoalId);

      const check = await Goal.findById(testGoalId);
      expect(check).toBeNull();
    });
  });
});
