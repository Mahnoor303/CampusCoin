const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Category = require("../src/models/Category");
const Transaction = require("../src/models/Transaction");
const Budget = require("../src/models/Budget");
const Goal = require("../src/models/Goal");
const Insight = require("../src/models/Insight");
const { seedDefaultCategories } = require('../src/services/categoryService');

const registerAndLogin = async (overrides = {}) => {
  const defaults = {
    name: "Test Student",
    email: "student_" + Date.now() + "_" + Math.floor(Math.random() * 10000) + "@test.com",
    password: "Password1!",
  };
  const payload = { ...defaults, ...overrides };
  await request(app).post("/api/auth/register").send(payload);
  const res = await request(app).post("/api/auth/login").send({
    email: payload.email,
    password: payload.password,
  });
  return res.body.data.token;
};

const registerAdminAndLogin = async () => {
  const email = "admin_" + Date.now() + "_" + Math.floor(Math.random() * 10000) + "@test.com";
  await User.create({ name: "Admin User", email, password: "Password1!", role: "admin" });
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password1!" });
  return { token: res.body.data.token, email };
};

beforeAll(async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campuscoin_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoURI);
  }
  await seedDefaultCategories();
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({ email: { $regex: /@test\.com$/ } }),
    Category.deleteMany({ isDefault: false }),
    Transaction.deleteMany({}),
    Budget.deleteMany({}),
    Goal.deleteMany({}),
    Insight.deleteMany({}),
  ]);
});

afterAll(async () => {
  await Promise.all([
    User.deleteMany({ email: { $regex: /@test\.com$/ } }),
    Category.deleteMany({ isDefault: false }),
    Transaction.deleteMany({}),
    Budget.deleteMany({}),
    Goal.deleteMany({}),
    Insight.deleteMany({}),
  ]);
});

describe("GET /api/insights/tips", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/insights/tips");
    expect(res.statusCode).toBe(401);
  });

  it("returns tips array with disclaimer for authenticated user", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .get("/api/insights/tips")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tips)).toBe(true);
    expect(res.body.data).toHaveProperty("disclaimer");
    expect(res.body.data).toHaveProperty("month");
  });

  it("triggers no_income_this_month tip when no transactions recorded", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .get("/api/insights/tips")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    const rules = res.body.data.tips.map((t) => t.rule);
    expect(rules).toContain("no_income_this_month");
  });

  it("triggers high-category-spend tip when one category dominates expenses", async () => {
    const token = await registerAndLogin();
    const userRes = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer " + token);
    const userId = userRes.body.data.user._id;

    const cat = (await Category.findOne({ name: "Food", type: "expense" })) || (await Category.create({ name: "Food", type: "expense", isDefault: true }));
    const now = new Date();
    await Transaction.create([
      { user: userId, category: cat._id, type: "expense", amount: 900, date: now, title: "Food", description: "Food" },
      { user: userId, category: cat._id, type: "expense", amount: 50, date: now, title: "Small", description: "Small" },
    ]);

    const res = await request(app)
      .get("/api/insights/tips")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    const rules = res.body.data.tips.map((t) => t.rule);
    expect(rules).toContain("category_share_gte_30pct");
  });
});

describe("POST /api/insights/generate", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/insights/generate");
    expect(res.statusCode).toBe(401);
  });

  it("generates and persists insights", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .post("/api/insights/generate")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.insights)).toBe(true);
    expect(res.body.data).toHaveProperty("count");
    expect(res.body.data).toHaveProperty("month");
    expect(res.body.data.month).toMatch(/^\d{4}-\d{2}$/);
  });

  it("regenerating replaces previous insights for the same month", async () => {
    const token = await registerAndLogin();
    await request(app).post("/api/insights/generate").set("Authorization", "Bearer " + token);
    await request(app).post("/api/insights/generate").set("Authorization", "Bearer " + token);

    const userRes = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer " + token);
    const userId = userRes.body.data.user._id;
    const now = new Date();
    const month = now.getUTCFullYear() + "-" + String(now.getUTCMonth() + 1).padStart(2, "0");
    const dbCount = await Insight.countDocuments({ user: userId, month });

    const listRes = await request(app)
      .get("/api/insights")
      .set("Authorization", "Bearer " + token);
    expect(listRes.body.data.insights.length).toBe(dbCount);
  });
});

