const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const Insight = require("../models/Insight");

const HIGH_SPEND_PCT = 0.30;
const SURGE_PCT_INCREASE = 0.20;
const BUDGET_WARNING_PCT = 80;
const LOW_SAVINGS_PCT = 0.10;

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const monthRange = (month) => {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 0, 23, 59, 59, 999));
  return { start, end };
};

const prevMonthStr = (date, n = 1) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - n);
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
};

const currentMonthStr = () => {
  const now = new Date();
  return now.getUTCFullYear() + "-" + String(now.getUTCMonth() + 1).padStart(2, "0");
};

const getMonthlyBreakdown = async (userId, month) => {
  const { start, end } = monthRange(month);
  const uid = toObjectId(userId);
  const [summaryResult, byCategory] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: uid, date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { user: uid, type: "expense", date: { $gte: start, $lte: end } } },
      { $group: { _id: "$category", totalAmount: { $sum: "$amount" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "cat" } },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryId: "$_id",
          name: { $ifNull: ["$cat.name", "Uncategorised"] },
          totalAmount: { $round: ["$totalAmount", 2] },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),
  ]);
  const totalExpense = summaryResult.length > 0 ? Math.round(summaryResult[0].totalExpense * 100) / 100 : 0;
  const totalIncome = summaryResult.length > 0 ? Math.round(summaryResult[0].totalIncome * 100) / 100 : 0;
  return { totalExpense, totalIncome, byCategory };
};

/**
 * Generates an array of financial tip objects for the user based on transparent rules.
 * Rules are purely computational - no AI or external service is required.
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<Array>}
 */
