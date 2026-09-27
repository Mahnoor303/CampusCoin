import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowUpDown,
  Bell,
  BookOpen,
  Bus,
  CalendarDays,
  Check,
  Coffee,
  Download,
  GraduationCap,
  Heart,
  Laptop,
  Lightbulb,
  Plane,
  PiggyBank,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Utensils,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "./utils/cn";
import DashboardAnalytics from "./DashboardAnalytics";

export type FinancePage =
  | "Dashboard"
  | "Transactions"
  | "Categories"
  | "Budget Goals & Alerts"
  | "Student Save Goals"
  | "Reports"
  | "AI Insights & Saving Tips"
  | "Settings";

export interface DashboardSnapshot {
  income: number;
  expenses: number;
  currency: string;
  latestTransactionDate: string;
  transactions: Array<{
    id: number;
    title: string;
    category: string;
    date: string;
    amount: number;
    type: "Income" | "Expense";
  }>;
  goals: Array<{
    id: number;
    name: string;
    saved: number;
    target: number;
  }>;
}

type TransactionType = "Income" | "Expense";

interface Transaction {
  id: number;
  title: string;
  note: string;
  category: string;
  date: string;
  amount: number;
  type: TransactionType;
  method: string;
}

interface CategoryItem {
  id: number;
  name: string;
  type: TransactionType;
}

interface BudgetItem {
  id: number;
  category: string;
  limit: number;
  alerts: boolean;
}

interface SavingGoal {
  id: number;
  name: string;
  purpose: string;
  target: number;
  saved: number;
  deadline: string;
}

const panelClass = "rounded-[26px] border border-black/[0.045] bg-[#f5f5f5]";

const initialTransactions: Transaction[] = [
  { id: 1, title: "Campus coffee", note: "Morning coffee", category: "Food", date: "2023-12-19", amount: 12.5, type: "Expense", method: "Card" },
  { id: 2, title: "Campus scholarship", note: "Fall semester award", category: "Scholarship", date: "2023-12-18", amount: 900, type: "Income", method: "Bank transfer" },
  { id: 3, title: "Metro monthly pass", note: "Student transport", category: "Transport", date: "2023-12-16", amount: 45, type: "Expense", method: "Card" },
  { id: 4, title: "Course textbooks", note: "Semester reading list", category: "Education", date: "2023-12-14", amount: 72.4, type: "Expense", method: "Card" },
  { id: 5, title: "Tutoring session", note: "Freelance income", category: "Part-time job", date: "2023-12-12", amount: 185, type: "Income", method: "Bank transfer" },
  { id: 6, title: "Weekly groceries", note: "Market run", category: "Food", date: "2023-12-10", amount: 38.7, type: "Expense", method: "Card" },
  { id: 7, title: "Music subscription", note: "Monthly subscription", category: "Entertainment", date: "2023-12-07", amount: 9.99, type: "Expense", method: "Auto-pay" },
  { id: 8, title: "Campus assistant shift", note: "Part-time work", category: "Part-time job", date: "2023-11-28", amount: 220, type: "Income", method: "Bank transfer" },
  { id: 9, title: "Art supplies", note: "Studio materials", category: "Shopping", date: "2023-11-26", amount: 38.25, type: "Expense", method: "Card" },
  { id: 10, title: "Pharmacy", note: "Health essentials", category: "Health", date: "2023-11-21", amount: 18.6, type: "Expense", method: "Card" },
  { id: 11, title: "Monthly allowance", note: "Family transfer", category: "Allowance", date: "2023-11-11", amount: 120, type: "Income", method: "Bank transfer" },
  { id: 12, title: "October scholarship", note: "Semester award", category: "Scholarship", date: "2023-10-24", amount: 900, type: "Income", method: "Bank transfer" },
  { id: 13, title: "Course materials", note: "Lab workbook", category: "Education", date: "2023-10-19", amount: 64, type: "Expense", method: "Card" },
  { id: 14, title: "Grocery market", note: "Weekly groceries", category: "Food", date: "2023-10-02", amount: 45, type: "Expense", method: "Card" },
];

const initialCategories: CategoryItem[] = [
  { id: 1, name: "Food", type: "Expense" },
  { id: 2, name: "Transport", type: "Expense" },
  { id: 3, name: "Education", type: "Expense" },
  { id: 4, name: "Shopping", type: "Expense" },
  { id: 5, name: "Entertainment", type: "Expense" },
  { id: 6, name: "Health", type: "Expense" },
  { id: 7, name: "Scholarship", type: "Income" },
  { id: 8, name: "Part-time job", type: "Income" },
  { id: 9, name: "Allowance", type: "Income" },
];

const initialBudgets: BudgetItem[] = [
  { id: 1, category: "Food", limit: 100, alerts: true },
  { id: 2, category: "Transport", limit: 80, alerts: true },
  { id: 3, category: "Education", limit: 80, alerts: true },
  { id: 4, category: "Shopping", limit: 100, alerts: true },
  { id: 5, category: "Entertainment", limit: 40, alerts: false },
];

const initialGoals: SavingGoal[] = [
  { id: 1, name: "Laptop for the semester", purpose: "Campus tech", target: 1400, saved: 820, deadline: "2026-11-30" },
  { id: 2, name: "Study abroad semester", purpose: "Travel", target: 3200, saved: 1160, deadline: "2027-09-01" },
  { id: 3, name: "Student emergency fund", purpose: "Emergency fund", target: 1000, saved: 640, deadline: "2026-12-15" },
];

const studentStorageKey = "n2-student-workspace-v1";
const initialProfile = { name: "Jhon Carter", email: "jhon.carter@northside.edu", school: "Northside University" };
const initialPreferences = { budgetAlerts: true, weeklySummary: true, lowBalance: false };

function readStudentWorkspace() {
  const defaults = {
    transactions: initialTransactions,
    categories: initialCategories,
    budgets: initialBudgets,
    goals: initialGoals,
    currency: "USD",
    profile: initialProfile,
    preferences: initialPreferences,
  };
  try {
    const raw = localStorage.getItem(studentStorageKey);
    if (!raw) return defaults;
    const stored = JSON.parse(raw) as Partial<typeof defaults>;
    return {
      transactions: Array.isArray(stored.transactions) ? stored.transactions : defaults.transactions,
      categories: Array.isArray(stored.categories) ? stored.categories : defaults.categories,
      budgets: Array.isArray(stored.budgets) ? stored.budgets : defaults.budgets,
      goals: Array.isArray(stored.goals) ? stored.goals : defaults.goals,
      currency: typeof stored.currency === "string" ? stored.currency : defaults.currency,
      profile: stored.profile?.email ? stored.profile : defaults.profile,
      preferences: stored.preferences ?? defaults.preferences,
    };
  } catch {
    return defaults;
  }
}

export function readDashboardSnapshot(): DashboardSnapshot {
  const stored = readStudentWorkspace();
  const transactions = stored.transactions;
  return {
    income: transactions.filter((row) => row.type === "Income").reduce((total, row) => total + row.amount, 0),
    expenses: transactions.filter((row) => row.type === "Expense").reduce((total, row) => total + row.amount, 0),
    currency: stored.currency,
    latestTransactionDate: transactions.map((row) => row.date).sort().at(-1) ?? "2023-12-19",
    transactions: transactions.map(({ id, title, category, date, amount, type }) => ({ id, title, category, date, amount, type })),
    goals: stored.goals.map(({ id, name, saved, target }) => ({ id, name, saved, target })),
  };
}

const currencyOptions = ["USD", "EUR", "GBP", "PKR"];

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatDate(date: string) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

function getCategoryIcon(name: string, type: TransactionType): LucideIcon {
  if (name === "Food") return Utensils;
  if (name === "Transport") return Bus;
  if (name === "Education" || name === "Scholarship") return GraduationCap;
  if (name === "Shopping") return ShoppingBag;
  if (name === "Entertainment") return Heart;
  if (name === "Health") return Heart;
  if (name === "Allowance" || name === "Part-time job") return Wallet;
  return type === "Income" ? ArrowDownLeft : Coffee;
}

function getGoalIcon(purpose: string): LucideIcon {
  if (purpose === "Travel") return Plane;
  if (purpose === "Emergency fund") return ShieldCheck;
  if (purpose === "Campus tech") return Laptop;
  if (purpose === "Personal") return Heart;
  return BookOpen;
}