describe("GET /api/insights", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/insights");
    expect(res.statusCode).toBe(401);
  });

  it("returns persisted insights for the user", async () => {
    const token = await registerAndLogin();
    await request(app).post("/api/insights/generate").set("Authorization", "Bearer " + token);
    const res = await request(app)
      .get("/api/insights")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.insights)).toBe(true);
  });

  it("does not return another user insights", async () => {
    const tokenA = await registerAndLogin({ email: "a_" + Date.now() + "@test.com" });
    const tokenB = await registerAndLogin({ email: "b_" + Date.now() + "@test.com" });
    await request(app).post("/api/insights/generate").set("Authorization", "Bearer " + tokenA);
    const res = await request(app)
      .get("/api/insights")
      .set("Authorization", "Bearer " + tokenB);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.insights.length).toBe(0);
  });
});

describe("PATCH /api/insights/:id/read and /pin", () => {
  let token, insightId;

  beforeEach(async () => {
    token = await registerAndLogin({ email: "rp_" + Date.now() + "@test.com" });
    await request(app).post("/api/insights/generate").set("Authorization", "Bearer " + token);
    const listRes = await request(app)
      .get("/api/insights")
      .set("Authorization", "Bearer " + token);
    insightId = listRes.body.data.insights[0]?._id;
  });

  it("marks insight as read", async () => {
    if (!insightId) return;
    const res = await request(app)
      .patch("/api/insights/" + insightId + "/read")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.insight.isRead).toBe(true);
  });

  it("toggles pin status", async () => {
    if (!insightId) return;
    const res = await request(app)
      .patch("/api/insights/" + insightId + "/pin")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.data.insight.isPinned).toBe("boolean");
  });

  it("returns 404 for another users insight", async () => {
    if (!insightId) return;
    const otherToken = await registerAndLogin({ email: "oth_" + Date.now() + "@test.com" });
    const res = await request(app)
      .patch("/api/insights/" + insightId + "/read")
      .set("Authorization", "Bearer " + otherToken);
    expect(res.statusCode).toBe(404);
  });
});

describe("Admin route security - student gets 403", () => {
  it("GET /api/admin/dashboard returns 403 for student", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(403);
  });

  it("GET /api/admin/users returns 403 for student", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(403);
  });

  it("GET /api/admin/statistics returns 403 for student", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .get("/api/admin/statistics")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(403);
  });

  it("PATCH /api/admin/users/:id/role returns 403 for student", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .patch("/api/admin/users/000000000000000000000001/role")
      .set("Authorization", "Bearer " + token)
      .send({ role: "admin" });
    expect(res.statusCode).toBe(403);
  });

  it("DELETE /api/admin/users/:id returns 403 for student", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
      .delete("/api/admin/users/000000000000000000000001")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(403);
  });

  it("admin route returns 401 when unauthenticated", async () => {
    const res = await request(app).get("/api/admin/dashboard");
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/admin/dashboard (admin only)", () => {
  it("returns platform overview for admin user", async () => {
    const { token } = await registerAdminAndLogin();
    await request(app).post("/api/auth/register").send({
      name: "Student A", email: "stuA_" + Date.now() + "@test.com", password: "Password1!",
    });
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("users");
    expect(res.body.data).toHaveProperty("transactions");
    expect(res.body.data).toHaveProperty("platformFinancials");
    expect(res.body.data.users.total).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /api/admin/users (admin only)", () => {
  it("lists users with pagination meta", async () => {
    const { token } = await registerAdminAndLogin();
    await request(app).post("/api/auth/register").send({
      name: "Student B", email: "stuB_" + Date.now() + "@test.com", password: "Password1!",
    });
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.meta).toHaveProperty("total");
    expect(res.body.meta).toHaveProperty("pages");
  });

  it("never returns password field", async () => {
    const { token } = await registerAdminAndLogin();
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer " + token);
    for (const user of res.body.data.users) {
      expect(user).not.toHaveProperty("password");
    }
  });

  it("filters by role=student", async () => {
    const { token } = await registerAdminAndLogin();
    await request(app).post("/api/auth/register").send({
      name: "Student C", email: "stuC_" + Date.now() + "@test.com", password: "Password1!",
    });
    const res = await request(app)
      .get("/api/admin/users?role=student")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    for (const user of res.body.data.users) {
      expect(user.role).toBe("student");
    }
  });
});

describe("GET /api/admin/users/:id (admin only)", () => {
  it("returns a specific user without password", async () => {
    const { token } = await registerAdminAndLogin();
    const stuRes = await request(app).post("/api/auth/register").send({
      name: "Student D", email: "stuD_" + Date.now() + "@test.com", password: "Password1!",
    });
    const stuId = stuRes.body.data.user._id;
    const res = await request(app)
      .get("/api/admin/users/" + stuId)
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user._id).toBe(stuId);
    expect(res.body.data.user).not.toHaveProperty("password");
  });

  it("returns 404 for unknown user id", async () => {
    const { token } = await registerAdminAndLogin();
    const res = await request(app)
      .get("/api/admin/users/000000000000000000000099")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(404);
  });
});