const generateTips = async (userId) => {
  const tips = [];
  const month = currentMonthStr();
  const prevMonth = prevMonthStr(new Date(), 1);

  const [current, previous] = await Promise.all([
    getMonthlyBreakdown(userId, month),
    getMonthlyBreakdown(userId, prevMonth),
  ]);
  const { totalExpense, byCategory } = current;

  // Rule 1: High category spending (>=30% of total expenses) or specific high category spend
  if (totalExpense > 0) {
    for (const cat of byCategory) {
      const pct = cat.totalAmount / totalExpense;
      const lowerName = cat.name.toLowerCase();

      // Rule 1a: Category accounts for >=30% of total expenses
      if (pct >= HIGH_SPEND_PCT) {
        const pctLabel = Math.round(pct * 100);
        let title = "High spending on " + cat.name;
        if (lowerName.includes("food")) {
          title = "High Food & Dining Spending";
        } else if (lowerName.includes("entertainment")) {
          title = "High Entertainment Spending";
        } else if (lowerName.includes("subscript")) {
          title = "High Subscription Spending";
        }

        tips.push({
          type: "saving_opportunity",
          severity: "warning",
          categoryId: cat.categoryId,
          categoryName: cat.name,
          title,
          body: cat.name + " accounts for " + pctLabel + "% of your expenses this month (" + cat.totalAmount.toFixed(2) + "). Consider reviewing these costs to free up savings.",
          rule: "category_share_gte_30pct",
          metadata: {
            rule: "category_share_gte_30pct",
            categoryName: cat.name,
            percentage: pctLabel,
            amount: cat.totalAmount,
            totalExpense,
          },
        });
      } else if (lowerName.includes("subscript") && cat.totalAmount > 0) {
        // Rule 1b: Dedicated subscription audit tip if user has subscriptions logged
        tips.push({
          type: "saving_opportunity",
          severity: "info",
          categoryId: cat.categoryId,
          categoryName: cat.name,
          title: "Subscription Spending Audit",
          body: "You spent Rs " + cat.totalAmount.toFixed(2) + " on subscriptions this month. Periodically reviewing unused recurring subscriptions can yield regular savings.",
          rule: "high_subscription_spending",
          metadata: {
            rule: "high_subscription_spending",
            categoryName: cat.name,
            amount: cat.totalAmount,
          },
        });
      }
    }
  }

  // Rule 2: Month-over-month overall spending surge (>=20%)
  if (previous.totalExpense > 0) {
    const increase = (current.totalExpense - previous.totalExpense) / previous.totalExpense;
    if (increase >= SURGE_PCT_INCREASE) {
      const pctLabel = Math.round(increase * 100);
      tips.push({
        type: "spending_surge",
        severity: "warning",
        categoryId: null,
        categoryName: null,
        title: "Unusually high overall spending (up " + pctLabel + "%)",
        body: "Your total expenses rose by " + pctLabel + "% compared to last month (" + previous.totalExpense.toFixed(2) + " to Rs " + current.totalExpense.toFixed(2) + "). Review your recent transactions to stay on track.",
        rule: "monthly_expense_surge_gte_20pct",
        metadata: {
          rule: "monthly_expense_surge_gte_20pct",
          increasePct: pctLabel,
          currentTotal: current.totalExpense,
          previousTotal: previous.totalExpense,
        },
      });
    }
  }

  // Rule 3: Per-category surge vs previous month (>=20%)
  if (previous.byCategory.length > 0) {
    const prevMap = {};
    for (const c of previous.byCategory) {
      if (c.categoryId) prevMap[c.categoryId.toString()] = c.totalAmount;
    }
    for (const cat of byCategory) {
      const prevAmt = cat.categoryId ? (prevMap[cat.categoryId.toString()] || 0) : 0;
      if (prevAmt > 0) {
        const catIncrease = (cat.totalAmount - prevAmt) / prevAmt;
        if (catIncrease >= SURGE_PCT_INCREASE) {
          const pctLabel = Math.round(catIncrease * 100);
          const lowerName = cat.name.toLowerCase();
          let title = cat.name + " spending up " + pctLabel + "%";
          if (lowerName.includes("transport")) {
            title = "Transportation Spending Increase (" + pctLabel + "%)";
          }

          tips.push({
            type: "spending_surge",
            severity: "warning",
            categoryId: cat.categoryId,
            categoryName: cat.name,
            title,
            body: "You spent Rs " + cat.totalAmount.toFixed(2) + " on " + cat.name + " this month, up " + pctLabel + "% from last month (" + prevAmt.toFixed(2) + "). Consider reducing discretionary spending in this area.",
            rule: lowerName.includes("transport") ? "transportation_spending_increase" : "category_surge_gte_20pct",
            metadata: {
              rule: "category_surge_gte_20pct",
              categoryName: cat.name,
              increasePct: pctLabel,
              currentAmount: cat.totalAmount,
              previousAmount: prevAmt,
            },
          });
        }
      }
    }
  }

  // Rule 3b: Daily-spend anomaly detection (unusual spike days vs monthly average)
  // A day is anomalous when its total spend is at least 2x the average daily spend
  // for the month AND at least the minimum floor amount (avoids tiny-sample noise).
  {
    const ANOMALY_MULTIPLIER = 2;
    const ANOMALY_FLOOR = 100;
    const { start: monthStart, end: monthEnd } = monthRange(month);
    const uid = toObjectId(userId);
    const daily = await Transaction.aggregate([
      { $match: { user: uid, type: "expense", date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    if (daily.length > 0) {
      const totalSpend = daily.reduce((sum, d) => sum + d.total, 0);
      const avgDaily = totalSpend / daily.length;
      const spikeDays = daily.filter((d) => d.total >= Math.max(avgDaily * ANOMALY_MULTIPLIER, ANOMALY_FLOOR));
      for (const spike of spikeDays.slice(0, 3)) {
        tips.push({
          type: "spending_surge",
          severity: "warning",
          categoryId: null,
          categoryName: null,
          title: "Unusual spending spike on " + spike._id,
          body: "You spent Rs " + spike.total.toFixed(2) + " on " + spike._id + " across " + spike.count + " transaction(s) — about " + Math.round(spike.total / Math.max(avgDaily, 1)) + "x your average day this month (Rs " + avgDaily.toFixed(2) + "). Check for one-off or accidental charges.",
          rule: "daily_spend_anomaly",
          metadata: {
            rule: "daily_spend_anomaly",
            day: spike._id,
            amount: Math.round(spike.total * 100) / 100,
            avgDaily: Math.round(avgDaily * 100) / 100,
            multiplier: ANOMALY_MULTIPLIER,
          },
        });
      }
    }
  }

  // Rule 4: Budget warning / exceeded
  const now = new Date();
  const activeBudgets = await Budget.find({
    user: userId,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).populate("category", "name");

  for (const budget of activeBudgets) {
    const catId = budget.category ? (budget.category._id || budget.category) : null;
    if (!catId) continue;
    const spent = await Transaction.aggregate([
      {
        $match: {
          user: toObjectId(userId),
          category: toObjectId(catId),
          type: "expense",
          date: { $gte: new Date(budget.startDate), $lte: new Date(budget.endDate) },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const amountSpent = spent.length > 0 ? spent[0].total : 0;
    const pctUsed = budget.limit > 0 ? (amountSpent / budget.limit) * 100 : 0;
    const catName = budget.category ? (budget.category.name || "this category") : "this category";

    if (pctUsed >= 100) {
      tips.push({
        type: "budget_warning",
        severity: "critical",
        categoryId: catId,
        categoryName: catName,
        title: "Budget Exceeded for " + catName,
        body: "You have spent Rs " + amountSpent.toFixed(2) + " against a budget of Rs " + budget.limit.toFixed(2) + " for " + catName + ". No further spending is recommended this period.",
        rule: "budget_exceeded",
        metadata: {
          rule: "budget_exceeded",
          categoryName: catName,
          limit: budget.limit,
          spent: amountSpent,
          percentage: Math.round(pctUsed),
        },
      });
    } else if (pctUsed >= BUDGET_WARNING_PCT) {
      tips.push({
        type: "budget_warning",
        severity: "warning",
        categoryId: catId,
        categoryName: catName,
        title: "Budget Nearing Limit (" + Math.round(pctUsed) + "%) for " + catName,
        body: "You have used " + Math.round(pctUsed) + "% of your " + catName + " budget (" + amountSpent.toFixed(2) + " of Rs " + budget.limit.toFixed(2) + "). Consider slowing down spending to stay within limits.",
        rule: "budget_warning_gte_80pct",
        metadata: {
          rule: "budget_warning_gte_80pct",
          categoryName: catName,
          limit: budget.limit,
          spent: amountSpent,
          percentage: Math.round(pctUsed),
        },
      });
    }
  }

  // Rule 5: Low savings-goal progress (<10%)
  const activeGoals = await Goal.find({
    user: userId,
    status: { $ne: "completed" },
    deadline: { $gte: now },
  });
  for (const goal of activeGoals) {
    const pctSaved = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    if (pctSaved < LOW_SAVINGS_PCT * 100) {
      tips.push({
        type: "saving_opportunity",
        severity: "warning",
        categoryId: null,
        categoryName: null,
        title: "Low Progress on Savings Goal: \"" + goal.name + "\"",
        body: "You have saved Rs " + goal.currentAmount.toFixed(2) + " of your Rs " + goal.targetAmount.toFixed(2) + " goal \"" + goal.name + "\" (" + pctSaved.toFixed(1) + "%). Try setting aside a fixed amount each week to build momentum.",
        rule: "goal_progress_lt_10pct",
        metadata: {
          rule: "goal_progress_lt_10pct",
          goalId: goal._id,
          goalName: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          percentage: Math.round(pctSaved * 10) / 10,
        },
      });
    }
  }

  // Rule 6: Positive savings rate (>=20%)
  if (current.totalIncome > 0 && current.totalExpense < current.totalIncome) {
    const surplus = current.totalIncome - current.totalExpense;
    const savingsRate = Math.round((surplus / current.totalIncome) * 100);
    if (savingsRate >= 20) {
      tips.push({
        type: "general_summary",
        severity: "success",
        categoryId: null,
        categoryName: null,
        title: "Great job - " + savingsRate + "% Savings Rate This Month!",
        body: "You kept expenses well below income this month (surplus: Rs " + surplus.toFixed(2) + "). Consider channelling the surplus into one of your savings goals.",
        rule: "positive_savings_rate_gte_20pct",
        metadata: {
          rule: "positive_savings_rate_gte_20pct",
          savingsRate,
          surplus,
          totalIncome: current.totalIncome,
          totalExpense: current.totalExpense,
        },
      });
    }
  }

  // Rule 7: No income recorded this month
  if (current.totalIncome === 0) {
    tips.push({
      type: "general_summary",
      severity: "info",
      categoryId: null,
      categoryName: null,
      title: "No income recorded this month",
      body: "You have not logged any income for this month. Make sure to record your allowance, salary, or part-time earnings to get accurate financial insights.",
      rule: "no_income_this_month",
      metadata: {
        rule: "no_income_this_month",
      },
    });
  }

  return enhanceWithAI(tips, { userId, month });
};

/**
 * Modular AI adapter function.
 * Allows seamless extension for optional external AI engines (e.g. Gemini, OpenAI)
 * without making external AI mandatory or breaking core offline functionality.
 */
const enhanceWithAI = async (tips, context) => {
  // If an external AI service provider is plugged in in future, process tips here.
  // Fully operational without any external AI service or API key.
  return tips;
};

/**
 * Converts a raw tip object into an Insight document payload.
 */
const tipToInsight = (userId, month, tip) => ({
  user: userId,
  month,
  summaryText: tip.title,
  tipText: tip.body,
  type: tip.type,
  severity: tip.severity || "info",
  metadata: tip.metadata || { rule: tip.rule },
  category: tip.categoryId || null,
});

/**
 * Generates fresh insights, persists them (replacing any existing for current month),
 * and returns the saved documents.
 */
const generateAndSaveInsights = async (userId) => {
  const month = currentMonthStr();
  const tips = await generateTips(userId);
  if (tips.length === 0) return [];
  await Insight.deleteMany({ user: userId, month });
  const docs = tips.map((t) => tipToInsight(userId, month, t));
  return Insight.insertMany(docs);
};

/**
 * Retrieves persisted insights for the user, optionally filtered by month (YYYY-MM).
 */
const getUserInsights = async (userId, month) => {
  const query = { user: userId };
  if (month) query.month = month;
  return Insight.find(query)
    .populate("category", "name type icon color")
    .sort({ generatedAt: -1 });
};

module.exports = { generateTips, generateAndSaveInsights, getUserInsights, currentMonthStr, enhanceWithAI };
