import type { DashboardSnapshot } from "../FinancePages";

export type AdminPage =
  | "Dashboard"
  | "Students"
  | "Transactions"
  | "Categories"
  | "Reports & Analytics"
  | "AI Insights"
  | "Settings";

export type AdminPeriod = "Month" | "Quarter" | "Year" | "All time";
export type EntryType = "Income" | "Expense";

export interface AdminStudent {
  id: number;
  name: string;
  email: string;
  program: string;
  year: string;
  status: "Active" | "Paused";
  joined: string;
}

export interface AdminTransaction {
  id: number;
  studentId: number;
  title: string;
  category: string;
  type: EntryType;
  amount: number;
  date: string;
  note: string;
  flagged: boolean;
  linked?: boolean;
}

export interface AdminCategory {
  id: number;
  name: string;
  sourceName: string;
  type: EntryType;
}

export interface AdminGoal {
  id: number;
  studentId: number;
  name: string;
  target: number;
  saved: number;
}

export interface AdminPreferences {
  name: string;
  email: string;
  organization: string;
  currency: string;
  budgetAlerts: boolean;
  weeklyDigest: boolean;
  largeTransactionAlerts: boolean;
  reviewThreshold: number;
}

export interface AdminData {
  students: AdminStudent[];
  transactions: AdminTransaction[];
  categories: AdminCategory[];
  goals: AdminGoal[];
  preferences: AdminPreferences;
}

export const LINKED_STUDENT_ID = 1;
const storageKey = "n2-admin-workspace-v1";

// Real admin workspace: starts empty. Real students/transactions come from
// /api/admin/* (see AdminWorkspace.loadServerUsers). The "linked student" rows
// are the only legacy entries kept, and only for the linked-account fallback.
const initialStudents: AdminStudent[] = [];

const initialCategories: AdminCategory[] = [
  { id: 1, name: "Food", sourceName: "Food", type: "Expense" },
  { id: 2, name: "Transport", sourceName: "Transport", type: "Expense" },
  { id: 3, name: "Education", sourceName: "Education", type: "Expense" },
  { id: 4, name: "Shopping", sourceName: "Shopping", type: "Expense" },
  { id: 5, name: "Entertainment", sourceName: "Entertainment", type: "Expense" },
  { id: 6, name: "Health", sourceName: "Health", type: "Expense" },
  { id: 7, name: "Scholarship", sourceName: "Scholarship", type: "Income" },
  { id: 8, name: "Part-time job", sourceName: "Part-time job", type: "Income" },
  { id: 9, name: "Allowance", sourceName: "Allowance", type: "Income" },
];

function entry(
  id: number,
  studentId: number,
  title: string,
  category: string,
  type: EntryType,
  amount: number,
  date: string,
  note = "",
): AdminTransaction {
  return { id, studentId, title, category, type, amount, date, note, flagged: false };
}

const initialTransactions: AdminTransaction[] = [];

const initialGoals: AdminGoal[] = [];

export const initialAdminData: AdminData = {
  // Real workspace defaults: everything empty. Identity is filled from the
  // authenticated admin session in AdminWorkspace (see getStoredUser effect).
  students: [],
  transactions: [],
  categories: initialCategories,
  goals: [],
  preferences: {
    name: "Admin",
    email: "",
    organization: "",
    currency: "PKR",
    budgetAlerts: true,
    weeklyDigest: true,
    largeTransactionAlerts: true,
    reviewThreshold: 500,
  },
};

export function readAdminData(): AdminData {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return initialAdminData;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return initialAdminData;
    const data = parsed as Partial<AdminData>;
    if (!Array.isArray(data.students) || !Array.isArray(data.transactions) || !Array.isArray(data.categories) || !Array.isArray(data.goals) || !data.preferences) {
      return initialAdminData;
    }
    return data as AdminData;
  } catch {
    return initialAdminData;
  }
}

export function storeAdminData(data: AdminData) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // Storage can be unavailable in private browsing; the in-memory state still works.
  }
}

export function linkedTransactions(snapshot: DashboardSnapshot): AdminTransaction[] {
  return snapshot.transactions.map((transaction) => ({
    ...transaction,
    id: -Math.abs(transaction.id),
    studentId: LINKED_STUDENT_ID,
    note: "Recorded from Student workspace",
    flagged: false,
    linked: true,
  }));
}

export function linkedGoals(snapshot: DashboardSnapshot): AdminGoal[] {
  return snapshot.goals.map((goal) => ({ ...goal, id: -Math.abs(goal.id), studentId: LINKED_STUDENT_ID }));
}

export function formatMoney(amount: number, currency = "PKR", compact = false) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: compact ? 1 : 2,
      notation: compact ? "compact" : "standard",
    }).format(amount);
  } catch {
    return `Rs ${amount.toFixed(2)}`;
  }
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function studentInitials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export function categoryName(name: string, categories: AdminCategory[]) {
  return categories.find((category) => category.name === name || category.sourceName === name)?.name ?? name;
}

export function matchesCategory(name: string, category: AdminCategory) {
  return name === category.name || name === category.sourceName;
}

export function latestDate(rows: AdminTransaction[]) {
  return rows.reduce((latest, row) => row.date > latest ? row.date : latest, "2023-12-19");
}

export function periodTransactions(rows: AdminTransaction[], period: AdminPeriod, referenceDate: string) {
  const reference = new Date(`${referenceDate}T00:00:00Z`).getTime();
  return rows.filter((row) => {
    if (period === "All time") return true;
    if (period === "Month") return row.date.slice(0, 7) === referenceDate.slice(0, 7);
    if (period === "Year") return row.date.slice(0, 4) === referenceDate.slice(0, 4);
    const age = (reference - new Date(`${row.date}T00:00:00Z`).getTime()) / 86_400_000;
    return age >= 0 && age <= 92;
  });
}

export function summarize(rows: AdminTransaction[]) {
  const income = rows.filter((row) => row.type === "Income").reduce((total, row) => total + row.amount, 0);
  const expenses = rows.filter((row) => row.type === "Expense").reduce((total, row) => total + row.amount, 0);
  return { income, expenses, net: income - expenses };
}