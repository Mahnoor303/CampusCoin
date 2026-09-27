/**
 * CampusCoin API client — connects the React frontend to the Express + MongoDB backend.
 * Uses a Bearer token (JWT) stored in localStorage.
 */

export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  academicYear?: string;
  monthlyAllowanceBaseline?: number;
  monthlySavingsGoal?: number;
}

export interface AuthResult {
  token: string;
  user: ApiUser;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

const TOKEN_KEY = "campuscoin_token";
const USER_KEY = "campuscoin_user";

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ?? false;
// Dev: hit the backend directly (CORS allows localhost origins). Prod: same-origin /api.
const API_BASE = env.VITE_API_URL || (isDev ? "http://127.0.0.1:5000/api" : "/api");

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): ApiUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: ApiUser) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable (private mode) — session won't persist */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

function extractMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export async function request<T>(path: string, init: RequestInit & { body?: string } = {}): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new Error("Cannot reach the CampusCoin server. Is the backend running on port 5000?");
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    /* non-JSON response */
  }

  if (!response.ok) {
    throw new Error(extractMessage(payload, `Request failed (${response.status})`));
  }
  return payload as ApiEnvelope<T>;
}

/** Authenticated fetch helper for protected endpoints (transactions, budgets, goals...). */
export async function authRequest<T>(
  path: string,
  init: RequestInit & { body?: string } = {},
): Promise<ApiEnvelope<T>> {
  if (!getToken()) throw new Error("You are signed out. Please log in again.");
  return request<T>(path, init);
}

export async function registerStudent(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const envelope = await request<AuthResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...input, role: "student" }),
  });
  if (!envelope.data) throw new Error(envelope.message || "Registration failed");
  saveSession(envelope.data.token, envelope.data.user);
  return envelope.data;
}

export async function loginStudent(email: string, password: string): Promise<AuthResult> {
  const envelope = await request<AuthResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!envelope.data) throw new Error(envelope.message || "Login failed");
  saveSession(envelope.data.token, envelope.data.user);
  return envelope.data;
}

export async function logoutStudent() {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    /* best-effort — clear local session regardless */
  }
  clearSession();
}

export async function fetchCurrentUser(): Promise<ApiUser> {
  const envelope = await authRequest<{ user: ApiUser }>("/auth/me");
  if (!envelope.data?.user) throw new Error(envelope.message || "Could not load profile");
  return envelope.data.user;
}

export async function updateProfile(patch: {
  name?: string;
  email?: string;
  monthlyAllowanceBaseline?: number;
  monthlySavingsGoal?: number;
  academicYear?: string;
}): Promise<ApiUser> {
  const envelope = await authRequest<{ user: ApiUser }>("/users/me", {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  if (!envelope.data?.user) throw new Error(envelope.message || "Could not update profile");
  return envelope.data.user;
}
