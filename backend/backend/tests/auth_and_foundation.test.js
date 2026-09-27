const path = require('path');
const dotenv = require('dotenv');

// Load environment variables for test suite
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const {
  seedDefaultCategories,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
} = require('../src/services/categoryService');
const { isOwnerOrAdmin, assertOwnership } = require('../src/utils/ownershipChecker');

describe('CampusCoin Backend Step 1 — Foundation & Auth Test Suite', () => {
  let studentToken;
  let studentUser;
  let adminToken;
  let adminUser;

  const testStudent = {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@university.edu',
    password: 'password123',
    academicYear: '2nd Year',
    monthlyAllowanceBaseline: 450,
    monthlySavingsGoal: 100,
  };

  const testAdmin = {
    name: 'System Admin',
    email: 'admin@campuscoin.edu',
    password: 'adminSecurePassword123',
    role: 'admin',
  };

  beforeAll(async () => {
    // 1. Verify MongoDB Connection
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campuscoin_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
    }

    // Clean up test data if left over
    await User.deleteMany({ email: { $in: [testStudent.email, testAdmin.email, 'another@uni.edu'] } });
  });

  afterAll(async () => {
    // Clean up created users
    await User.deleteMany({ email: { $in: [testStudent.email, testAdmin.email, 'another@uni.edu'] } });
    await mongoose.connection.close();
  });

  // =========================================================================
  // 1. Server & Health Check
  // =========================================================================
  describe('1. Health Check Endpoint', () => {
    it('GET /api/health should return 200 with operational status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
    });
  });

  // =========================================================================
  // 2. Default Categories Seeding & Idempotency (TASK 8)
  // =========================================================================
  describe('2. Default Categories (TASK 8)', () => {
    it('should seed default income and expense categories', async () => {
      const res = await seedDefaultCategories();
      expect(res.total).toBe(DEFAULT_INCOME_CATEGORIES.length + DEFAULT_EXPENSE_CATEGORIES.length);
      expect(res.total).toBe(12); // 5 income + 7 expense
    });

    it('should be idempotent: calling seedDefaultCategories again does not create duplicates', async () => {
      const initialCount = await Category.countDocuments({ isDefault: true, user: null });
      const secondRun = await seedDefaultCategories();
      const afterCount = await Category.countDocuments({ isDefault: true, user: null });

      expect(afterCount).toBe(initialCount);
      expect(secondRun.created).toBe(0);
    });

    it('GET /api/categories/defaults should return all 12 default categories', async () => {
      const res = await request(app).get('/api/categories/defaults');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(12);

      const incomeCategories = res.body.data.filter((c) => c.type === 'income');
      const expenseCategories = res.body.data.filter((c) => c.type === 'expense');

      expect(incomeCategories.map((c) => c.name)).toEqual(
        expect.arrayContaining(['Allowance', 'Part-time Job', 'Scholarship', 'Gift', 'Other'])
      );
      expect(expenseCategories.map((c) => c.name)).toEqual(
        expect.arrayContaining([
          'Food',
          'Transport',
          'Hostel/Rent',
          'Academics',
          'Subscriptions',
          'Entertainment',
          'Miscellaneous',
        ])
      );
    });
  });

  // =========================================================================
  // 3. User Registration (TASK 4 & TASK 6)
  // =========================================================================
  describe('3. User Registration (POST /api/auth/register)', () => {
    it('should register a new student user successfully with safe response', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testStudent);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testStudent.email.toLowerCase());
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.academicYear).toBe('2nd Year');
      // Critical security check: password hash must NEVER be returned
      expect(res.body.data.user.password).toBeUndefined();

      studentToken = res.body.data.token;
      studentUser = res.body.data.user;
    });

    it('should fail registration with duplicate email address', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testStudent);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should fail registration if required fields are missing or invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'not-an-email',
          password: '123', // less than 6 chars
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should register an admin user for testing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testAdmin);

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data.user.password).toBeUndefined();

      adminToken = res.body.data.token;
      adminUser = res.body.data.user;
    });
  });

  // =========================================================================
  // 4. User Login (TASK 4 & TASK 6)
  // =========================================================================
  describe('4. User Login (POST /api/auth/login)', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: testStudent.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testStudent.email.toLowerCase());
      // Password hash must not be returned
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject login with wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testStudent.email,
          password: 'wrongPasswordXYZ',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('should reject login with non-existent email (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown.ghost@campuscoin.edu',
          password: 'anyPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });
  });

  // =========================================================================
  // 5. Authentication Verification & Protected Routes (GET /api/auth/me)
  // =========================================================================
  describe('5. Authentication Verification (GET /api/auth/me & Logout)', () => {
    it('should return current authenticated user with valid JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testStudent.email.toLowerCase());
      expect(res.body.data.user.name).toBe(testStudent.name);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject request without Authorization header (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no token provided/i);
    });

    it('should reject request with invalid / forged token (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_forged_jwt_token_123');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid token/i);
    });

    it('POST /api/auth/logout should return success', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/logged out/i);
    });
  });

  // =========================================================================
  // 6. User Profile APIs (TASK 7)
  // =========================================================================
  describe('6. User Profile APIs (TASK 7: GET & PUT /api/users/me)', () => {
    it('GET /api/users/me should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testStudent.email.toLowerCase());
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('PUT /api/users/me should update allowed profile fields', async () => {
      const updateData = {
        name: 'Sarah J. Connor',
        academicYear: '3rd Year',
        monthlyAllowanceBaseline: 550,
        monthlySavingsGoal: 150,
        bio: 'Computer Science sophomore passionate about budgeting',
      };

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Sarah J. Connor');
      expect(res.body.data.user.academicYear).toBe('3rd Year');
      expect(res.body.data.user.monthlyAllowanceBaseline).toBe(550);
      expect(res.body.data.user.monthlySavingsGoal).toBe(150);
      expect(res.body.data.user.bio).toBe(updateData.bio);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('PUT /api/users/me should reject student attempts to modify role (Privilege Escalation Guard)', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ role: 'admin' });

      // Should be rejected by validator or controller
      expect([400, 403]).toContain(res.status);
      expect(res.body.success).toBe(false);

      // Verify the role in DB is still student
      const dbUser = await User.findById(studentUser._id);
      expect(dbUser.role).toBe('student');
    });
  });

  // =========================================================================
  // 7. Role-Based Authorization & Admin Guard (TASK 5)
  // =========================================================================
  describe('7. Role-Based Authorization (Admin Guard)', () => {
    it('should forbid student user from accessing admin-only endpoint (403)', async () => {
      const res = await request(app)
        .get('/api/users/admin-test')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden/i);
    });

    it('should allow admin user to access admin-only endpoint (200)', async () => {
      const res = await request(app)
        .get('/api/users/admin-test')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('admin');
    });
  });

  // =========================================================================
  // 8. Ownership Checking Utilities (TASK 5)
  // =========================================================================
  describe('8. Ownership Checking Utility (TASK 5)', () => {
    it('should return true when user owns the resource', () => {
      const resourceOwnerId = studentUser._id;
      const currentUser = { _id: studentUser._id, role: 'student' };
      expect(isOwnerOrAdmin(resourceOwnerId, currentUser)).toBe(true);
    });

    it('should return false when a student tries to access another student resource', () => {
      const resourceOwnerId = new mongoose.Types.ObjectId();
      const currentUser = { _id: studentUser._id, role: 'student' };
      expect(isOwnerOrAdmin(resourceOwnerId, currentUser)).toBe(false);
    });

    it('should return true when admin accesses any user resource', () => {
      const resourceOwnerId = studentUser._id;
      const adminCurrentUser = { _id: adminUser._id, role: 'admin' };
      expect(isOwnerOrAdmin(resourceOwnerId, adminCurrentUser)).toBe(true);
    });

    it('assertOwnership should throw 403 error for unauthorized student', () => {
      const resourceOwnerId = new mongoose.Types.ObjectId();
      const currentUser = { _id: studentUser._id, role: 'student' };

      expect(() => {
        assertOwnership(resourceOwnerId, currentUser, 'Transaction');
      }).toThrow(/Access denied/);
    });
  });

  // =========================================================================
  // 9. MongoDB Models Verification (TASK 3)
  // =========================================================================
  describe('9. Verification of All Models Schema Structure (TASK 3)', () => {
    it('should verify Transaction model schema exists and enforces required fields', () => {
      const Transaction = require('../src/models/Transaction');
      const tx = new Transaction({});
      const err = tx.validateSync();
      expect(err.errors.user).toBeDefined();
      expect(err.errors.amount).toBeDefined();
      expect(err.errors.category).toBeDefined();
      expect(err.errors.title).toBeDefined();
      expect(err.errors.type).toBeDefined();
    });

    it('should verify Budget model schema exists and enforces required fields', () => {
      const Budget = require('../src/models/Budget');
      const b = new Budget({});
      const err = b.validateSync();
      expect(err.errors.user).toBeDefined();
      expect(err.errors.category).toBeDefined();
      expect(err.errors.limit).toBeDefined();
      expect(err.errors.startDate).toBeDefined();
      expect(err.errors.endDate).toBeDefined();
    });

    it('should verify Goal model schema exists and enforces required fields', () => {
      const Goal = require('../src/models/Goal');
      const g = new Goal({});
      const err = g.validateSync();
      expect(err.errors.user).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.targetAmount).toBeDefined();
      expect(err.errors.deadline).toBeDefined();
    });

    it('should verify Insight model schema exists and enforces required fields', () => {
      const Insight = require('../src/models/Insight');
      const ins = new Insight({});
      const err = ins.validateSync();
      expect(err.errors.user).toBeDefined();
      expect(err.errors.month).toBeDefined();
      expect(err.errors.summaryText).toBeDefined();
      expect(err.errors.tipText).toBeDefined();
    });
  });
});
