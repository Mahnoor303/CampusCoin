/**
 * Backend sync helpers for the student workspace.
 * Maps the frontend's local models to the CampusCoin REST API (transactions, budgets, goals).
 * Server data is the source of truth; failures surface as error states, never fake data.
 */
import { authRequest, request, saveSession, type ApiUser, type AuthResult } from "./api";

/* ── Global pending-sync indicator (S6: loading states during API calls) ──
 * Counts in-flight backend mutations so the UI can show a "Syncing…" badge.
 * Subscribers are notified on every change; useSyncPending() returns [count, unsub].
 */
let pendingSyncCount = 0;
const syncListeners = new Set<(count: number) => void>();
const notifySyncListeners = () => { syncListeners.forEach((listener) => listener(pendingSyncCount)); };

/**
 * Minimum badge visibility: on very fast requests the count can go 0→1→0 inside
 * one paint frame, which would make the indicator invisible. We hold the "off"
 * notification until the badge has been visible for at least this long.
 */
const MIN_VISIBLE_MS = 450;
let shownAt = 0;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

async function trackPending<T>(task: () => Promise<T>): Promise<T> {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  pendingSyncCount += 1;
  shownAt = Date.now();
  notifySyncListeners();
  try {
    return await task();
  } finally {
    pendingSyncCount = Math.max(0, pendingSyncCount - 1);
    if (pendingSyncCount === 0) {
      const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt));
      hideTimer = setTimeout(() => { hideTimer = null; notifySyncListeners(); }, remaining);
    } else {
      notifySyncListeners();
    }
  }
}

/** Subscribes to pending-sync count changes; returns an unsubscribe function. */
export function useSyncPendingSubscribe(listener: (count: number) => void): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

/** authRequest wrapper that counts the call as a pending sync (drives the UI badge). */
function trackedAuthRequest<T>(path: string, options?: { method?: string; body?: string }): ReturnType<typeof authRequest<T>> {
  return trackPending(() => authRequest<T>(path, options));
}

export function getSyncPendingCount(): number {
  return pendingSyncCount;
}

export interface BackendTransaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  title: string;
  description?: string;
  notes?: string;
  date: string;
  category?: { _id: string; name: string } | string;
  recurring?: { isRecurring: boolean; frequency?: string; nextDueDate?: string | null };
}

export interface BackendGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  notes?: string;
  purpose?: string;
}

export interface BackendBudget {
  _id: string;
  category: { _id: string; name: string } | string;
  limit: number;
  period?: string;
}

interface ListEnvelope<T> {
  data?: T[];
}

function categoryName(category: BackendTransaction["category"]): string {
  if (!category) return "Other";
  return typeof category === "string" ? category : category.name;
}

function toLocalDate(iso: string): string {
  return (iso || "").slice(0, 10);
}

export { categoryName, toLocalDate };



/** Real yearly aggregation for the dashboard Annual-profits widget (GET /api/reports/monthly). */
export interface YearlyMonthlyRow {
  monthNumber: number;
  month: string;
  monthName: string;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
}

export async function fetchYearlyReport(year: number): Promise<{ year: number; months: YearlyMonthlyRow[] }> {
  const envelope = await authRequest<{ year: number; months: YearlyMonthlyRow[] }>(`/reports/monthly?year=${year}`);
  return envelope.data ?? { year, months: [] };
}

export async function fetchStudentData(): Promise<{
  user: ApiUser;
  transactions: BackendTransaction[];
  goals: BackendGoal[];
  budgets: BackendBudget[];
}> {
  const [meRes, txRes, goalRes, budgetRes] = await Promise.all([
    authRequest<{ user: ApiUser }>("/auth/me"),
    authRequest<BackendTransaction[]>("/transactions?limit=100&sort=-date"),
    authRequest<BackendGoal[]>("/goals"),
    authRequest<BackendBudget[]>("/budgets"),
  ]);
  return {
    user: meRes.data!.user,
    transactions: txRes.data ?? [],
    goals: goalRes.data ?? [],
    budgets: budgetRes.data ?? [],
  };
}

/** Finds a backend category by name (or creates it) and returns its Mongo id. */
export async function resolveCategoryId(name: string, type: "income" | "expense"): Promise<string | null> {
  const cats = await authRequest<Array<{ _id: string; name: string; type: string }>>(
    `/categories?type=${type}`,
  );
  const match = (cats.data ?? []).find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (match) return match._id;
  const created = await trackedAuthRequest<{ _id: string }>("/categories", {
    method: "POST",
    body: JSON.stringify({ name, type }),
  });
  return created.data?._id ?? null;
}

/** Creates a transaction on the backend and returns its Mongo id. */
export async function pushBackendTransaction(input: {
  type: "Income" | "Expense";
  amount: number;
  title: string;
  note: string;
  category: string;
  date: string;
  recurring?: boolean;
}): Promise<string | null> {
  const categoryId = await resolveCategoryId(input.category, input.type.toLowerCase() as "income" | "expense");
  if (!categoryId) throw new Error(`Category "${input.category}" could not be resolved on the server`);
  const envelope = await trackedAuthRequest<BackendTransaction>("/transactions", {
    method: "POST",
    body: JSON.stringify({
      type: input.type.toLowerCase(),
      amount: input.amount,
      title: input.title,
      description: input.note || undefined,
      category: categoryId,
      date: new Date(`${input.date}T12:00:00Z`).toISOString(),
      recurring: input.recurring ? { isRecurring: true, frequency: "monthly" } : undefined,
    }),
  });
  return envelope.data?._id ?? null;
}

