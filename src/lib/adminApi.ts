/**
 * Admin API layer — real backend data for the AdminWorkspace.
 * Endpoints: /admin/dashboard, /admin/users, /admin/users/:id, PATCH role/status, DELETE user,
 * /admin/users/:id/transactions, /transactions/summary?userId=.
 */
import { authRequest } from "./api";
import { toLocalDate } from "./sync";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  isActive?: boolean;
  academicYear?: string;
  monthlyAllowanceBaseline?: number;
  monthlySavingsGoal?: number;
  createdAt: string;
}

export interface AdminTransaction {
  _id: string;
  user: string | { _id: string; name: string; email: string };
  type: "income" | "expense";
  amount: number;
  title: string;
  date: string;
  category?: { name: string } | string;
}

export interface AdminOverview {
  stats: {
    totalStudents: number;
    totalAdmins: number;
    activeStudents: number;
    newUsersThisMonth: number;
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    platformBalance: number;
  };
  newUsers7d?: number;
  recentUsers: AdminUser[];
  recentTransactions: Array<{
    _id: string;
    type: "income" | "expense";
    amount: number;
    title: string;
    date: string;
    userName?: string;
    categoryName?: string;
  }>;
  topCategories?: Array<{ name: string; totalAmount: number; count: number }>;
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const dash = await authRequest<AdminOverview["stats"] & Record<string, unknown>>("/admin/dashboard");
  const statsRaw = (dash.data ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" ? v : 0);
  const stats = {
    totalStudents: num(statsRaw.totalStudents),
    totalAdmins: num(statsRaw.totalAdmins),
    activeStudents: num(statsRaw.activeStudents),
    newUsersThisMonth: num(statsRaw.newUsersThisMonth),
    totalTransactions: num(statsRaw.totalTransactions),
    totalIncome: num(statsRaw.totalIncome),
    totalExpense: num(statsRaw.totalExpense),
    platformBalance: num(statsRaw.platformBalance),
  };
  const [usersRes, txRes] = await Promise.all([
    authRequest<{ users: AdminUser[] }>("/admin/users?limit=100"),
    authRequest<AdminTransaction[]>("/transactions?limit=100&sort=-date"),
  ]);
  const users = usersRes.data?.users ?? [];
  const recentTransactions = (txRes.data ?? []).slice(0, 8).map((t) => ({
    _id: t._id,
    type: t.type,
    amount: t.amount,
    title: t.title,
    date: toLocalDate(t.date),
    userName: typeof t.user === "object" ? t.user?.name : undefined,
    categoryName: typeof t.category === "object" ? t.category?.name : typeof t.category === "string" ? t.category : undefined,
  }));
  const newUsers7d = users.filter((u) => Date.now() - new Date(u.createdAt).getTime() < 7 * 86400000).length;
  return { stats, newUsers7d, recentUsers: users.slice(0, 5), recentTransactions };
}

export async function fetchAdminUsers(search = ""): Promise<AdminUser[]> {
  const q = search ? `&search=${encodeURIComponent(search)}` : "";
  const res = await authRequest<{ users: AdminUser[] }>(`/admin/users?limit=100${q}`);
  return res.data?.users ?? [];
}

export async function fetchAdminUserTransactions(userId: string): Promise<AdminTransaction[]> {
  const res = await authRequest<AdminTransaction[]>(`/admin/users/${userId}/transactions?limit=100`);
  return res.data ?? [];
}

export async function fetchAdminUserSummary(userId: string): Promise<{ totalIncome: number; totalExpense: number; balance: number; transactionCount: number }> {
  const res = await authRequest<{ totalIncome: number; totalExpense: number; balance: number; transactionCount: number }>(
    `/transactions/summary?userId=${userId}`, // controller allows admins to pass ?userId=
  );
  return (
    res.data ?? { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 }
  );
}

export async function patchAdminUserStatus(userId: string, isActive: boolean): Promise<void> {
  await authRequest(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function patchAdminUserRole(userId: string, role: "student" | "admin"): Promise<void> {
  await authRequest(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await authRequest(`/admin/users/${userId}`, { method: "DELETE" });
}

/**
 * Creates a real student account via the public register endpoint (ADM7).
 * The backend requires a password; a temporary one is assigned and should be
 * communicated to the student through the password-reset flow.
 */
export async function registerStudentAccount(name: string, email: string): Promise<void> {
  await authRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password: `campus-${Math.random().toString(36).slice(2, 10)}`,
      role: "student",
    }),
  });
}
