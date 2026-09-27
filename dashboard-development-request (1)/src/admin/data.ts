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

const initialStudents: AdminStudent[] = [
  { id: 1, name: "Jhon Carter", email: "jhon.carter@northside.edu", program: "Computer Science", year: "Year 3", status: "Active", joined: "2023-08-18" },
  { id: 2, name: "Areeba Khan", email: "areeba.khan@northside.edu", program: "Business Studies", year: "Year 2", status: "Active", joined: "2023-08-22" },
  { id: 3, name: "Hamza Ali", email: "hamza.ali@northside.edu", program: "Software Engineering", year: "Year 3", status: "Active", joined: "2023-08-26" },
  { id: 4, name: "Maya Patel", email: "maya.patel@northside.edu", program: "Graphic Design", year: "Year 1", status: "Active", joined: "2023-09-04" },
  { id: 5, name: "Daniel Lee", email: "daniel.lee@northside.edu", program: "Economics", year: "Year 4", status: "Active", joined: "2023-08-30" },
  { id: 6, name: "Sara Ahmed", email: "sara.ahmed@northside.edu", program: "Architecture", year: "Year 2", status: "Active", joined: "2023-09-02" },
  { id: 7, name: "Noah Williams", email: "noah.williams@northside.edu", program: "Media Studies", year: "Year 1", status: "Paused", joined: "2023-09-07" },
  { id: 8, name: "Zoya Malik", email: "zoya.malik@northside.edu", program: "Data Science", year: "Year 3", status: "Active", joined: "2023-08-20" },
];

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

const initialTransactions: AdminTransaction[] = [
  entry(101, 2, "Campus meal plan", "Food", "Expense", 84, "2023-12-19"),
  entry(102, 3, "Coding freelance project", "Part-time job", "Income", 590, "2023-12-19"),
  entry(103, 4, "Design materials", "Education", "Expense", 62, "2023-12-18"),
  entry(104, 5, "Merit scholarship", "Scholarship", "Income", 860, "2023-12-18"),
  entry(105, 6, "Studio supplies", "Shopping", "Expense", 145, "2023-12-17"),
  entry(106, 2, "Weekend tutoring", "Part-time job", "Income", 230, "2023-12-17"),
  entry(107, 7, "Monthly bus pass", "Transport", "Expense", 55, "2023-12-16"),
  entry(108, 8, "Research assistantship", "Part-time job", "Income", 360, "2023-12-16"),
  entry(109, 3, "Textbooks and notes", "Education", "Expense", 94, "2023-12-15"),
  entry(110, 4, "Family allowance", "Allowance", "Income", 320, "2023-12-15"),
  entry(111, 5, "Groceries", "Food", "Expense", 76, "2023-12-14"),
  entry(112, 6, "Campus scholarship", "Scholarship", "Income", 720, "2023-12-14"),
  entry(113, 2, "Winter coat", "Shopping", "Expense", 115, "2023-12-13"),
  entry(114, 3, "Campus cafe", "Food", "Expense", 28, "2023-12-12"),
  entry(115, 4, "Cinema with friends", "Entertainment", "Expense", 38, "2023-12-11"),
  entry(116, 5, "Internship stipend", "Part-time job", "Income", 525, "2023-12-11"),
  entry(117, 6, "Course drawing kit", "Education", "Expense", 89, "2023-12-10"),
  entry(118, 7, "Family allowance", "Allowance", "Income", 240, "2023-12-09"),
  entry(119, 8, "Data science workshop", "Education", "Expense", 130, "2023-12-09"),
  entry(120, 2, "Campus groceries", "Food", "Expense", 56, "2023-12-07"),
  entry(121, 3, "Family support", "Allowance", "Income", 275, "2023-12-06"),
  entry(122, 4, "Weekend design gig", "Part-time job", "Income", 185, "2023-12-05"),
  entry(123, 5, "Train ticket", "Transport", "Expense", 42, "2023-12-04"),
  entry(124, 6, "Family allowance", "Allowance", "Income", 210, "2023-12-02"),
  entry(125, 7, "Music subscription", "Entertainment", "Expense", 11, "2023-11-29"),
  entry(126, 8, "Semester scholarship", "Scholarship", "Income", 950, "2023-11-28"),
  entry(127, 2, "Scholarship payment", "Scholarship", "Income", 700, "2023-11-23"),
  entry(128, 3, "Metro pass", "Transport", "Expense", 48, "2023-11-19"),
  entry(129, 4, "Studio software", "Education", "Expense", 125, "2023-11-16"),
  entry(130, 5, "Tuition materials", "Education", "Expense", 185, "2023-11-12"),
  entry(131, 6, "Part-time office role", "Part-time job", "Income", 280, "2023-11-09"),
  entry(132, 8, "Campus groceries", "Food", "Expense", 64, "2023-10-18"),
  entry(133, 7, "Winter medical check", "Health", "Expense", 95, "2023-10-05"),
  entry(134, 4, "Semester tuition deposit", "Education", "Expense", 520, "2023-12-13"),
];

const initialGoals: AdminGoal[] = [
  { id: 101, studentId: 2, name: "New tablet", target: 800, saved: 430 },
  { id: 102, studentId: 3, name: "Software certification", target: 650, saved: 380 },
  { id: 103, studentId: 4, name: "Design laptop", target: 1200, saved: 540 },
  { id: 104, studentId: 5, name: "Graduate school", target: 1800, saved: 960 },
  { id: 105, studentId: 6, name: "Architecture toolkit", target: 900, saved: 295 },
  { id: 106, studentId: 7, name: "Emergency fund", target: 500, saved: 115 },
  { id: 107, studentId: 8, name: "Summer research trip", target: 700, saved: 455 },
];

export const initialAdminData: AdminData = {
  students: initialStudents,
  transactions: initialTransactions,
  categories: initialCategories,
  goals: initialGoals,
  preferences: {
    name: "Alex Morgan",
    email: "alex.morgan@northside.edu",
    organization: "Northside University",
    currency: "USD",
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

export function formatMoney(amount: number, currency = "USD", compact = false) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: compact ? 1 : 2,
      notation: compact ? "compact" : "standard",
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
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