function daysUntil(date: string) {
  const deadline = new Date(`${date}T23:59:59`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
}

function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-[#e1694a]" />
          {eyebrow}
        </div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.04em] text-neutral-900 md:text-[36px]">{title}</h1>
        <p className="mt-2 max-w-[650px] text-[13px] leading-relaxed text-neutral-500 md:text-[14px]">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

function Metric({ label, value, change, icon: Icon }: { label: string; value: string; change?: string; icon: LucideIcon }) {
  return (
    <div className={`${panelClass} p-5`}>
      <div className="flex items-start justify-between">
        <div className="text-[12px] font-medium text-neutral-500">{label}</div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-700">
          <Icon size={16} strokeWidth={1.8} />
        </span>
      </div>
      <div className="mt-3 text-[24px] font-semibold tracking-tight text-neutral-900">{value}</div>
      {change && <div className="mt-1 text-[11px] text-neutral-400">{change}</div>}
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="px-5 py-12 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f5] text-neutral-400">
        <Search size={18} />
      </span>
      <div className="mt-3 text-[14px] font-semibold">{title}</div>
      <div className="mt-1 text-[12px] text-neutral-400">{detail}</div>
    </div>
  );
}

export default function FinancePages({
  activePage,
  onToast,
  onNavigate,
  onDashboardData,
  dashboardPeriod = "Month",
  actionRequest = null,
  onActionConsumed,
}: {
  activePage: FinancePage;
  onToast: (message: string) => void;
  onNavigate?: (page: FinancePage) => void;
  onDashboardData?: (snapshot: DashboardSnapshot) => void;
  dashboardPeriod?: string;
  actionRequest?: { type: "income" | "expense" | "goal"; nonce: number } | null;
  onActionConsumed?: () => void;
}) {
  const [savedWorkspace] = useState(readStudentWorkspace);
  const [transactions, setTransactions] = useState<Transaction[]>(savedWorkspace.transactions);
  const [categories, setCategories] = useState<CategoryItem[]>(savedWorkspace.categories);
  const [budgets, setBudgets] = useState<BudgetItem[]>(savedWorkspace.budgets);
  const [goals, setGoals] = useState<SavingGoal[]>(savedWorkspace.goals);
  const [currency, setCurrency] = useState(savedWorkspace.currency);

  const [transactionQuery, setTransactionQuery] = useState("");
  const [transactionType, setTransactionType] = useState("All types");
  const [transactionCategory, setTransactionCategory] = useState("All categories");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [transactionSort, setTransactionSort] = useState("newest");
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [transactionForm, setTransactionForm] = useState({ title: "", category: "Food", date: "2023-12-19", amount: "", type: "Expense" as TransactionType, method: "Card", note: "" });

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "Expense" as TransactionType });
  const [budgetFormOpen, setBudgetFormOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: "Food", limit: "" });
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null);
  const [editedLimit, setEditedLimit] = useState("");

  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: "", purpose: "Education", target: "", saved: "0", deadline: "2027-05-30" });
  const [contributionGoalId, setContributionGoalId] = useState<number | null>(null);
  const [contributionAmount, setContributionAmount] = useState("25");

  const [reportPeriod, setReportPeriod] = useState("Monthly");
  const [savedTips, setSavedTips] = useState<number[]>([]);
  const [profile, setProfile] = useState(savedWorkspace.profile);
  const [preferences, setPreferences] = useState(savedWorkspace.preferences);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(studentStorageKey, JSON.stringify({ transactions, categories, budgets, goals, currency, profile, preferences }));
    } catch {
      // Keep the workspace usable when browser storage is not available.
    }
  }, [transactions, categories, budgets, goals, currency, profile, preferences]);

  const expenseCategories = categories.filter((category) => category.type === "Expense");
  const incomeCategories = categories.filter((category) => category.type === "Income");
  const expenses = transactions.filter((transaction) => transaction.type === "Expense").reduce((total, transaction) => total + transaction.amount, 0);
  const income = transactions.filter((transaction) => transaction.type === "Income").reduce((total, transaction) => total + transaction.amount, 0);
  const spentFor = (category: string) =>
    transactions
      .filter((transaction) => transaction.type === "Expense" && transaction.category === category)
      .reduce((total, transaction) => total + transaction.amount, 0);
  const earnedFor = (category: string) =>
    transactions
      .filter((transaction) => transaction.type === "Income" && transaction.category === category)
      .reduce((total, transaction) => total + transaction.amount, 0);

  const filteredTransactions = useMemo(() => {
    const query = transactionQuery.trim().toLowerCase();
    return transactions
      .filter((transaction) => transactionType === "All types" || transaction.type === transactionType)
      .filter((transaction) => transactionCategory === "All categories" || transaction.category === transactionCategory)
      .filter((transaction) => !dateFrom || transaction.date >= dateFrom)
      .filter((transaction) => !dateTo || transaction.date <= dateTo)
      .filter((transaction) => !minAmount || transaction.amount >= Number(minAmount))
      .filter((transaction) => !maxAmount || transaction.amount <= Number(maxAmount))
      .filter((transaction) => !query || `${transaction.title} ${transaction.note} ${transaction.category} ${transaction.method}`.toLowerCase().includes(query))
      .sort((a, b) => transactionSort === "amount-high" ? b.amount - a.amount : transactionSort === "amount-low" ? a.amount - b.amount : b.date.localeCompare(a.date));
  }, [transactions, transactionType, transactionCategory, dateFrom, dateTo, minAmount, maxAmount, transactionQuery, transactionSort]);

  const latestTransactionDate = transactions.map((transaction) => transaction.date).sort().at(-1) ?? "2023-12-19";
  const latestYear = latestTransactionDate.slice(0, 4);
  const latestMonth = latestTransactionDate.slice(5, 7);
  const monthSpentFor = (category: string) => transactions
    .filter((transaction) => transaction.type === "Expense" && transaction.category === category && transaction.date.slice(0, 7) === latestTransactionDate.slice(0, 7))
    .reduce((total, transaction) => total + transaction.amount, 0);
  const quarterStartMonth = String(Math.floor((Number(latestMonth) - 1) / 3) * 3 + 1).padStart(2, "0");
  const quarterStartDate = `${latestYear}-${quarterStartMonth}-01`;
  const reportTransactions = transactions.filter((transaction) => {
    if (reportPeriod === "Monthly") return transaction.date.startsWith(latestTransactionDate.slice(0, 7));
    if (reportPeriod === "Quarterly") return transaction.date >= quarterStartDate && transaction.date <= latestTransactionDate;
    if (reportPeriod === "Yearly") return transaction.date.startsWith(latestYear);
    return true;
  });
  const reportIncome = reportTransactions.filter((transaction) => transaction.type === "Income").reduce((total, transaction) => total + transaction.amount, 0);
  const reportExpenses = reportTransactions.filter((transaction) => transaction.type === "Expense").reduce((total, transaction) => total + transaction.amount, 0);
  const reportSavings = reportIncome - reportExpenses;
  const reportCategorySpendRows = expenseCategories
    .map((category) => ({
      ...category,
      amount: reportTransactions
        .filter((transaction) => transaction.type === "Expense" && transaction.category === category.name)
        .reduce((total, transaction) => total + transaction.amount, 0),
    }))
    .sort((a, b) => b.amount - a.amount);
  const reportMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((label, index) => {
    const month = String(index + 1).padStart(2, "0");
    const monthRows = transactions.filter((transaction) => transaction.date.startsWith(`${latestYear}-${month}`));
    return {
      label,
      income: monthRows.filter((transaction) => transaction.type === "Income").reduce((total, transaction) => total + transaction.amount, 0),
      expense: monthRows.filter((transaction) => transaction.type === "Expense").reduce((total, transaction) => total + transaction.amount, 0),
    };
  });
  const maxReportValue = Math.max(...reportMonths.flatMap((month) => [month.income, month.expense]), 1);
  const categorySpendRows = expenseCategories
    .map((category) => ({ ...category, amount: spentFor(category.name) }))
    .sort((a, b) => b.amount - a.amount);
  const totalAlertCount = budgets.filter((budget) => budget.alerts && monthSpentFor(budget.category) >= budget.limit * (alertThreshold / 100)).length;
  const totalGoalSaved = goals.reduce((total, goal) => total + Math.min(goal.saved, goal.target), 0);
  const totalGoalTarget = goals.reduce((total, goal) => total + goal.target, 0);
  const totalGoalProgress = totalGoalTarget > 0 ? Math.round((totalGoalSaved / totalGoalTarget) * 100) : 0;

  const dashboardTransactions = useMemo(() => {
    const latestTime = new Date(`${latestTransactionDate}T00:00:00Z`).getTime();
    return transactions.filter((transaction) => {
      if (dashboardPeriod === "All time") return true;
      if (dashboardPeriod === "Month") return transaction.date.startsWith(latestTransactionDate.slice(0, 7));
      const transactionTime = new Date(`${transaction.date}T00:00:00Z`).getTime();
      const ageInDays = (latestTime - transactionTime) / 86_400_000;
      return dashboardPeriod === "Week" ? ageInDays <= 7 : ageInDays <= 183;
    });
  }, [transactions, dashboardPeriod, latestTransactionDate]);
  const dashboardCategoryRows = expenseCategories
    .map((category) => ({
      ...category,
      amount: dashboardTransactions.filter((transaction) => transaction.type === "Expense" && transaction.category === category.name).reduce((total, transaction) => total + transaction.amount, 0),
    }))
    .sort((a, b) => b.amount - a.amount);
  const dashboardBudgetRows = budgets.map((budget) => ({ ...budget, spent: monthSpentFor(budget.category) }));
  const recentDashboardTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 4);

  useEffect(() => {
    onDashboardData?.({
      income,
      expenses,
      currency,
      latestTransactionDate,
      transactions: transactions.map(({ id, title, category, date, amount, type }) => ({ id, title, category, date, amount, type })),
      goals: goals.map(({ id, name, saved, target }) => ({ id, name, saved, target })),
    });
  }, [onDashboardData, income, expenses, currency, latestTransactionDate, transactions, goals]);

  const downloadCsv = (rows: Transaction[], fileName: string) => {
    const header = ["Date", "Description", "Category", "Type", "Amount", "Method"];
    const csvRows = rows.map((transaction) => [transaction.date, transaction.title, transaction.category, transaction.type, transaction.amount.toFixed(2), transaction.method]);
    const csv = [header, ...csvRows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    onToast("CSV report downloaded");
  };

  const saveTransaction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(transactionForm.amount);
    if (!transactionForm.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      onToast("Enter a description and a valid amount");
      return;
    }
    const newTransaction: Transaction = {
      id: editingTransactionId ?? Date.now(),
      title: transactionForm.title.trim(),
      note: transactionForm.note.trim() || "Student transaction",
      category: transactionForm.category,
      date: transactionForm.date,
      amount,
      type: transactionForm.type,
      method: transactionForm.method,
    };
    const matchingBudget = newTransaction.type === "Expense"
      ? budgets.find((budget) => budget.category === newTransaction.category && budget.alerts)
      : undefined;
    const monthCategorySpend = matchingBudget
      ? transactions
        .filter((transaction) => transaction.id !== editingTransactionId && transaction.type === "Expense" && transaction.category === newTransaction.category && transaction.date.slice(0, 7) === newTransaction.date.slice(0, 7))
        .reduce((total, transaction) => total + transaction.amount, newTransaction.amount)
      : 0;
    const alertRatio = matchingBudget ? Math.round((monthCategorySpend / matchingBudget.limit) * 100) : 0;
    setTransactions((current) => editingTransactionId === null
      ? [newTransaction, ...current]
      : current.map((transaction) => transaction.id === editingTransactionId ? newTransaction : transaction));
    const wasEditing = editingTransactionId !== null;
    setEditingTransactionId(null);
    setTransactionFormOpen(false);
    setTransactionForm({ title: "", category: transactionForm.type === "Income" ? (incomeCategories[0]?.name ?? "Income") : (expenseCategories[0]?.name ?? "Food"), date: "2023-12-19", amount: "", type: transactionForm.type, method: "Card", note: "" });
    onToast(matchingBudget && preferences.budgetAlerts && monthCategorySpend >= matchingBudget.limit * (alertThreshold / 100)
      ? `${newTransaction.category} budget alert: ${alertRatio}% used`
      : wasEditing ? "Transaction updated successfully" : "Transaction added successfully");
  };

  const addCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = categoryForm.name.trim();
    if (!name || categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      onToast(name ? "That category already exists" : "Enter a category name");
      return;
    }
    setCategories((current) => [...current, { id: Date.now(), name, type: categoryForm.type }]);
    setCategoryForm({ name: "", type: "Expense" });
    setCategoryFormOpen(false);
    onToast(`${name} category added`);
  };

  const addBudget = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const limit = Number(budgetForm.limit);
    if (!Number.isFinite(limit) || limit <= 0 || budgets.some((budget) => budget.category === budgetForm.category)) {
      onToast("Choose a new category and enter a valid limit");
      return;
    }
    setBudgets((current) => [...current, { id: Date.now(), category: budgetForm.category, limit, alerts: true }]);
    setBudgetFormOpen(false);
    setBudgetForm({ category: expenseCategories.find((item) => !budgets.some((budget) => budget.category === item.name))?.name ?? "Food", limit: "" });
    onToast("Category budget created");
  };

  const saveBudgetLimit = (id: number) => {
    const limit = Number(editedLimit);
    if (!Number.isFinite(limit) || limit <= 0) {
      onToast("Enter a valid budget amount");
      return;
    }
    setBudgets((current) => current.map((budget) => (budget.id === id ? { ...budget, limit } : budget)));
    setEditingBudgetId(null);
    onToast("Budget limit updated");
  };

  const addGoal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = Number(goalForm.target);
    const saved = Number(goalForm.saved || "0");
    if (!goalForm.name.trim() || !Number.isFinite(target) || target <= 0 || !goalForm.deadline) {
      onToast("Add a goal name, target amount and deadline");
      return;
    }
    setGoals((current) => [...current, { id: Date.now(), name: goalForm.name.trim(), purpose: goalForm.purpose, target, saved: Math.max(0, saved), deadline: goalForm.deadline }]);
    setGoalForm({ name: "", purpose: "Education", target: "", saved: "0", deadline: "2027-05-30" });
    setGoalFormOpen(false);
    onToast("Saving goal created");
  };

  const addContribution = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(contributionAmount);
    if (!Number.isFinite(amount) || amount <= 0 || contributionGoalId === null) {
      onToast("Enter a contribution amount");
      return;
    }
    setGoals((current) => current.map((goal) => (goal.id === contributionGoalId ? { ...goal, saved: goal.saved + amount } : goal)));
    setContributionGoalId(null);
    setContributionAmount("25");
    onToast(`${formatMoney(amount, currency)} added to your goal`);
  };

  const openDashboardTransaction = (type: TransactionType) => {
    setEditingTransactionId(null);
    setTransactionForm({
      title: "",
      category: type === "Income" ? (incomeCategories[0]?.name ?? "Scholarship") : (expenseCategories[0]?.name ?? "Food"),
      date: latestTransactionDate,
      amount: "",
      type,
      method: "Card",
      note: "",
    });
    setTransactionFormOpen(true);
  };

  useEffect(() => {
    if (!actionRequest) return;
    if (actionRequest.type === "goal") {
      setEditingTransactionId(null);
      setGoalForm({ name: "", purpose: "Education", target: "", saved: "0", deadline: "2027-05-30" });
      setGoalFormOpen(true);
      onToast("Create your saving goal");
    } else {
      openDashboardTransaction(actionRequest.type === "income" ? "Income" : "Expense");
      onToast(actionRequest.type === "income" ? "Add a new income entry" : "Add a new expense entry");
    }
    onActionConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionRequest?.nonce]);

  const openPage = (page: FinancePage) => {
    if (onNavigate) onNavigate(page);
    else onToast(`${page} opened`);
  };

  const pageEyebrow = "Student money · 19 December";

  return (
    <main className={cn("animate-[page-in_.35s_ease-out] px-5 pb-8 md:px-10 md:pb-10", activePage === "Dashboard" ? "pt-5 md:pt-7" : "pt-2")}>
      {activePage === "Dashboard" && (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400"><span className="h-1.5 w-1.5 rounded-full bg-[#e1694a]" />Student money · at a glance</div>
              <h1 className="text-[23px] font-semibold tracking-[-0.04em] text-neutral-900 md:text-[28px]">Your financial overview</h1>
              <p className="mt-1 text-[11px] text-neutral-500">A clearer view of your balance, spending and the goals you are working toward.</p>
            </div>
            <button onClick={() => openPage("Transactions")} className="inline-flex items-center gap-1.5 self-start text-[10px] font-semibold text-neutral-500 transition hover:text-[#c85b40] sm:self-auto">View all transactions <ArrowRight size={13} /></button>
          </div>

          {/* Quick actions live directly in the primary dashboard row above:
              Total income → Add income, Total expenses → Add expense, System Lock position → Create Goals. */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Financial insights */}
            <section className={`${panelClass} flex flex-col p-5 lg:col-span-4`}>
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-[15px] font-semibold">Financial insights</h2><p className="mt-1 text-[10px] text-neutral-400">A short read on your habits.</p></div><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#e1694a]"><Sparkles size={16} /></span></div>
              <div className="mt-4 flex-1 space-y-2.5">
                <div className="flex items-start gap-2.5 rounded-2xl border border-[#e1694a]/10 bg-white p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e1694a]/10 text-[#c85b40]">{dashboardCategoryRows[0] ? (() => { const Icon = getCategoryIcon(dashboardCategoryRows[0].name, "Expense"); return <Icon size={14} />; })() : <Sparkles size={14} />}</span>
                  <div className="min-w-0"><div className="text-[10px] font-semibold leading-snug">{dashboardCategoryRows[0]?.amount ? `${dashboardCategoryRows[0].name} leads spending` : "Your story starts here"}</div><p className="mt-1 text-[9px] leading-relaxed text-neutral-500">{dashboardCategoryRows[0]?.amount ? `${formatMoney(dashboardCategoryRows[0].amount, currency)} in ${dashboardPeriod.toLowerCase()}. Weekly check-ins help.` : "Add transactions to see patterns."}</p></div>
                </div>
                <div className={cn("flex items-start gap-2.5 rounded-2xl p-3", totalAlertCount ? "bg-[#fff3ee]" : "bg-white border border-black/[0.05]")}>
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", totalAlertCount ? "bg-[#e1694a] text-white" : "bg-[#f3f3f3] text-neutral-600")}><Bell size={14} /></span>
                  <div className="min-w-0"><div className="text-[10px] font-semibold leading-snug">{totalAlertCount ? `${totalAlertCount} budget ${totalAlertCount === 1 ? "alert" : "alerts"}` : "Alerts are quiet"}</div><p className="mt-1 text-[9px] leading-relaxed text-neutral-500">{totalAlertCount ? "A category is nearing its limit." : "All categories are within limits."}</p></div>
                </div>
              </div>
              <button onClick={() => openPage("AI Insights & Saving Tips")} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#c85b40] transition hover:text-black">Explore your insights <ArrowRight size={12} /></button>
            </section>

            {/* Recent transactions */}
            <section className={`${panelClass} flex flex-col p-5 lg:col-span-4`}>
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-[15px] font-semibold">Recent transactions</h2><p className="mt-1 text-[10px] text-neutral-400">Latest income and expenses.</p></div><button onClick={() => openPage("Transactions")} className="inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold text-neutral-500 transition hover:text-[#c85b40]">All <ArrowRight size={12} /></button></div>
              <div className="mt-3 flex-1 divide-y divide-black/[0.055]">
                {recentDashboardTransactions.length === 0 ? <EmptyState title="No transactions yet" detail="Add your first entry above." /> : recentDashboardTransactions.map((transaction) => {
                  const Icon = getCategoryIcon(transaction.category, transaction.type);
                  return <div key={transaction.id} className="flex items-center gap-2.5 py-2.5">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", transaction.type === "Income" ? "bg-[#e1694a]/10 text-[#c85b40]" : "bg-white text-neutral-600")}><Icon size={14} /></span>
                    <div className="min-w-0 flex-1"><div className="truncate text-[11px] font-semibold">{transaction.title}</div><div className="mt-0.5 truncate text-[9px] text-neutral-400"><span>{transaction.category}</span> · <span>{formatDate(transaction.date)}</span></div></div>
                    <span className={cn("shrink-0 whitespace-nowrap text-[11px] font-semibold", transaction.type === "Income" ? "text-emerald-700" : "text-neutral-900")}>{transaction.type === "Income" ? "+" : "−"}{formatMoney(transaction.amount, currency)}</span>
                  </div>;
                })}
              </div>
            </section>

            {/* Budget overview */}
            <section className={`${panelClass} flex flex-col p-5 lg:col-span-4`}>
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-[15px] font-semibold">Budget overview</h2><p className="mt-1 text-[10px] text-neutral-400">{formatDate(`${latestTransactionDate.slice(0, 7)}-01`).split(" ")[0]} category limits.</p></div><button onClick={() => openPage("Budget Goals & Alerts")} className="shrink-0 text-[9px] font-semibold text-neutral-500 hover:text-[#c85b40]">Manage</button></div>
              <div className="mt-4 flex-1 space-y-3">
                {dashboardBudgetRows.slice(0, 4).map((budget) => {
                  const percent = budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0;
                  const nearLimit = percent >= alertThreshold;
                  return <div key={budget.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2"><span className="truncate text-[10px] font-medium text-neutral-700">{budget.category}</span><span className="shrink-0 text-[9px] font-semibold text-neutral-600">{formatMoney(budget.spent, currency)} <span className="font-normal text-neutral-400">/ {formatMoney(budget.limit, currency)}</span></span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.07]"><div className={cn("h-full rounded-full transition-all duration-700", nearLimit ? "bg-[#e1694a]" : "bg-black/60")} style={{ width: `${Math.min(percent, 100)}%` }} /></div>
                    <div className="mt-1 flex justify-between text-[8px] text-neutral-400"><span>{nearLimit ? "Close to limit" : `${formatMoney(Math.max(0, budget.limit - budget.spent), currency)} left`}</span><span>{percent}%</span></div>
                  </div>;
                })}
                {dashboardBudgetRows.length === 0 && <EmptyState title="No budgets set" detail="Create a budget to stay on track." />}
              </div>
            </section>

            {/* Saving goals */}
            <section className={`${panelClass} p-5 lg:col-span-12`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-[15px] font-semibold">Saving goals</h2><p className="mt-1 text-[10px] text-neutral-400">Active student goals and the amount left to reach each target.</p></div><button onClick={() => openPage("Student Save Goals")} className="inline-flex items-center gap-1 self-start text-[9px] font-semibold text-neutral-500 transition hover:text-[#c85b40] sm:self-auto">View all goals <ArrowRight size={12} /></button></div>
              {goals.length === 0 ? <EmptyState title="No active saving goals" detail="Create your first goal with the quick action above." /> : <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                {goals.slice(0, 3).map((goal) => {
                  const progress = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
                  const GoalIcon = getGoalIcon(goal.purpose);
                  return <div key={goal.id} className="rounded-2xl border border-black/[0.05] bg-white p-4">
                    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#c85b40]"><GoalIcon size={15} /></span><div className="min-w-0"><h3 className="truncate text-[11px] font-semibold">{goal.name}</h3><span className="text-[8px] text-neutral-400">{goal.purpose} · due {formatDate(goal.deadline)}</span></div></div><span className="text-[10px] font-bold text-[#c85b40]">{progress}%</span></div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-[#e1694a] transition-all duration-700" style={{ width: `${progress}%` }} /></div>
                    <div className="mt-2 flex items-center justify-between text-[9px]"><span className="font-semibold text-neutral-700">{formatMoney(goal.saved, currency)} saved</span><span className="text-neutral-400">{formatMoney(Math.max(0, goal.target - goal.saved), currency)} remaining</span></div>
                  </div>;
                })}
              </div>}
            </section>
          </div>

          <DashboardAnalytics
            transactions={dashboardTransactions}
            categories={[
              ...incomeCategories.map((category) => ({
                ...category,
                amount: dashboardTransactions.filter((transaction) => transaction.type === "Income" && transaction.category === category.name).reduce((total, transaction) => total + transaction.amount, 0),
              })),
              ...dashboardCategoryRows,
            ]}
            period={dashboardPeriod}
            currency={currency}
          />

          {transactionFormOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="dashboard-transaction-title">
              <form onSubmit={saveTransaction} className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[26px] border border-black/10 bg-[#fbfbfb] p-5 shadow-2xl md:p-6">
                <div className="mb-4 flex items-start justify-between gap-3"><div><h2 id="dashboard-transaction-title" className="text-[17px] font-semibold">Add {transactionForm.type.toLowerCase()}</h2><p className="mt-1 text-[10px] text-neutral-400">Keep your recent activity and balance up to date.</p></div><button type="button" onClick={() => setTransactionFormOpen(false)} aria-label="Close transaction form" className="flex h-8 w-8 items-center justify-center rounded-full bg-white hover:bg-black hover:text-white"><X size={14} /></button></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-[10px] font-medium text-neutral-500 sm:col-span-2">Description<input value={transactionForm.title} onChange={(event) => setTransactionForm({ ...transactionForm, title: event.target.value })} placeholder="e.g. Campus scholarship" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] outline-none focus:border-[#e1694a]" required /></label>
                  <label className="text-[10px] font-medium text-neutral-500">Type<select value={transactionForm.type} onChange={(event) => { const type = event.target.value as TransactionType; setTransactionForm({ ...transactionForm, type, category: type === "Income" ? (incomeCategories[0]?.name ?? "") : (expenseCategories[0]?.name ?? "") }); }} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] outline-none"><option>Income</option><option>Expense</option></select></label>
                  <label className="text-[10px] font-medium text-neutral-500">Category<select value={transactionForm.category} onChange={(event) => setTransactionForm({ ...transactionForm, category: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] outline-none">{(transactionForm.type === "Income" ? incomeCategories : expenseCategories).map((category) => <option key={category.id}>{category.name}</option>)}</select></label>
                  <label className="text-[10px] font-medium text-neutral-500">Amount<input type="number" min="0.01" step="0.01" value={transactionForm.amount} onChange={(event) => setTransactionForm({ ...transactionForm, amount: event.target.value })} placeholder="0.00" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] outline-none" required /></label>
                  <label className="text-[10px] font-medium text-neutral-500">Date<input type="date" value={transactionForm.date} onChange={(event) => setTransactionForm({ ...transactionForm, date: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] outline-none" required /></label>
                  <label className="text-[10px] font-medium text-neutral-500 sm:col-span-2">Note<input value={transactionForm.note} onChange={(event) => setTransactionForm({ ...transactionForm, note: event.target.value })} placeholder="Optional note" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] outline-none" /></label>
                </div>
                <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setTransactionFormOpen(false)} className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-[11px] font-semibold">Cancel</button><button className="rounded-full bg-[#e1694a] px-5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-black">Save {transactionForm.type.toLowerCase()}</button></div>
              </form>
            </div>
          )}

          {goalFormOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="dashboard-goal-title">
              <form onSubmit={addGoal} className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[26px] border border-black/10 bg-[#fbfbfb] p-5 shadow-2xl md:p-6">
                <div className="mb-4 flex items-start justify-between gap-3"><div><h2 id="dashboard-goal-title" className="text-[17px] font-semibold">Create a student saving goal</h2><p className="mt-1 text-[10px] text-neutral-400">Set a target, a purpose and a date to work toward.</p></div><button type="button" onClick={() => setGoalFormOpen(false)} aria-label="Close goal form" className="flex h-8 w-8 items-center justify-center rounded-full bg-white hover:bg-black hover:text-white"><X size={14} /></button></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-[10px] font-medium text-neutral-500 sm:col-span-2">Goal name<input value={goalForm.name} onChange={(event) => setGoalForm({ ...goalForm, name: event.target.value })} placeholder="e.g. Semester textbooks" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] outline-none focus:border-[#e1694a]" required /></label>
                  <label className="text-[10px] font-medium text-neutral-500">Purpose<select value={goalForm.purpose} onChange={(event) => setGoalForm({ ...goalForm, purpose: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] outline-none"><option>Education</option><option>Campus tech</option><option>Travel</option><option>Emergency fund</option><option>Personal</option></select></label>
                  <label className="text-[10px] font-medium text-neutral-500">Target amount<input type="number" min="1" value={goalForm.target} onChange={(event) => setGoalForm({ ...goalForm, target: event.target.value })} placeholder="1000" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] outline-none" required /></label>
                  <label className="text-[10px] font-medium text-neutral-500">Already saved<input type="number" min="0" value={goalForm.saved} onChange={(event) => setGoalForm({ ...goalForm, saved: event.target.value })} placeholder="0" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] outline-none" /></label>
                  <label className="text-[10px] font-medium text-neutral-500">Deadline<input type="date" value={goalForm.deadline} onChange={(event) => setGoalForm({ ...goalForm, deadline: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] outline-none" required /></label>
                </div>
                <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setGoalFormOpen(false)} className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-[11px] font-semibold">Cancel</button><button className="rounded-full bg-[#e1694a] px-5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-black">Create goal</button></div>
              </form>
            </div>
          )}
        </>
      )}

      {activePage === "Transactions" && (
        <>
          <PageHeading
            eyebrow={pageEyebrow}
            title="Transactions"
            description="Your income and spending, all in one place. Search, filter by date or category, and keep each entry up to date."
            actions={
              <>
                <button onClick={() => downloadCsv(filteredTransactions, "student-transactions.csv")} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-[12px] font-semibold transition hover:border-black">
                  <Download size={14} /> Export
                </button>
                <button onClick={() => { const nextOpen = !transactionFormOpen; setTransactionFormOpen(nextOpen); setEditingTransactionId(null); if (nextOpen) setTransactionForm({ title: "", category: expenseCategories[0]?.name ?? "Food", date: latestTransactionDate, amount: "", type: "Expense", method: "Card", note: "" }); }} className="inline-flex items-center gap-2 rounded-full bg-[#e1694a] px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-black">
                  <Plus size={15} /> Add transaction
                </button>
              </>
            }
          />

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric label="Money in" value={formatMoney(income, currency)} change="Across all recorded income" icon={ArrowDownLeft} />
            <Metric label="Money out" value={formatMoney(expenses, currency)} change="Across all recorded expenses" icon={ArrowUpRight} />
            <Metric label="Net balance" value={formatMoney(income - expenses, currency)} change="Income minus expenses" icon={Wallet} />
          </div>

          {transactionFormOpen && (
            <form onSubmit={saveTransaction} className={`${panelClass} mb-5 p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[15px] font-semibold">{editingTransactionId === null ? "New transaction" : "Edit transaction"}</div>
                <button type="button" onClick={() => { setTransactionFormOpen(false); setEditingTransactionId(null); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-white hover:bg-black hover:text-white" aria-label="Close transaction form"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-[11px] font-medium text-neutral-500">Description<input value={transactionForm.title} onChange={(event) => setTransactionForm({ ...transactionForm, title: event.target.value })} placeholder="e.g. Groceries" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] text-neutral-900 outline-none focus:border-[#e1694a]" /></label>
                <label className="text-[11px] font-medium text-neutral-500">Type<select value={transactionForm.type} onChange={(event) => { const type = event.target.value as TransactionType; setTransactionForm({ ...transactionForm, type, category: type === "Income" ? (incomeCategories[0]?.name ?? "") : (expenseCategories[0]?.name ?? "") }); }} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] text-neutral-900 outline-none focus:border-[#e1694a]"><option>Expense</option><option>Income</option></select></label>
                <label className="text-[11px] font-medium text-neutral-500">Category<select value={transactionForm.category} onChange={(event) => setTransactionForm({ ...transactionForm, category: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] text-neutral-900 outline-none focus:border-[#e1694a]">{(transactionForm.type === "Income" ? incomeCategories : expenseCategories).map((category) => <option key={category.id}>{category.name}</option>)}</select></label>
                <label className="text-[11px] font-medium text-neutral-500">Amount<input type="number" min="0.01" step="0.01" value={transactionForm.amount} onChange={(event) => setTransactionForm({ ...transactionForm, amount: event.target.value })} placeholder="0.00" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] text-neutral-900 outline-none focus:border-[#e1694a]" /></label>
                <label className="text-[11px] font-medium text-neutral-500">Date<input type="date" value={transactionForm.date} onChange={(event) => setTransactionForm({ ...transactionForm, date: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] text-neutral-900 outline-none focus:border-[#e1694a]" /></label>
                <label className="text-[11px] font-medium text-neutral-500">Payment method<select value={transactionForm.method} onChange={(event) => setTransactionForm({ ...transactionForm, method: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] text-neutral-900 outline-none focus:border-[#e1694a]"><option>Card</option><option>Cash</option><option>Bank transfer</option><option>Auto-pay</option></select></label>
                <label className="text-[11px] font-medium text-neutral-500 sm:col-span-2">Note<input value={transactionForm.note} onChange={(event) => setTransactionForm({ ...transactionForm, note: event.target.value })} placeholder="Optional note" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] text-neutral-900 outline-none focus:border-[#e1694a]" /></label>
              </div>
              <div className="mt-4 flex justify-end"><button className="rounded-full bg-black px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#e1694a]">{editingTransactionId === null ? "Save transaction" : "Save changes"}</button></div>
            </form>
          )}

          <section className={panelClass}>
            <div className="flex flex-col gap-3 border-b border-black/[0.06] p-4 md:flex-row md:items-center md:justify-between md:p-5">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-black/[0.07] bg-white px-3 py-2.5 md:max-w-[260px]">
                <Search size={15} className="shrink-0 text-neutral-400" />
                <input value={transactionQuery} onChange={(event) => setTransactionQuery(event.target.value)} placeholder="Search transactions" className="w-full bg-transparent text-[12px] outline-none placeholder:text-neutral-400" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={transactionType} onChange={(event) => setTransactionType(event.target.value)} className="rounded-full border border-black/10 bg-white px-3 py-2.5 text-[11px] font-medium outline-none"><option>All types</option><option>Income</option><option>Expense</option></select>
                <select value={transactionCategory} onChange={(event) => setTransactionCategory(event.target.value)} className="max-w-[160px] rounded-full border border-black/10 bg-white px-3 py-2.5 text-[11px] font-medium outline-none"><option>All categories</option>{categories.map((category) => <option key={category.id}>{category.name}</option>)}</select>
                <label className="sr-only" htmlFor="date-from">From date</label><input id="date-from" aria-label="From date" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="min-w-0 rounded-full border border-black/10 bg-white px-3 py-2 text-[10px] font-medium outline-none" />
                <label className="sr-only" htmlFor="date-to">To date</label><input id="date-to" aria-label="To date" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="min-w-0 rounded-full border border-black/10 bg-white px-3 py-2 text-[10px] font-medium outline-none" />
                <input aria-label="Minimum transaction amount" type="number" min="0" value={minAmount} onChange={(event) => setMinAmount(event.target.value)} placeholder="Min amount" className="w-[94px] rounded-full border border-black/10 bg-white px-3 py-2.5 text-[10px] font-medium outline-none placeholder:text-neutral-400" />
                <input aria-label="Maximum transaction amount" type="number" min="0" value={maxAmount} onChange={(event) => setMaxAmount(event.target.value)} placeholder="Max amount" className="w-[94px] rounded-full border border-black/10 bg-white px-3 py-2.5 text-[10px] font-medium outline-none placeholder:text-neutral-400" />
                <select aria-label="Sort transactions" value={transactionSort} onChange={(event) => setTransactionSort(event.target.value)} className="rounded-full border border-black/10 bg-white px-3 py-2.5 text-[10px] font-medium outline-none"><option value="newest">Newest</option><option value="amount-high">Amount: high to low</option><option value="amount-low">Amount: low to high</option></select>
                {(transactionQuery || transactionType !== "All types" || transactionCategory !== "All categories" || dateFrom || dateTo || minAmount || maxAmount || transactionSort !== "newest") && <button onClick={() => { setTransactionQuery(""); setTransactionType("All types"); setTransactionCategory("All categories"); setDateFrom(""); setDateTo(""); setMinAmount(""); setMaxAmount(""); setTransactionSort("newest"); }} className="px-2 text-[11px] font-semibold text-[#e1694a]">Clear</button>}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead><tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400"><th className="px-5 py-3">Transaction</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Method</th><th className="px-5 py-3 text-right">Amount</th><th className="px-4 py-3 text-right">Manage</th></tr></thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const Icon = getCategoryIcon(transaction.category, transaction.type);
                    return <tr key={transaction.id} className="border-t border-black/[0.045] transition hover:bg-white/70">
                      <td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className={cn("flex h-9 w-9 items-center justify-center rounded-full", transaction.type === "Income" ? "bg-[#e1694a]/10 text-[#e1694a]" : "bg-white text-neutral-600")}><Icon size={15} /></span><div><div className="text-[12px] font-semibold text-neutral-900">{transaction.title}</div><div className="mt-0.5 text-[10px] text-neutral-400">{transaction.note}</div></div></div></td>
                      <td className="px-4 py-3.5"><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-neutral-600">{transaction.category}</span></td>
                      <td className="px-4 py-3.5 text-[11px] text-neutral-500">{formatDate(transaction.date)}</td>
                      <td className="px-4 py-3.5 text-[11px] text-neutral-500">{transaction.method}</td>
                      <td className={cn("px-5 py-3.5 text-right text-[12px] font-semibold", transaction.type === "Income" ? "text-emerald-700" : "text-neutral-900")}>{transaction.type === "Income" ? "+" : "−"}{formatMoney(transaction.amount, currency)}</td>
                      <td className="px-4 py-3.5"><div className="flex justify-end gap-1"><button onClick={() => { setEditingTransactionId(transaction.id); setTransactionForm({ title: transaction.title, note: transaction.note, category: transaction.category, date: transaction.date, amount: String(transaction.amount), type: transaction.type, method: transaction.method }); setTransactionFormOpen(true); }} className="rounded-full px-2.5 py-1.5 text-[10px] font-semibold text-neutral-500 transition hover:bg-white hover:text-black">Edit</button><button onClick={() => { setTransactions((current) => current.filter((item) => item.id !== transaction.id)); onToast("Transaction deleted"); }} className="rounded-full px-2.5 py-1.5 text-[10px] font-semibold text-neutral-400 transition hover:bg-red-50 hover:text-red-600">Delete</button></div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
              {filteredTransactions.length === 0 && <EmptyState title="No matching transactions" detail="Try changing your search or filters." />}
            </div>
            <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3 text-[10px] text-neutral-400"><span>{filteredTransactions.length} transactions</span><span>{transactionSort === "newest" ? "Sorted by newest" : transactionSort === "amount-high" ? "Amount: high to low" : "Amount: low to high"}</span></div>
          </section>
        </>
      )}

      {activePage === "Categories" && (
        <>
          <PageHeading
            eyebrow={pageEyebrow}
            title="Categories"
            description="Give every dollar a place. Organize income and expenses into categories that make your student spending easier to understand."
            actions={<button onClick={() => setCategoryFormOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-full bg-[#e1694a] px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-black"><Plus size={15} /> Add category</button>}
          />
          {categoryFormOpen && <form onSubmit={addCategory} className={`${panelClass} mb-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-end`}>
            <label className="flex-1 text-[11px] font-medium text-neutral-500">Category name<input value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} placeholder="e.g. Books" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#e1694a]" /></label>
            <label className="text-[11px] font-medium text-neutral-500">Category type<select value={categoryForm.type} onChange={(event) => setCategoryForm({ ...categoryForm, type: event.target.value as TransactionType })} className="mt-1.5 w-full min-w-[150px] rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] outline-none"><option>Expense</option><option>Income</option></select></label>
            <button className="rounded-full bg-black px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-[#e1694a]">Save category</button>
          </form>}

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric label="Expense categories" value={String(expenseCategories.length).padStart(2, "0")} change="Spending groups" icon={ArrowUpRight} />
            <Metric label="Income categories" value={String(incomeCategories.length).padStart(2, "0")} change="Ways money comes in" icon={ArrowDownLeft} />
            <Metric label="Uncategorized" value="0" change="All transactions are assigned" icon={Check} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(["Expense", "Income"] as const).map((type) => {
              const rows = categories.filter((category) => category.type === type);
              return <section key={type} className={`${panelClass} p-5`}>
                <div className="mb-4 flex items-center justify-between"><div><div className="text-[16px] font-semibold">{type === "Expense" ? "Spending categories" : "Income categories"}</div><div className="mt-1 text-[11px] text-neutral-400">{type === "Expense" ? "Where your money goes" : "Where your money comes from"}</div></div><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-neutral-500">{rows.length} categories</span></div>
                <div className="divide-y divide-black/[0.06]">
                  {rows.map((category) => {
                    const Icon = getCategoryIcon(category.name, category.type);
                    const amount = category.type === "Expense" ? spentFor(category.name) : earnedFor(category.name);
                    const total = category.type === "Expense" ? expenses : income;
                    const share = total > 0 ? Math.round((amount / total) * 100) : 0;
                    const count = transactions.filter((transaction) => transaction.category === category.name).length;
                    return <div key={category.id} className="flex items-center gap-3 py-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-700"><Icon size={16} /></span>
                      <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="truncate text-[12px] font-semibold">{category.name}</span><span className="whitespace-nowrap text-[12px] font-semibold">{formatMoney(amount, currency)}</span></div><div className="mt-1.5 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-[#e1694a] transition-all" style={{ width: `${Math.max(amount > 0 ? 3 : 0, share)}%` }} /></div><span className="w-8 text-right text-[9px] text-neutral-400">{share}%</span><span className="w-16 text-right text-[9px] text-neutral-400">{count} items</span></div></div>
                      <button onClick={() => { if (count > 0) { onToast("Move or remove its transactions before deleting this category"); return; } setCategories((current) => current.filter((item) => item.id !== category.id)); setBudgets((current) => current.filter((budget) => budget.category !== category.name)); onToast(`${category.name} category removed`); }} title={`Remove ${category.name}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-300 transition hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>;
                  })}
                  {rows.length === 0 && <EmptyState title={`No ${type.toLowerCase()} categories`} detail="Add a category to organize your activity." />}
                </div>
              </section>;
            })}
          </div>
        </>
      )}

      {activePage === "Budget Goals & Alerts" && (
        <>
          <PageHeading
            eyebrow={pageEyebrow}
            title="Budget goals & alerts"
            description="Set a monthly limit for each spending category. We will flag budgets that are getting close to their limit."
            actions={<button onClick={() => setBudgetFormOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-full bg-[#e1694a] px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-black"><Plus size={15} /> Create budget</button>}
          />
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric label="Monthly budget" value={formatMoney(budgets.reduce((total, budget) => total + budget.limit, 0), currency)} change={`${budgets.length} category limits`} icon={Wallet} />
            <Metric label="Spent so far" value={formatMoney(budgets.reduce((total, budget) => total + monthSpentFor(budget.category), 0), currency)} change="Across budgeted categories" icon={TrendingDown} />
            <Metric label="Active alerts" value={String(totalAlertCount).padStart(2, "0")} change="Categories near their limit" icon={Bell} />
          </div>
          {budgetFormOpen && <form onSubmit={addBudget} className={`${panelClass} mb-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-end`}>
            <label className="flex-1 text-[11px] font-medium text-neutral-500">Category<select value={budgetForm.category} onChange={(event) => setBudgetForm({ ...budgetForm, category: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] outline-none">{expenseCategories.filter((category) => !budgets.some((budget) => budget.category === category.name)).map((category) => <option key={category.id}>{category.name}</option>)}</select></label>
            <label className="text-[11px] font-medium text-neutral-500">Monthly limit<input type="number" min="1" step="1" value={budgetForm.limit} onChange={(event) => setBudgetForm({ ...budgetForm, limit: event.target.value })} placeholder="e.g. 120" className="mt-1.5 w-full min-w-[150px] rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#e1694a]" /></label>
            <button className="rounded-full bg-black px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-[#e1694a]">Save budget</button>
          </form>}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_0.85fr]">
            <section className={`${panelClass} p-5`}>
              <div className="mb-4 flex items-center justify-between"><div><h2 className="text-[16px] font-semibold">Category limits</h2><p className="mt-1 text-[11px] text-neutral-400">December 2023 spending against your plan</p></div><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-medium text-neutral-500">Monthly</span></div>
              <div className="space-y-4">
                {budgets.map((budget) => {
                  const spent = monthSpentFor(budget.category);
                  const percent = Math.round((spent / budget.limit) * 100);
                  const nearLimit = percent >= alertThreshold;
                  const Icon = getCategoryIcon(budget.category, "Expense");
                  return <div key={budget.id} className="rounded-2xl border border-black/[0.05] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f5] text-neutral-700"><Icon size={15} /></span><div><div className="text-[12px] font-semibold">{budget.category}</div><div className="mt-0.5 text-[10px] text-neutral-400">{formatMoney(spent, currency)} spent of {formatMoney(budget.limit, currency)}</div></div></div>
                      <div className="flex items-center gap-2"><span className={cn("rounded-full px-2.5 py-1 text-[9px] font-semibold", nearLimit ? "bg-[#e1694a]/10 text-[#c85b40]" : "bg-neutral-100 text-neutral-500")}>{percent}% used</span><button onClick={() => { setEditingBudgetId(editingBudgetId === budget.id ? null : budget.id); setEditedLimit(String(budget.limit)); }} className="text-[10px] font-semibold text-neutral-400 transition hover:text-black">Edit</button></div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/[0.06]"><div className={cn("h-full rounded-full transition-all duration-500", nearLimit ? "bg-[#e1694a]" : "bg-black")} style={{ width: `${Math.min(percent, 100)}%` }} /></div>
                    <div className="mt-2 flex items-center justify-between text-[9px] text-neutral-400"><span>{nearLimit ? "Getting close to your limit" : `${formatMoney(Math.max(0, budget.limit - spent), currency)} left this month`}</span><button onClick={() => setBudgets((current) => current.map((item) => item.id === budget.id ? { ...item, alerts: !item.alerts } : item))} className={cn("font-semibold", budget.alerts ? "text-[#e1694a]" : "text-neutral-400")}>{budget.alerts ? "Alerts on" : "Alerts off"}</button></div>
                    {editingBudgetId === budget.id && <div className="mt-3 flex gap-2"><input type="number" min="1" value={editedLimit} onChange={(event) => setEditedLimit(event.target.value)} className="w-32 rounded-full border border-black/10 bg-[#f7f7f7] px-3 py-2 text-[11px] outline-none focus:border-[#e1694a]" aria-label={`New ${budget.category} budget limit`} /><button onClick={() => saveBudgetLimit(budget.id)} className="rounded-full bg-black px-4 py-2 text-[10px] font-semibold text-white">Save limit</button><button onClick={() => setEditingBudgetId(null)} className="rounded-full bg-[#f5f5f5] px-3 py-2 text-[10px] font-medium">Cancel</button></div>}
                  </div>;
                })}
                {budgets.length === 0 && <EmptyState title="No budgets yet" detail="Create a category budget to start tracking." />}
              </div>
            </section>

            <div className="flex flex-col gap-4">
              <section className={`${panelClass} p-5`}>
                <div className="flex items-start justify-between"><div><div className="text-[15px] font-semibold">Alert preferences</div><div className="mt-1 text-[11px] text-neutral-400">Choose when we nudge you</div></div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#e1694a]"><Bell size={16} /></span></div>
                <label className="mt-5 block text-[11px] font-medium text-neutral-600">Notify me when a budget reaches <span className="font-bold text-[#e1694a]">{alertThreshold}%</span><input type="range" min="50" max="100" step="5" value={alertThreshold} onChange={(event) => setAlertThreshold(Number(event.target.value))} className="mt-3 w-full accent-[#e1694a]" /></label>
                <div className="mt-1 flex justify-between text-[9px] text-neutral-400"><span>50% · Early heads-up</span><span>100% · At limit</span></div>
                <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-4"><div><div className="text-[11px] font-semibold">Budget notifications</div><div className="mt-0.5 text-[10px] text-neutral-400">Show in-app alerts when close</div></div><button onClick={() => setPreferences((current) => ({ ...current, budgetAlerts: !current.budgetAlerts }))} role="switch" aria-checked={preferences.budgetAlerts} className={cn("relative h-6 w-11 rounded-full transition", preferences.budgetAlerts ? "bg-[#e1694a]" : "bg-black/15")}><span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", preferences.budgetAlerts ? "left-6" : "left-1")} /></button></div>
              </section>
              <section className="rounded-[26px] bg-black p-5 text-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#e1694a]"><AlertCircle size={17} /></span>
                <div className="mt-4 text-[22px] font-semibold tracking-tight">{preferences.budgetAlerts ? `${totalAlertCount} budget ${totalAlertCount === 1 ? "needs" : "need"} attention` : "Alerts are paused"}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-white/55">{preferences.budgetAlerts ? "A quick check-in now can help keep the rest of your month on track." : "Turn on budget notifications whenever you are ready."}</p>
              </section>
            </div>
          </div>
        </>
      )}

      {activePage === "Student Save Goals" && (
        <>
          <PageHeading
            eyebrow="Student money · Your next milestone"
            title="Student Save Goals"
            description="Plan for the things that move student life forward, from course essentials and a new laptop to travel and a safety net."
            actions={<button onClick={() => setGoalFormOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-full bg-[#e1694a] px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-black"><Plus size={15} /> Create student goal</button>}
          />

          <section className="relative mb-5 overflow-hidden rounded-[26px] bg-[#111] p-5 text-white md:p-7">
            <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/[0.06]" />
            <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/[0.06]" />
            <div className="relative grid items-center gap-7 md:grid-cols-[1fr_auto]">
              <div className="max-w-[600px]">
                <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[#e1694a]"><GraduationCap size={15} /></span>Your student savings plan</div>
                <h2 className="mt-4 max-w-[520px] text-[25px] font-medium leading-tight tracking-[-0.04em] md:text-[32px]">Your next campus milestone, one deposit at a time.</h2>
                <p className="mt-2 max-w-[440px] text-[11px] leading-relaxed text-white/50 md:text-[12px]">Set a target for school, student life or a little more financial breathing room. We will help you keep the plan in sight.</p>
                <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                  <div><div className="text-[9px] uppercase tracking-[0.12em] text-white/40">Saved across goals</div><div className="mt-1 text-[19px] font-semibold">{formatMoney(totalGoalSaved, currency)}</div></div>
                  <div><div className="text-[9px] uppercase tracking-[0.12em] text-white/40">Combined target</div><div className="mt-1 text-[19px] font-semibold">{formatMoney(totalGoalTarget, currency)}</div></div>
                </div>
              </div>
              <div className="flex items-center gap-4 self-center rounded-[22px] border border-white/10 bg-white/[0.04] p-4 pr-5">
                <div className="relative flex h-[82px] w-[82px] shrink-0 items-center justify-center">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#e1694a" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${totalGoalProgress * 2.387} 238.7`} className="transition-all duration-700" />
                  </svg>
                  <div className="text-center"><div className="text-[17px] font-semibold">{totalGoalProgress}%</div><div className="text-[8px] text-white/45">overall</div></div>
                </div>
                <div><div className="text-[12px] font-semibold">{goals.length} active {goals.length === 1 ? "goal" : "goals"}</div><div className="mt-1 max-w-[115px] text-[9px] leading-relaxed text-white/45">Every contribution moves your plan forward.</div></div>
              </div>
            </div>
          </section>

          {goalFormOpen && <form onSubmit={addGoal} className={`${panelClass} mb-5 p-5`}>
            <div className="mb-4 flex items-center justify-between"><div><div className="text-[15px] font-semibold">Create a student saving goal</div><p className="mt-1 text-[10px] text-neutral-400">Choose a purpose, set a target and pick your deadline.</p></div><button type="button" onClick={() => setGoalFormOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white hover:bg-black hover:text-white"><X size={14} /></button></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="text-[11px] font-medium text-neutral-500">Goal name<input value={goalForm.name} onChange={(event) => setGoalForm({ ...goalForm, name: event.target.value })} placeholder="e.g. New tablet" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#e1694a]" /></label>
              <label className="text-[11px] font-medium text-neutral-500">Student goal type<select value={goalForm.purpose} onChange={(event) => setGoalForm({ ...goalForm, purpose: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#e1694a]"><option>Education</option><option>Campus tech</option><option>Travel</option><option>Emergency fund</option><option>Personal</option></select></label>
              <label className="text-[11px] font-medium text-neutral-500">Target amount<input type="number" min="1" value={goalForm.target} onChange={(event) => setGoalForm({ ...goalForm, target: event.target.value })} placeholder="1000" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#e1694a]" /></label>
              <label className="text-[11px] font-medium text-neutral-500">Already saved<input type="number" min="0" value={goalForm.saved} onChange={(event) => setGoalForm({ ...goalForm, saved: event.target.value })} placeholder="0" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#e1694a]" /></label>
              <label className="text-[11px] font-medium text-neutral-500">Target date<input type="date" value={goalForm.deadline} onChange={(event) => setGoalForm({ ...goalForm, deadline: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#e1694a]" /></label>
            </div>
            <div className="mt-4 flex justify-end"><button className="rounded-full bg-black px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#e1694a]">Create goal</button></div>
          </form>}

          <div className="mb-4 flex items-end justify-between gap-4">
            <div><h2 className="text-[17px] font-semibold tracking-tight">Your student goals</h2><p className="mt-1 text-[11px] text-neutral-400">Education, campus tech, travel and a safety net.</p></div>
            <span className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-500">{goals.length} active</span>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {goals.map((goal) => {
              const progress = Math.min(100, Math.round((goal.saved / goal.target) * 100));
              const remaining = Math.max(0, goal.target - goal.saved);
              const remainingDays = daysUntil(goal.deadline);
              const weeklyAmount = remainingDays > 0 ? Math.ceil((remaining / (remainingDays / 7)) * 100) / 100 : remaining;
              const GoalIcon = getGoalIcon(goal.purpose);
              return <section key={goal.id} className={`${panelClass} p-5 md:p-6`}>
                <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#e1694a]"><GoalIcon size={19} /></span><span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-semibold text-neutral-500">{goal.purpose}</span></div><button onClick={() => { setGoals((current) => current.filter((item) => item.id !== goal.id)); onToast("Student saving goal removed"); }} title={`Remove ${goal.name}`} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-300 transition hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button></div>
                <div className="mt-5 flex items-end justify-between gap-3"><div><h3 className="text-[17px] font-semibold tracking-tight">{goal.name}</h3><p className="mt-1 text-[11px] text-neutral-400">Deadline · {formatDate(goal.deadline)}</p></div><span className="text-[13px] font-bold text-[#e1694a]">{progress}%</span></div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-[#e1694a] transition-all duration-700" style={{ width: `${progress}%` }} /></div>
                <div className="mt-3 flex items-center justify-between"><div><div className="text-[19px] font-semibold tracking-tight">{formatMoney(goal.saved, currency)}</div><div className="text-[10px] text-neutral-400">of {formatMoney(goal.target, currency)} · {formatMoney(remaining, currency)} to go</div></div><button onClick={() => { setContributionGoalId(goal.id); setContributionAmount("25"); }} className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#e1694a]"><Plus size={13} /> Add money</button></div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3 text-[10px]"><span className="text-neutral-400">{remainingDays >= 0 ? `${remainingDays} days until your deadline` : "Deadline passed · update your target date"}</span><span className="text-right font-semibold text-neutral-700">{remaining <= 0 ? "Goal reached" : remainingDays > 0 ? `${formatMoney(weeklyAmount, currency)} / week to stay on track` : "Set a new deadline"}</span></div>
                {contributionGoalId === goal.id && <form onSubmit={addContribution} className="mt-4 flex gap-2 border-t border-black/[0.06] pt-4"><label className="sr-only" htmlFor={`contribution-${goal.id}`}>Contribution amount</label><div className="flex flex-1 items-center rounded-full border border-black/10 bg-white px-3"><span className="mr-2 text-[11px] text-neutral-400">{currency}</span><input id={`contribution-${goal.id}`} type="number" min="0.01" step="0.01" value={contributionAmount} onChange={(event) => setContributionAmount(event.target.value)} className="w-full bg-transparent py-2 text-[12px] outline-none" /></div><button className="rounded-full bg-[#e1694a] px-4 py-2 text-[10px] font-semibold text-white">Add</button><button type="button" onClick={() => setContributionGoalId(null)} className="rounded-full bg-white px-3 py-2 text-[10px] font-medium">Cancel</button></form>}
              </section>;
            })}
            {goals.length === 0 && <div className={`${panelClass} lg:col-span-2`}><EmptyState title="Start with your first student goal" detail="Pick a campus milestone and turn it into a saving plan." /></div>}
          </div>
        </>
      )}

      {activePage === "Reports" && (
        <>
          <PageHeading
            eyebrow={pageEyebrow}
            title="Reports"
            description="A clearer picture of your money. Review income, expenses and savings by period, then export the details when you need them."
            actions={<><select value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value)} className="rounded-full border border-black/10 bg-white px-4 py-3 text-[11px] font-semibold outline-none"><option>Monthly</option><option>Quarterly</option><option>Yearly</option><option>All time</option></select><button onClick={() => downloadCsv(reportTransactions, `student-report-${reportPeriod.toLowerCase().replace(/ /g, "-")}.csv`)} className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-[#e1694a]"><Download size={14} /> Export report</button></>}
          />
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric label="Income" value={formatMoney(reportIncome, currency)} change={`${reportPeriod} view · latest activity ${formatDate(latestTransactionDate)}`} icon={ArrowDownLeft} />
            <Metric label="Expenses" value={formatMoney(reportExpenses, currency)} change={`${reportPeriod} view · latest activity ${formatDate(latestTransactionDate)}`} icon={ArrowUpRight} />
            <Metric label="Savings" value={formatMoney(reportSavings, currency)} change={reportSavings >= 0 ? "You earned more than you spent" : "Expenses are above income"} icon={PiggyBank} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <section className={`${panelClass} p-5 md:p-6`}>
              <div className="flex items-start justify-between"><div><h2 className="text-[16px] font-semibold">Income vs. expenses</h2><p className="mt-1 text-[11px] text-neutral-400">Monthly cash flow · {latestYear}</p></div><div className="flex gap-3 text-[10px]"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#e1694a]" />Income</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-black/20" />Expenses</span></div></div>
              <div className="mt-7 flex h-[220px] items-end gap-2 border-b border-black/[0.08] pb-0 sm:gap-3">
                {reportMonths.map((month) => <div key={month.label} className="flex h-full min-w-0 flex-1 flex-col justify-end"><div className="flex h-[185px] items-end justify-center gap-1 sm:gap-1.5"><div title={`${month.label} income ${formatMoney(month.income, currency)}`} className="w-[34%] max-w-5 rounded-t-md bg-[#e1694a] transition-all hover:opacity-75" style={{ height: `${month.income ? Math.max(4, (month.income / maxReportValue) * 100) : 0}%` }} /><div title={`${month.label} expenses ${formatMoney(month.expense, currency)}`} className="w-[34%] max-w-5 rounded-t-md bg-black/15 transition-all hover:bg-black/35" style={{ height: `${month.expense ? Math.max(4, (month.expense / maxReportValue) * 100) : 0}%` }} /></div><span className="mt-2 text-center text-[9px] text-neutral-400">{month.label}</span></div>)}
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] text-neutral-400"><span>Period selected: <strong className="font-semibold text-neutral-700">{reportPeriod}</strong></span><span>Net savings <strong className={cn("font-semibold", reportSavings >= 0 ? "text-emerald-700" : "text-[#e1694a]")}>{formatMoney(reportSavings, currency)}</strong></span></div>
            </section>
            <section className={`${panelClass} p-5 md:p-6`}>
              <div className="flex items-start justify-between"><div><h2 className="text-[16px] font-semibold">Spending by category</h2><p className="mt-1 text-[11px] text-neutral-400">Find the biggest parts of your budget</p></div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white"><ArrowUpDown size={15} /></span></div>
              <div className="mt-4 space-y-4">
                {reportCategorySpendRows.slice(0, 5).map((category) => {
                  const Icon = getCategoryIcon(category.name, category.type);
                  const share = reportExpenses ? Math.round((category.amount / reportExpenses) * 100) : 0;
                  return <div key={category.id}><div className="mb-1.5 flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-[11px] font-medium"><Icon size={13} className="text-neutral-400" />{category.name}</span><span className="text-[11px] font-semibold">{formatMoney(category.amount, currency)} <span className="ml-1 text-[9px] font-normal text-neutral-400">{share}%</span></span></div><div className="h-1.5 rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-[#e1694a]" style={{ width: `${Math.max(category.amount ? 3 : 0, share)}%` }} /></div></div>;
                })}
                {reportCategorySpendRows.length === 0 && <EmptyState title="No expense data yet" detail="Add transactions to see a breakdown." />}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white p-3 text-[10px] leading-relaxed text-neutral-500"><CalendarDays size={15} className="shrink-0 text-[#e1694a]" />Report values update automatically when transactions are added or edited.</div>
            </section>
          </div>
        </>
      )}

      {activePage === "AI Insights & Saving Tips" && (
        <>
          <PageHeading
            eyebrow="Personal finance · Smart insights"
            title="Your money, made clearer."
            description="Patterns from your student transaction history, with practical ideas to help your savings go further."
            actions={<span className="inline-flex items-center gap-2 rounded-full border border-[#e1694a]/20 bg-[#e1694a]/[0.06] px-4 py-2.5 text-[10px] font-semibold text-[#c85b40]"><Sparkles size={14} /> Updated from your activity</span>}
          />
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric label="Income tracked" value={formatMoney(income, currency)} change="Across all recorded transactions" icon={ArrowDownLeft} />
            <Metric label="Expenses tracked" value={formatMoney(expenses, currency)} change="Across all recorded transactions" icon={ArrowUpRight} />
            <Metric label="Savings rate" value={`${income > 0 ? Math.max(0, Math.round(((income - expenses) / income) * 100)) : 0}%`} change="Net income kept this period" icon={TrendingUp} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <section className={`${panelClass} p-5 md:p-6`}>
              <div className="mb-4 flex items-center justify-between"><div><h2 className="text-[16px] font-semibold">Your spending patterns</h2><p className="mt-1 text-[11px] text-neutral-400">A few things worth noticing</p></div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#e1694a]"><Sparkles size={16} /></span></div>
              <div className="space-y-3">
                {(() => {
                  const topCategory = categorySpendRows[0];
                  const educationBudget = budgets.find((budget) => budget.category === "Education");
                  const educationSpent = monthSpentFor("Education");
                  const subscriptionSpend = transactions.filter((transaction) => transaction.type === "Expense" && /subscription/i.test(`${transaction.title} ${transaction.note}`)).reduce((total, transaction) => total + transaction.amount, 0);
                  const net = income - expenses;
                  const insightRows = [
                    { icon: topCategory ? getCategoryIcon(topCategory.name, "Expense") : Lightbulb, label: "Biggest spending category", title: topCategory ? `${topCategory.name} is your top expense` : "Add transactions to spot trends", detail: topCategory ? `${formatMoney(topCategory.amount, currency)} across your records. Small weekly changes can add up by the end of term.` : "Once you add a few transactions, patterns will show up here.", tone: "orange" },
                    { icon: AlertCircle, label: "Budget check-in", title: educationBudget && educationSpent >= educationBudget.limit * (alertThreshold / 100) ? "Education is getting close to its limit" : "Keep an eye on your monthly limits", detail: educationBudget ? `${formatMoney(educationSpent, currency)} of ${formatMoney(educationBudget.limit, currency)} used for Education. You can adjust this limit in Budget Goals & Alerts.` : "Set a category budget to get more useful alerts.", tone: "dark" },
                    { icon: TrendingDown, label: "Recurring costs", title: subscriptionSpend > 0 ? "Check in on recurring subscriptions" : "Review recurring costs once a month", detail: subscriptionSpend > 0 ? `We found ${formatMoney(subscriptionSpend, currency)} in subscription-labelled expenses. Keep the ones you use and pause the rest.` : "A quick subscription review can uncover costs you no longer need.", tone: "soft" },
                    { icon: Wallet, label: "Good momentum", title: net > 0 ? "You are currently spending less than you earn" : "Try a small weekly saving target", detail: net > 0 ? `${formatMoney(net, currency)} remains after the transactions recorded so far. Consider assigning some of it to a save goal.` : "Even a small automatic transfer after payday can build a useful buffer.", tone: "soft" },
                  ];
                  return insightRows.map((insight, index) => {
                    const Icon = insight.icon;
                    const isSaved = savedTips.includes(index);
                    return <article key={insight.label} className={cn("rounded-2xl border p-4 transition", insight.tone === "orange" ? "border-[#e1694a]/15 bg-[#e1694a]/[0.045]" : "border-black/[0.05] bg-white")}>
                      <div className="flex items-start gap-3"><span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", insight.tone === "orange" ? "bg-white text-[#e1694a]" : "bg-[#f4f4f4] text-neutral-600")}><Icon size={16} /></span><div className="min-w-0 flex-1"><div className="text-[9px] font-bold uppercase tracking-[0.13em] text-neutral-400">{insight.label}</div><h3 className="mt-1 text-[13px] font-semibold">{insight.title}</h3><p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{insight.detail}</p><button onClick={() => { setSavedTips((current) => isSaved ? current.filter((item) => item !== index) : [...current, index]); onToast(isSaved ? "Insight removed from saved tips" : "Insight saved for later"); }} className="mt-2 text-[10px] font-semibold text-[#c85b40]">{isSaved ? "Saved · remove" : "Save this insight"}</button></div></div>
                    </article>;
                  });
                })()}
              </div>
            </section>
            <div className="flex flex-col gap-4">
              <section className="rounded-[26px] bg-black p-5 text-white md:p-6"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#e1694a]"><Lightbulb size={18} /></span><div className="mt-4 text-[18px] font-semibold tracking-tight">A student-friendly saving plan</div><p className="mt-2 text-[11px] leading-relaxed text-white/55">Try moving a small, repeatable amount to a goal as soon as money comes in. A steady habit is easier to keep than a perfect month.</p><button onClick={() => onToast("Tip added to your weekly plan")} className="mt-4 rounded-full bg-[#e1694a] px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-white hover:text-black">Add to my plan <span className="ml-2">↗</span></button></section>
              <section className={`${panelClass} p-5 md:p-6`}><div className="flex items-center justify-between"><div><h2 className="text-[15px] font-semibold">Quick saving wins</h2><p className="mt-1 text-[11px] text-neutral-400">Low-effort ideas to try this week</p></div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#e1694a]"><Heart size={15} /></span></div><div className="mt-4 space-y-3">{["Pack lunch one extra day this week", "Compare student transit pass options", "Review subscriptions before they renew"].map((tip, index) => <button key={tip} onClick={() => { setSavedTips((current) => current.includes(index + 10) ? current.filter((item) => item !== index + 10) : [...current, index + 10]); onToast(savedTips.includes(index + 10) ? "Tip unchecked" : "Tip added to this week's list"); }} className="flex w-full items-center gap-3 text-left"><span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition", savedTips.includes(index + 10) ? "border-[#e1694a] bg-[#e1694a] text-white" : "border-black/10 bg-white text-transparent")}><Check size={12} /></span><span className={cn("text-[11px]", savedTips.includes(index + 10) && "text-neutral-400 line-through")}>{tip}</span></button>)}</div></section>
              <p className="px-1 text-[9px] leading-relaxed text-neutral-400">Insights are based on the sample transactions in this dashboard and are for general budgeting guidance, not financial advice.</p>
            </div>
          </div>
        </>
      )}

      {activePage === "Settings" && (
        <>
          <PageHeading
            eyebrow="Your account · Preferences"
            title="Settings"
            description="Keep your student profile, currency and reminders set up the way you like."
            actions={<button onClick={() => { setSettingsSaved(true); onToast("Your preferences have been saved"); setTimeout(() => setSettingsSaved(false), 1800); }} className="inline-flex items-center gap-2 rounded-full bg-[#e1694a] px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-black">{settingsSaved ? <Check size={14} /> : <Settings size={14} />}{settingsSaved ? "Saved" : "Save changes"}</button>}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <section className={`${panelClass} p-5 md:p-6`}>
              <div className="mb-5 flex items-center gap-3"><img src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop" alt="Student profile" className="h-12 w-12 rounded-full object-cover" /><div><h2 className="text-[15px] font-semibold">Profile information</h2><p className="mt-0.5 text-[10px] text-neutral-400">Your account details</p></div></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="text-[11px] font-medium text-neutral-500">Full name<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-[12px] text-neutral-900 outline-none focus:border-[#e1694a]" /></label><label className="text-[11px] font-medium text-neutral-500">Email address<input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-[12px] text-neutral-900 outline-none focus:border-[#e1694a]" /></label><label className="text-[11px] font-medium text-neutral-500 sm:col-span-2">School or university<input value={profile.school} onChange={(event) => setProfile({ ...profile, school: event.target.value })} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-[12px] text-neutral-900 outline-none focus:border-[#e1694a]" /></label></div>
              <div className="mt-6 border-t border-black/[0.06] pt-5"><div className="mb-3 text-[13px] font-semibold">Account preferences</div><label className="block max-w-[240px] text-[11px] font-medium text-neutral-500">Display currency<select value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-[12px] text-neutral-900 outline-none focus:border-[#e1694a]">{currencyOptions.map((option) => <option key={option}>{option}</option>)}</select></label><p className="mt-2 text-[9px] text-neutral-400">Amounts throughout your reports will use {currency}.</p></div>
            </section>
            <div className="flex flex-col gap-4">
              <section className={`${panelClass} p-5 md:p-6`}><div className="flex items-center justify-between"><div><h2 className="text-[15px] font-semibold">Notifications</h2><p className="mt-1 text-[11px] text-neutral-400">Choose what you want to hear about</p></div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#e1694a]"><Bell size={16} /></span></div><div className="mt-4 divide-y divide-black/[0.06]">{[{ key: "budgetAlerts" as const, title: "Budget alerts", detail: "When you are close to a spending limit" }, { key: "weeklySummary" as const, title: "Weekly money summary", detail: "A quick recap of your week" }, { key: "lowBalance" as const, title: "Low balance reminder", detail: "When your available balance is running low" }].map((item) => <div key={item.key} className="flex items-center justify-between gap-4 py-3.5"><div><div className="text-[11px] font-semibold">{item.title}</div><div className="mt-0.5 text-[9px] text-neutral-400">{item.detail}</div></div><button onClick={() => setPreferences((current) => ({ ...current, [item.key]: !current[item.key] }))} role="switch" aria-label={item.title} aria-checked={preferences[item.key]} className={cn("relative h-6 w-11 shrink-0 rounded-full transition", preferences[item.key] ? "bg-[#e1694a]" : "bg-black/15")}><span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", preferences[item.key] ? "left-6" : "left-1")} /></button></div>)}</div></section>
              <section className="rounded-[26px] border border-black/[0.05] bg-white p-5"><div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f5]"><BookOpen size={15} /></span><div><div className="text-[12px] font-semibold">Student account</div><p className="mt-1 text-[10px] leading-relaxed text-neutral-400">Your preferences are kept in this dashboard session. Connect an account service to sync these settings across devices.</p></div></div></section>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