describe("PATCH /api/admin/users/:id/role (admin only)", () => {
  it("promotes a student to admin", async () => {
    const { token } = await registerAdminAndLogin();
    const stuRes = await request(app).post("/api/auth/register").send({
      name: "Student E", email: "stuE_" + Date.now() + "@test.com", password: "Password1!",
    });
    const stuId = stuRes.body.data.user._id;
    const res = await request(app)
      .patch("/api/admin/users/" + stuId + "/role")
      .set("Authorization", "Bearer " + token)
      .send({ role: "admin" });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.role).toBe("admin");
    expect(res.body.data.user).not.toHaveProperty("password");
  });

  it("returns 400 when admin changes their own role", async () => {
    const { token } = await registerAdminAndLogin();
    const meRes = await request(app).get("/api/users/me").set("Authorization", "Bearer " + token);
    const adminId = meRes.body.data.user._id;
    const res = await request(app)
      .patch("/api/admin/users/" + adminId + "/role")
      .set("Authorization", "Bearer " + token)
      .send({ role: "student" });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid role value", async () => {
    const { token } = await registerAdminAndLogin();
    const stuRes = await request(app).post("/api/auth/register").send({
      name: "Student F", email: "stuF_" + Date.now() + "@test.com", password: "Password1!",
    });
    const stuId = stuRes.body.data.user._id;
    const res = await request(app)
      .patch("/api/admin/users/" + stuId + "/role")
      .set("Authorization", "Bearer " + token)
      .send({ role: "superuser" });
    expect(res.statusCode).toBe(400);
  });
});

describe("DELETE /api/admin/users/:id (admin only)", () => {
  it("deletes a user and all their data", async () => {
    const { token } = await registerAdminAndLogin();
    const stuToken = await registerAndLogin({ email: "stuDel_" + Date.now() + "@test.com" });
    const stuRes = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer " + stuToken);
    const stuId = stuRes.body.data.user._id;

    const cat = (await Category.findOne({ name: "Food", type: "expense" })) || (await Category.create({ name: "Food", type: "expense", isDefault: true }));
    await Transaction.create({
      user: stuId, category: cat._id, type: "expense", amount: 100, date: new Date(), title: "food", description: "food",
    });

    const res = await request(app)
      .delete("/api/admin/users/" + stuId)
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);

    const deletedUser = await User.findById(stuId);
    expect(deletedUser).toBeNull();

    const txCount = await Transaction.countDocuments({ user: stuId });
    expect(txCount).toBe(0);
  });

  it("returns 400 when admin deletes themselves", async () => {
    const { token } = await registerAdminAndLogin();
    const meRes = await request(app).get("/api/users/me").set("Authorization", "Bearer " + token);
    const adminId = meRes.body.data.user._id;
    const res = await request(app)
      .delete("/api/admin/users/" + adminId)
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for non-existent user", async () => {
    const { token } = await registerAdminAndLogin();
    const res = await request(app)
      .delete("/api/admin/users/000000000000000000000099")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(404);
  });
});

describe("GET /api/admin/statistics (admin only)", () => {
  it("returns trend data with expected fields", async () => {
    const { token } = await registerAdminAndLogin();
    const res = await request(app)
      .get("/api/admin/statistics")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("userGrowth");
    expect(res.body.data).toHaveProperty("transactionTrend");
    expect(res.body.data).toHaveProperty("categoryUsage");
    expect(res.body.data).toHaveProperty("periodMonths");
    expect(res.body.data.periodMonths).toBe(6);
  });

  it("respects months query param", async () => {
    const { token } = await registerAdminAndLogin();
    const res = await request(app)
      .get("/api/admin/statistics?months=3")
      .set("Authorization", "Bearer " + token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.periodMonths).toBe(3);
  });
});