/** Updates an existing backend transaction (best-effort). */
export async function patchBackendTransaction(backendId: string, input: {
  type: "Income" | "Expense";
  amount: number;
  title: string;
  note: string;
  date: string;
}): Promise<void> {
  await trackedAuthRequest(`/transactions/${backendId}`, {
    method: "PUT",
    body: JSON.stringify({
      type: input.type.toLowerCase(),
      amount: input.amount,
      title: input.title,
      description: input.note || undefined,
      date: new Date(`${input.date}T12:00:00Z`).toISOString(),
    }),
  });
}

export async function deleteBackendTransaction(backendId: string): Promise<void> {
  await trackedAuthRequest(`/transactions/${backendId}`, { method: "DELETE" });
}

/** Creates a savings goal on the backend and returns its Mongo id. Deadline is required — defaults to 1 year out. */
export async function pushBackendGoal(input: {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}): Promise<string | null> {
  const deadline = input.deadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const envelope = await trackedAuthRequest<BackendGoal>("/goals", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      targetAmount: input.targetAmount,
      currentAmount: input.currentAmount,
      deadline,
    }),
  });
  return envelope.data?._id ?? null;
}

export async function patchBackendGoal(backendId: string, input: {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
}): Promise<void> {
  await trackedAuthRequest(`/goals/${backendId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteBackendGoal(backendId: string): Promise<void> {
  await trackedAuthRequest(`/goals/${backendId}`, { method: "DELETE" });
}

/**
 * Creates a custom category on the backend if missing and returns its id (C2).
 * resolveCategoryId already does find-or-create; re-exported here for the UI layer.
 */
export { resolveCategoryId as ensureBackendCategory };

/** Request a password-reset token. Dev responses include the raw token. */
export async function requestPasswordReset(email: string): Promise<{ resetToken?: string; expiresInMinutes?: number }> {
  const envelope = await request<{ resetToken?: string; expiresInMinutes?: number }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return envelope.data ?? {};
}

/** Reset the password with a token; returns a fresh session on success. */
export async function resetPasswordWithToken(token: string, password: string): Promise<AuthResult> {
  const envelope = await request<AuthResult>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
  if (!envelope.data) throw new Error(envelope.message || "Password reset failed");
  saveSession(envelope.data.token, envelope.data.user);
  return envelope.data;
}

/** Imports transactions from a raw CSV string; per-row errors come back for display. */
export async function importTransactionsCsv(csv: string): Promise<{
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errors: Array<{ row: number; reason: string }>;
}> {
  const envelope = await request<{
    totalRows: number;
    importedRows: number;
    failedRows: number;
    errors: Array<{ row: number; reason: string }>;
  }>("/import/transactions", {
    method: "POST",
    body: JSON.stringify({ csv }),
  });
  return envelope.data ?? { totalRows: 0, importedRows: 0, failedRows: 0, errors: [] };
}

/** Updates a backend budget's limit (best-effort). */
export async function patchBackendBudget(backendId: string, limit: number): Promise<void> {
  await trackedAuthRequest(`/budgets/${backendId}`, {
    method: "PUT",
    body: JSON.stringify({ limit }),
  });
}

export async function deleteBackendBudget(backendId: string): Promise<void> {
  await trackedAuthRequest(`/budgets/${backendId}`, { method: "DELETE" });
}

export interface BackendInsight {
  _id: string;
  month: string;
  summaryText?: string;
  tipText?: string;
  summary_text?: string;
  tip_text?: string;
}

export interface BackendTip {
  title?: string;
  text?: string;
  impact?: string;
  [key: string]: unknown;
}

/** Generate + persist backend insights for the current month. */
export async function generateBackendInsights(): Promise<BackendInsight[]> {
  return trackPending(async () => {
    const envelope = await request<{ insights?: BackendInsight[] }>("/insights/generate", {
      method: "POST",
      body: JSON.stringify({}),
    });
    return (envelope.data as { insights?: BackendInsight[] } | undefined)?.insights ?? [];
  });
}

/** Real-time saving tips from the backend rule engine. */
export async function fetchBackendTips(): Promise<BackendTip[]> {
  const envelope = await request<{ tips?: BackendTip[] }>("/insights/tips");
  return (envelope.data as { tips?: BackendTip[] } | undefined)?.tips ?? [];
}

/** Creates a budget on the backend (category must exist server-side). */
export async function pushBackendBudget(input: {
  categoryName: string;
  limit: number;
}): Promise<{ budgetId: string | null; categoryId: string | null }> {
  // 1. Find or note the missing category on the backend.
  let categoryId: string | null = null;
  const cats = await trackedAuthRequest<Array<{ _id: string; name: string; type: string }>>("/categories?type=expense");
  const match = (cats.data ?? []).find((c) => c.name.toLowerCase() === input.categoryName.toLowerCase());
  if (match) {
    categoryId = match._id;
  } else {
    const created = await trackedAuthRequest<{ _id: string }>("/categories", {
      method: "POST",
      body: JSON.stringify({ name: input.categoryName, type: "expense" }),
    });
    categoryId = created.data?._id ?? null;
  }
  if (!categoryId) return { budgetId: null, categoryId: null };

  // 2. Create the budget against that category.
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const envelope = await trackedAuthRequest<{ _id: string }>("/budgets", {
    method: "POST",
    body: JSON.stringify({
      category: categoryId,
      limit: input.limit,
      period: "monthly",
      startDate: monthStart.toISOString().slice(0, 10),
      endDate: monthEnd.toISOString().slice(0, 10),
    }),
  });
  return { budgetId: envelope.data?._id ?? null, categoryId };
}