describe("PATCH /api/admin/users/:id/status (admin only user management)", () => {
  it("deactivates a user and blocks their access", async () => {
    const { token: adminToken } = await registerAdminAndLogin();
    const stuEmail = "stuDeact_" + Date.now() + "@test.com";
    const stuToken = await registerAndLogin({ email: stuEmail, password: "Password1!" });

    const meRes = await request(app).get("/api/users/me").set("Authorization", "Bearer " + stuToken);
    const stuId = meRes.body.data.user._id;

    // Admin deactivates student account
    const deactRes = await request(app)
      .patch("/api/admin/users/" + stuId + "/status")
      .set("Authorization", "Bearer " + adminToken)
      .send({ isActive: false });
    expect(deactRes.statusCode).toBe(200);
    expect(deactRes.body.data.user.isActive).toBe(false);

    // Deactivated user API request should fail (403)
    const accessRes = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer " + stuToken);
    expect(accessRes.statusCode).toBe(403);

    // Deactivated user login should fail (403)
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: stuEmail, password: "Password1!" });
    expect(loginRes.statusCode).toBe(403);

    // Reactivate account
    const reactRes = await request(app)
      .patch("/api/admin/users/" + stuId + "/status")
      .set("Authorization", "Bearer " + adminToken)
      .send({ isActive: true });
    expect(reactRes.statusCode).toBe(200);
    expect(reactRes.body.data.user.isActive).toBe(true);
  });
});

describe("Strict student data isolation & ownership security", () => {
  it("prevents one student from accessing another student's transactions, budgets, goals, or insights", async () => {
    const tokenA = await registerAndLogin({ email: "studentA_" + Date.now() + "@test.com" });
    const tokenB = await registerAndLogin({ email: "studentB_" + Date.now() + "@test.com" });

    // Student A creates data
    const cat = (await Category.findOne({ name: "Food", type: "expense" })) || (await Category.create({ name: "Food", type: "expense", isDefault: true }));
    const txRes = await request(app).post("/api/transactions").set("Authorization", "Bearer " + tokenA).send({
      title: "Student A lunch", amount: 25, type: "expense", category: cat._id, date: new Date().toISOString(),
    });
    const txId = txRes.body.data._id || txRes.body.data.transaction?._id;

    const bgtRes = await request(app).post("/api/budgets").set("Authorization", "Bearer " + tokenA).send({
      category: cat._id, limit: 300, period: "monthly", startDate: "2026-09-01", endDate: "2026-09-30",
    });
    const bgtId = bgtRes.body.data._id || bgtRes.body.data.budget?._id;

    const goalRes = await request(app).post("/api/goals").set("Authorization", "Bearer " + tokenA).send({
      name: "Student A goal", targetAmount: 500, deadline: "2026-12-31",
    });
    const goalId = goalRes.body.data._id || goalRes.body.data.goal?._id;

    await request(app).post("/api/insights/generate").set("Authorization", "Bearer " + tokenA);
    const insRes = await request(app).get("/api/insights").set("Authorization", "Bearer " + tokenA);
    const insId = insRes.body.data.insights[0]?._id;

    // Student B attempts to access Student A's resources directly
    const getTx = await request(app).get("/api/transactions/" + txId).set("Authorization", "Bearer " + tokenB);
    expect([403, 404]).toContain(getTx.statusCode);

    const getBgt = await request(app).get("/api/budgets/" + bgtId).set("Authorization", "Bearer " + tokenB);
    expect([403, 404]).toContain(getBgt.statusCode);

    const getGoal = await request(app).get("/api/goals/" + goalId).set("Authorization", "Bearer " + tokenB);
    expect([403, 404]).toContain(getGoal.statusCode);

    if (insId) {
      const patchIns = await request(app).patch("/api/insights/" + insId + "/read").set("Authorization", "Bearer " + tokenB);
      expect([403, 404]).toContain(patchIns.statusCode);
    }
  });
});
