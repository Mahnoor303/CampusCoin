import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Calendar as CalendarIcon,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  BarChart3,
  X,
  TrendingUp,
  ChevronDown,
  Check,
  Share2,
  Hand,
  ArrowLeftRight,
  Home,
  Receipt,
  Tags,
  Target,
  Sparkles,
  Settings,
  ChevronRight,
  GraduationCap,
  Wallet,
  ShieldCheck,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "./utils/cn";
import FinancePages, { readDashboardSnapshot, type DashboardSnapshot, type FinancePage } from "./FinancePages";
import { getStoredUser } from "../lib/api";
import { useSyncPendingSubscribe, fetchYearlyReport } from "../lib/sync";
import StudentActivityManager from "./StudentActivityManager";
import AdminWorkspace from "./admin/AdminWorkspace";

const ACCENT = "#e1694a";

const sidebarItems: { title: FinancePage; description: string; icon: LucideIcon }[] = [
  { title: "Dashboard", description: "Your money at a glance", icon: Home },
  { title: "Transactions", description: "Income and expenses", icon: Receipt },
  { title: "Categories", description: "Organize your spending", icon: Tags },
  { title: "Budget Goals & Alerts", description: "Limits and reminders", icon: Target },
  { title: "Student Save Goals", description: "Save for campus milestones", icon: GraduationCap },
  { title: "Reports", description: "Review your progress", icon: BarChart3 },
  { title: "AI Insights & Saving Tips", description: "Ideas for your money", icon: Sparkles },
  { title: "Settings", description: "Profile and preferences", icon: Settings },
];

function dashboardMoney(amount: number, currency: string) {
  // PKR renders as "Rs 1,250" — no $ symbol anywhere on the student dashboard.
  const locale = currency === "PKR" ? "en-PK" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `Rs ${amount.toFixed(2)}`;
  }
}

function dashboardMoneyCompact(amount: number, currency: string) {
  const locale = currency === "PKR" ? "en-PK" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(amount);
  } catch {
    return `Rs ${Math.round(amount)}`;
  }
}

function filterDashboardTransactions(
  transactions: DashboardSnapshot["transactions"],
  period: string,
  latestDate: string,
) {
  const latestTime = new Date(`${latestDate}T00:00:00Z`).getTime();
  return transactions.filter((transaction) => {
    if (period === "All time") return true;
    if (period === "Month" || period === "Monthly") return transaction.date.startsWith(latestDate.slice(0, 7));
    if (period === "Yearly") return transaction.date.startsWith(latestDate.slice(0, 4));
    const transactionTime = new Date(`${transaction.date}T00:00:00Z`).getTime();
    const ageInDays = (latestTime - transactionTime) / 86_400_000;
    if (period === "Semester") return ageInDays >= 0 && ageInDays <= 183;
    return ageInDays >= 0 && ageInDays <= 7;
  });
}

export type DashboardActionType = "income" | "expense" | "goal";

function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<any>(null);
  const show = (msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  };
  return { toast, show };
}

/** S6: shows a "Syncing…" badge while backend mutations are in flight. */
function useSyncPending(): number {
  const [count, setCount] = useState(0);
  useEffect(() => useSyncPendingSubscribe(setCount), []);
  return count;
}

export default function DashboardApp({ onSignOut, onboardingRefreshNonce = 0 }: { onSignOut: () => void; /** Bumped when onboarding backend pushes settle, triggering a data re-fetch. */ onboardingRefreshNonce?: number }) {
  // Role comes from the authenticated backend user (set at login). Admins get the
  // admin workspace, students the student dashboard — there is no manual switching.
  const storedUser = getStoredUser();
  // Real signed-in user + today's date for the header — no hardcoded name or date.
  const userFirstName = (storedUser?.name ?? "Student").trim().split(/\s+/)[0] || "Student";
  const today = new Date();
  const [workspace] = useState<"admin" | "student">(
    storedUser?.role === "admin" ? "admin" : "student",
  );
  const { toast, show } = useToast();
  const pendingSync = useSyncPending();
  const [activePage, setActivePage] = useState<FinancePage>("Dashboard");
  const [dashboardSnapshot, setDashboardSnapshot] = useState<DashboardSnapshot>(readDashboardSnapshot);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [dashboardAction, setDashboardAction] = useState<{ type: DashboardActionType; nonce: number } | null>(null);
  const [mood, setMood] = useState<number>(() => {
    try { const saved = localStorage.getItem("n2-review-mood"); return saved === null ? 2 : Number(saved); } catch { return 2; }
  });
  const [coachTipIndex, setCoachTipIndex] = useState(0);
  const [dashboardChartPeriod, setDashboardChartPeriod] = useState("Month");
  const [annualYear, setAnnualYear] = useState(String(new Date().getFullYear()));
  const [annualRows, setAnnualRows] = useState<Array<{ monthName: string; income: number; expense: number; net: number; transactionCount: number }> | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [growthHover] = useState(false);
  void growthHover;

  // ── Stale-render fix: snapshot localStorage se aata hai jo onboarding ke writes
  // ke turant baad stale ho sakta hai. Fresh profile (jo onboarding writes karta
  // hai) par re-read karke first paint bhi real data dikhata hai. ──
  useEffect(() => {
    setDashboardSnapshot(readDashboardSnapshot());
  }, []);

  const latestMonthKey = dashboardSnapshot.latestTransactionDate.slice(0, 7);
  const periodIncomeTransactions = useMemo(
    () => dashboardSnapshot.transactions.filter((transaction) => transaction.type === "Income" && transaction.date.startsWith(latestMonthKey)),
    [dashboardSnapshot, latestMonthKey],
  );
  const periodExpenseTransactions = useMemo(
    () => dashboardSnapshot.transactions.filter((transaction) => transaction.type === "Expense" && transaction.date.startsWith(latestMonthKey)),
    [dashboardSnapshot, latestMonthKey],
  );
  const chartTransactions = useMemo(
    () => filterDashboardTransactions(dashboardSnapshot.transactions, dashboardChartPeriod, dashboardSnapshot.latestTransactionDate),
    [dashboardSnapshot, dashboardChartPeriod],
  );
  const chartIncome = chartTransactions.filter((transaction) => transaction.type === "Income").reduce((total, transaction) => total + transaction.amount, 0);
  const chartExpenses = chartTransactions.filter((transaction) => transaction.type === "Expense").reduce((total, transaction) => total + transaction.amount, 0);
  const dashboardChartRows = useMemo(() => {
    const groups = new Map<string, { label: string; income: number; expense: number; sort: string }>();
    chartTransactions.forEach((transaction) => {
      const day = Number(transaction.date.slice(8, 10));
      const month = transaction.date.slice(0, 7);
      const key = dashboardChartPeriod === "Week"
        ? transaction.date
        : dashboardChartPeriod === "Month"
          ? `week-${Math.ceil(day / 7)}`
          : month;
      const label = dashboardChartPeriod === "Week"
        ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${transaction.date}T00:00:00Z`))
        : dashboardChartPeriod === "Month"
          ? `W${Math.ceil(day / 7)}`
          : new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
      const current = groups.get(key) ?? { label, income: 0, expense: 0, sort: transaction.date };
      if (transaction.type === "Income") current.income += transaction.amount;
      else current.expense += transaction.amount;
      if (transaction.date < current.sort) current.sort = transaction.date;
      groups.set(key, current);
    });
    return [...groups.values()].sort((a, b) => a.sort.localeCompare(b.sort)).slice(-6);
  }, [chartTransactions, dashboardChartPeriod]);
  // ── Live month-pacing values (real time-based data, no placeholders). ──
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, daysInMonth - today.getDate() + 1);
  const netSavings = dashboardSnapshot.income - dashboardSnapshot.expenses;
  const savingsRate = dashboardSnapshot.income > 0 ? Math.max(0, Math.min(100, Math.round((netSavings / dashboardSnapshot.income) * 100))) : 0;

  // ── Annual profits: real per-month aggregation from the backend (falls back to local snapshot while loading). ──
  useEffect(() => {
    let cancelled = false;
    fetchYearlyReport(Number(annualYear))
      .then((report) => { if (!cancelled) setAnnualRows(report.months); })
      .catch(() => { if (!cancelled) setAnnualRows(null); });
    return () => { cancelled = true; };
  }, [annualYear, dashboardSnapshot]);

  const annualData = useMemo(() => {
    const money = (value: number) => dashboardMoneyCompact(value, dashboardSnapshot.currency);
    if (annualRows && annualRows.length) {
      // Real data: top 3 months by activity + overall net, sized by income volume.
      const active = annualRows.filter((row) => row.transactionCount > 0).sort((a, b) => b.income - a.income).slice(0, 3);
      const yearNet = annualRows.reduce((total, row) => total + row.net, 0);
      const maxSize = 260;
      const maxIncome = Math.max(...active.map((row) => row.income), 1);
      const palette = ["#fdf0eb", "#f7d9cd", "#eba992"];
      const rings = active.map((row, index) => ({
        label: `${money(row.net)}`, monthLabel: row.monthName,
        size: Math.max(96, maxSize - index * 52), bg: palette[index], color: "#1a1a1a", z: index + 1,
        detail: `${row.monthName}: ${money(row.income)} in · ${money(row.expense)} out`,
      }));
      if (rings.length === 0) return null;
      rings.unshift({ label: money(yearNet), monthLabel: "Year net", size: 106, bg: ACCENT, color: "#fff", z: 4, detail: `Net across ${annualYear}` });
      return rings;
    }
    // Offline / no server: derive from local snapshot so the widget stays truthful.
    const txRows = dashboardSnapshot.transactions;
    if (txRows.length === 0) return null;
    const byMonth = new Map<string, { income: number; expense: number }>();
    txRows.forEach((row) => {
      const key = row.date.slice(0, 7);
      const entry = byMonth.get(key) ?? { income: 0, expense: 0 };
      if (row.type === "Income") entry.income += row.amount; else entry.expense += row.amount;
      byMonth.set(key, entry);
    });
    const months = [...byMonth.entries()].sort((a, b) => b[1].income - a[1].income).slice(0, 3);
    const palette = ["#fdf0eb", "#f7d9cd", "#eba992"];
    const rings = months.map(([key, totals], index) => ({
      label: dashboardMoneyCompact(totals.income - totals.expense, dashboardSnapshot.currency),
      monthLabel: new Date(`${key}-01T00:00:00`).toLocaleDateString("en-US", { month: "long" }),
      size: Math.max(96, 260 - index * 52), bg: palette[index], color: "#1a1a1a", z: index + 1,
      detail: `Local data · ${key}`,
    }));
    rings.unshift({ label: dashboardMoneyCompact(netSavings, dashboardSnapshot.currency), monthLabel: "Net", size: 106, bg: ACCENT, color: "#fff", z: 4, detail: "Net across your records" });
    return rings;
  }, [annualRows, annualYear, dashboardSnapshot, netSavings]);

  // Available years: from real transaction history (backend truth), today always included.
  const availableYears = useMemo(() => {
    const years = new Set<number>([today.getFullYear()]);
    dashboardSnapshot.transactions.forEach((row) => years.add(Number(row.date.slice(0, 4))));
    return [...years].sort((a, b) => b - a);
  }, [dashboardSnapshot, today]);

  // ── Sparkline: real cumulative net balance over the last 30 days (S2 fix). ──
  const sparklinePath = useMemo(() => {
    const width = 260;
    const height = 70;
    const points = 30;
    const byDay = new Map<string, number>();
    dashboardSnapshot.transactions.forEach((row) => {
      const delta = row.type === "Income" ? row.amount : -row.amount;
      byDay.set(row.date, (byDay.get(row.date) ?? 0) + delta);
    });
    const days: number[] = [];
    let running = 0;
    for (let i = points - 1; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      running += byDay.get(key) ?? 0;
      days.push(running);
    }
    if (days.every((value) => value === 0)) return null; // no activity — show flat placeholder
    const min = Math.min(...days);
    const max = Math.max(...days);
    const range = max - min || 1;
    const coords = days.map((value, index) => {
      const x = (index / (points - 1)) * width;
      const y = height - 8 - ((value - min) / range) * (height - 20);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return { line: `M${coords.join(" L")}`, area: `M0,${height} L${coords.join(" L")} L${width},${height} Z` };
  }, [dashboardSnapshot, today]);

  // ── Money Coach: rotating live-data tips shown under the greeting. ──
  const coachTip = useMemo(() => {
    const money = (amount: number) => dashboardMoney(amount, dashboardSnapshot.currency);
    const net = dashboardSnapshot.income - dashboardSnapshot.expenses;
    const pace = Math.min(100, Math.round((dashboardSnapshot.expenses / Math.max(1, dashboardSnapshot.income)) * 100));
    const tips = [
      net >= 0
        ? `You've kept ${money(net)} more than you spent — a solid buffer.`
        : `Spending is ahead of income by ${money(Math.abs(net))}. Time to pause non-essentials.`,
      `You've used ${pace}% of your income so far. ${pace > 80 ? "Tighten up to finish the month strong." : "Healthy pacing — keep it up."}`,
      dashboardSnapshot.goals.length > 0
        ? `${dashboardSnapshot.goals.length} active goal${dashboardSnapshot.goals.length > 1 ? "s" : ""} — the next contribution matters more than the amount.`
        : "No saving goal yet — even Rs 500/month builds a real habit.",
      dashboardSnapshot.budgets.length > 0
        ? `${dashboardSnapshot.budgets.filter((budget) => budget.spent >= budget.limit).length} of ${dashboardSnapshot.budgets.length} budgets crossed this month.`
        : "Set one category budget to unlock smarter alerts.",
    ];
    return tips[coachTipIndex % tips.length];
  }, [coachTipIndex, dashboardSnapshot]);

  const chartMax = Math.max(...dashboardChartRows.flatMap((row) => [row.income, row.expense]), 1);
  const periodIncomeTotal = periodIncomeTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  const periodExpenseTotal = periodExpenseTransactions.reduce((total, transaction) => total + transaction.amount, 0);

  const toggleTask = (id: number) =>
    setManualTasks((current) => current.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  // ── Smart Tasks: real-time tasks derived from live financial data + manual tasks. ──
  // Smart tasks recompute on every snapshot change (transaction saved, budget edited,
  // goal contribution...) so the drawer always mirrors the user's actual money state.
  const [manualTasks, setManualTasks] = useState<Array<{ id: number; title: string; done: boolean }>>(() => {
    try {
      const raw = localStorage.getItem("n2-smart-manual-tasks");
      return raw ? (JSON.parse(raw) as Array<{ id: number; title: string; done: boolean }>) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try { localStorage.setItem("n2-smart-manual-tasks", JSON.stringify(manualTasks)); } catch { /* ignore */ }
  }, [manualTasks]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const smartTasks = useMemo(() => {
    const rows: Array<{ id: string; title: string; tag: string; time: string; done: boolean; smart: true }> = [];
    const currency = dashboardSnapshot.currency;
    const money = (amount: number) => dashboardMoney(amount, currency);
    const latestMonth = dashboardSnapshot.latestTransactionDate.slice(0, 7);
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // 1) Budget pressure — categories at/over their monthly limit.
    dashboardSnapshot.budgets.forEach((budget) => {
      if (!budget.alerts) return;
      const pct = budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0;
      if (pct >= 100) {
        rows.push({ id: `budget-over-${budget.category}`, title: `${budget.category} budget crossed — ${money(budget.spent)} of ${money(budget.limit)}`, tag: "Budget", time: "Over limit", done: false, smart: true });
      } else if (pct >= 80) {
        rows.push({ id: `budget-warn-${budget.category}`, title: `${budget.category} budget at ${pct}% — ${money(budget.limit - budget.spent)} left`, tag: "Budget", time: "Almost there", done: false, smart: true });
      }
    });

    // 2) Goal milestones — next meaningful push for every active goal.
    dashboardSnapshot.goals.forEach((goal) => {
      const pct = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0;
      if (pct >= 100) {
        rows.push({ id: `goal-done-${goal.id}`, title: `${goal.name} goal complete — time to set the next one`, tag: "Goal", time: "100%", done: false, smart: true });
      } else {
        const nextStep = Math.max(1, Math.ceil((goal.target - goal.saved) / 4));
        rows.push({ id: `goal-step-${goal.id}`, title: `Add ${money(nextStep)} toward “${goal.name}” (${pct}% done)`, tag: "Goal", time: `${goal.target - goal.saved > 0 ? money(goal.target - goal.saved) : "0"} to go`, done: false, smart: true });
      }
    });

    // 3) Recurring payments — monthly commitments surfaced as review tasks.
    dashboardSnapshot.recurring.forEach((row) => {
      rows.push({ id: `recurring-${row.id}`, title: `Review recurring payment: ${row.title} (${money(row.amount)}/mo)`, tag: "Recurring", time: "Monthly", done: false, smart: true });
    });

    // 4) Logging habit — gentle nudge when nothing has been logged today.
    const loggedToday = dashboardSnapshot.transactions.some((row) => row.date === todayKey);
    if (!loggedToday) {
      rows.push({ id: "log-today", title: "Log today's income & expenses", tag: "Habit", time: "Daily", done: false, smart: true });
    }

    // 5) Savings rate insight — fires once per month when spending outpaces saving.
    const monthIncome = dashboardSnapshot.transactions.filter((row) => row.type === "Income" && row.date.startsWith(latestMonth)).reduce((sum, row) => sum + row.amount, 0);
    const monthExpense = dashboardSnapshot.transactions.filter((row) => row.type === "Expense" && row.date.startsWith(latestMonth)).reduce((sum, row) => sum + row.amount, 0);
    if (monthIncome > 0 && monthExpense > monthIncome * 0.9) {
      rows.push({ id: "spend-pace", title: `Spending is ${Math.round((monthExpense / monthIncome) * 100)}% of income this month — slow down`, tag: "Insight", time: latestMonth, done: false, smart: true });
    }

    return rows;
  }, [dashboardSnapshot, today]);

  const [dismissedSmartTasks, setDismissedSmartTasks] = useState<string[]>([]);
  const visibleSmartTasks = smartTasks.filter((task) => !dismissedSmartTasks.includes(task.id));
  const dismissSmartTask = (id: string) => setDismissedSmartTasks((current) => [...current, id]);
  const manualRows = manualTasks.map((task) => ({ ...task, tag: "My task", time: "Manual", smart: false as const }));
  const allTasks = [...visibleSmartTasks, ...manualRows];
  const remaining = allTasks.filter((task) => !task.done).length;
  const doneCount = allTasks.filter((task) => task.done).length;
  const addManualTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    setManualTasks((current) => [{ id: Date.now(), title, done: false }, ...current]);
    setNewTaskTitle("");
    show("Task added to your list");
  };

  // Money Coach tip cycles automatically so the greeting always shows fresh advice.
  useEffect(() => {
    const t = setInterval(() => setCoachTipIndex((i) => i + 1), 7000);
    return () => clearInterval(t);
  }, []);

  const requestDashboardAction = (type: DashboardActionType) => {
    if (activePage !== "Dashboard") setActivePage("Dashboard");
    setDashboardAction({ type, nonce: Date.now() });
  };

  // ── Keyboard shortcuts (S8): Ctrl+K → Transactions search focus, Esc → close overlays, g+d/g+t/g+s → page jumps. ──
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setActivePage("Transactions");
        setSidebarOpen(false);
        setTimeout(() => {
          document.querySelector<HTMLInputElement>("input[placeholder='Search transactions...'], input[aria-label='Search student finance activity']")?.focus();
        }, 60);
        return;
      }
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setTasksOpen(false);
        setCalendarOpen(false);
        return;
      }
      if (!typing && (event.altKey || event.key === "g")) {
        const jumps: Record<string, FinancePage> = { d: "Dashboard", t: "Transactions", g: "Student Save Goals", r: "Reports", s: "Settings" };
        const page = jumps[event.key.toLowerCase()];
        if (page) {
          event.preventDefault();
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // annualData is derived above from real backend aggregation (or local snapshot offline).

  if (workspace === "admin") {
    return <AdminWorkspace studentSnapshot={dashboardSnapshot} onSignOut={onSignOut} />;
  }

  return (
    <div className="dashboard-shell min-h-screen">
      <div className="w-full bg-[#fefefe] overflow-hidden relative">
        {/* HEADER */}
        <header className="px-5 md:px-10 pt-6 md:pt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white border border-black/[0.06] flex flex-col items-center justify-center gap-[5px] hover:bg-black hover:text-white transition-all duration-300 group"
              aria-label="menu"
            >
              <span className="w-4 h-[1.8px] bg-current rounded-full" />
              <span className="w-[11px] h-[1.8px] bg-current rounded-full self-start ml-[14px] md:ml-[15px] group-hover:w-4 transition-all" />
            </button>
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-black text-white flex items-center justify-center font-extrabold text-[17px] tracking-tight">
              N<span className="text-[13px] -ml-[1px]">2</span>
            </div>
            <div className="leading-[1.1]">
              <div className="font-bold text-[17px] md:text-[19px] tracking-tight text-neutral-900">Financial</div>
              <div className="-mt-[2px] max-w-[190px] truncate text-[14px] font-light tracking-tight text-neutral-400 md:text-[16px]">{activePage}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5 flex-wrap">
            {pendingSync > 0 && (
              <span role="status" aria-live="polite" className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[10px] font-semibold text-neutral-600">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#e1694a]" aria-hidden="true" />
                Syncing…
              </span>
            )}
            <button onClick={onSignOut} className="flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-[11px] font-semibold transition hover:border-black hover:bg-black hover:text-white md:h-[52px]" title="Sign out"><LogOut size={15} /> Sign out</button>
            <button
              onClick={() => show("Create new — wallet, invoice or task")}
              className="w-11 h-11 md:w-[52px] md:h-[52px] rounded-full border border-black/10 bg-white flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all"
            >
              <Plus size={18} />
            </button>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => show("Search activated — type to filter")}
                className="w-[52px] h-[52px] rounded-full border border-black/10 bg-white flex items-center justify-center hover:bg-black hover:text-white transition-all"
              >
                <Search size={19} strokeWidth={1.8} />
              </button>
              <div className="relative">
                <input
                  placeholder="Start searching here ..."
                  className="bg-transparent text-[13.5px] placeholder:text-neutral-400 text-neutral-700 outline-none w-[190px] lg:w-[210px] border-b border-transparent focus:border-black/20 pb-1 transition-all"
                  onFocus={() => {}}
                />
              </div>
            </div>

            {/* mobile search */}
            <button className="md:hidden w-11 h-11 rounded-full border border-black/10 bg-white flex items-center justify-center">
              <Search size={18} />
            </button>
          </div>
        </header>

        {/* SUB HEADER */}
        <div className="px-5 md:px-10 mt-6 md:mt-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="w-[84px] h-[84px] md:w-[106px] md:h-[106px] rounded-full border border-black/10 bg-white flex items-center justify-center shrink-0">
              <span className="text-[28px] md:text-[32px] font-semibold tracking-tight">{today.getDate()}</span>
            </div>
            <div className="leading-tight">
              <div className="text-[15px] md:text-[17px] font-medium">{today.toLocaleDateString("en-US", { weekday: "short" })},</div>
              <div className="text-[15px] md:text-[17px] font-medium">{today.toLocaleDateString("en-US", { month: "long" })}</div>
            </div>
            <div className="w-px h-10 bg-black/15 mx-1 md:mx-2" />
            <button
              onClick={() => setTasksOpen(true)}
              className="group bg-[#e1694a] hover:bg-[#c95a3e] text-white rounded-full pl-5 md:pl-6 pr-2 py-2 flex items-center gap-4 md:gap-8 transition-all shadow-[0_10px_25px_-8px_rgba(225,105,74,0.6)]"
            >
              <span className="text-[13px] md:text-[14px] font-medium whitespace-nowrap">
                Show my Tasks
                {remaining > 0 && <span className="ml-2 inline-flex min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 py-[1px] text-[10px] font-bold text-[#e1694a] align-middle">{remaining}</span>}
              </span>
              <span className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight size={18} />
              </span>
            </button>
            <div className="relative">
              <button
                onClick={() => setCalendarOpen((v) => !v)}
                className={cn(
                  "w-[52px] h-[52px] rounded-full border flex items-center justify-center transition-all",
                  calendarOpen ? "bg-black text-white border-black" : "bg-white border-black/10 hover:border-black"
                )}
              >
                <CalendarIcon size={20} strokeWidth={1.7} />
                <span className="absolute top-[10px] right-[11px] w-[6px] h-[6px] rounded-full bg-[#e1694a] border-2 border-[#fbfbfb]" />
              </button>
              {calendarOpen && (() => {
                const viewYear = calendarMonth.getFullYear();
                const viewMonth = calendarMonth.getMonth();
                const daysInView = new Date(viewYear, viewMonth + 1, 0).getDate();
                const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday-first
                const monthTx = dashboardSnapshot.transactions.filter((row) => row.date.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`));
                const spendByDay = new Map<number, number>();
                monthTx.forEach((row) => {
                  if (row.type !== "Expense") return;
                  const day = Number(row.date.slice(8, 10));
                  spendByDay.set(day, (spendByDay.get(day) ?? 0) + row.amount);
                });
                const maxDaySpend = Math.max(...spendByDay.values(), 1);
                return (
                <div className="absolute top-[60px] left-0 z-30 w-[280px] bg-white rounded-2xl shadow-2xl border border-black/10 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      aria-label="Previous month"
                      onClick={() => setCalendarMonth(new Date(viewYear, viewMonth - 1, 1))}
                      className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs hover:bg-black hover:text-white"
                    >‹</button>
                    <div className="text-center">
                      <div className="font-semibold text-sm">{calendarMonth.toLocaleDateString("en-US", { month: "long" })} {viewYear}</div>
                      <div className="text-[9px] text-neutral-400">{monthTx.length} transaction{monthTx.length === 1 ? "" : "s"} · {monthTx.filter((row) => row.type === "Expense").reduce((sum, row) => sum + row.amount, 0) > 0 ? dashboardMoney(monthTx.filter((row) => row.type === "Expense").reduce((sum, row) => sum + row.amount, 0), dashboardSnapshot.currency) : "Rs 0"} spent</div>
                    </div>
                    <button
                      aria-label="Next month"
                      onClick={() => setCalendarMonth(new Date(viewYear, viewMonth + 1, 1))}
                      className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs hover:bg-black hover:text-white"
                    >›</button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-neutral-400 mb-1">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                      <div key={i}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
                    {Array.from({ length: firstWeekday }).map((_, i) => <span key={`pad-${i}`} />)}
                    {Array.from({ length: daysInView }).map((_, i) => {
                      const day = i + 1;
                      const spend = spendByDay.get(day) ?? 0;
                      const isToday = viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
                      const intensity = spend > 0 ? Math.min(0.9, 0.15 + (spend / maxDaySpend) * 0.75) : 0;
                      return (
                        <button
                          key={day}
                          onClick={() => {
                            show(spend > 0 ? `${dashboardMoney(spend, dashboardSnapshot.currency)} spent on ${calendarMonth.toLocaleDateString("en-US", { month: "short" })} ${day}` : `Nothing logged on ${calendarMonth.toLocaleDateString("en-US", { month: "short" })} ${day}`);
                          }}
                          title={spend > 0 ? `${dashboardMoney(spend, dashboardSnapshot.currency)} spent` : undefined}
                          className={cn(
                            "h-8 rounded-full flex items-center justify-center transition-all",
                            isToday ? "bg-[#e1694a] text-white font-bold" : intensity > 0 ? "text-neutral-800" : "text-neutral-400 hover:bg-neutral-100",
                          )}
                          style={!isToday && intensity > 0 ? { backgroundColor: `rgba(225, 105, 74, ${intensity.toFixed(2)})` } : undefined}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-4 md:gap-8 flex-1">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[26px] md:text-[38px] leading-[1.05] font-medium tracking-tight text-neutral-900">
                  Hey, {userFirstName}
                </h2>
                <span className="inline-flex w-8 h-8 md:w-10 md:h-10 items-center justify-center">
                  <Hand
                    size={30}
                    className="text-[#eab308] fill-[#fde68a] stroke-[#b45309] origin-bottom"
                    style={{ animation: "wave-hand 2.2s ease-in-out infinite" }}
                  />
                </span>
              </div>
              <div className="text-[24px] md:text-[36px] leading-[1.05] font-light text-neutral-900/25 tracking-tight flex items-center gap-2">
                <span className="w-[2px] h-[26px] md:h-[36px] bg-neutral-900/70 caret-blink inline-block" />
                Let’s put your money in perspective!
              </div>
            </div>
            <button
              onClick={() => {
                setCoachTipIndex((i) => i + 1);
                show(coachTip);
              }}
              className="group w-[72px] h-[72px] md:w-[104px] md:h-[104px] rounded-full bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.12)] flex items-center justify-center transition-all shrink-0 hover:bg-black hover:text-white"
              title="Money Coach — next tip"
            >
              <Sparkles size={26} strokeWidth={1.7} className="text-[#e1694a] transition-colors group-hover:text-white" />
            </button>
          </div>
        </div>

        {/* DASHBOARD OVERVIEW */}
        {activePage === "Dashboard" && <div className="px-5 md:px-10 mt-6 md:mt-8 pb-8 md:pb-10">
          <div className="grid grid-cols-12 gap-4 md:gap-5">
            {/* LEFT RAIL */}
            <div className="hidden lg:flex col-span-1 flex-col gap-3">
              <nav aria-label="Student dashboard shortcuts" className="flex-1 min-h-[188px] bg-[#f4f4f4] border border-black/[0.04] rounded-full flex flex-col items-center justify-between py-2">
                <div className="flex flex-col items-center">
                  {sidebarItems.slice(1).map(({ title, icon: Icon }) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => {
                        setActivePage(title);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      title={title}
                      aria-label={`Open ${title}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white focus-visible:outline-none"
                    >
                      <Icon size={15} strokeWidth={1.8} />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => requestDashboardAction("expense")}
                  title="Add an expense"
                  aria-label="Add an expense"
                  className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white focus-visible:outline-none transition-colors"
                >
                  <Plus size={18} />
                </button>
              </nav>
              <button
                onClick={() => show("Share dashboard link copied")}
                className="w-full aspect-square rounded-full bg-[#f4f4f4] border border-black/[0.04] flex items-center justify-center hover:bg-black hover:text-white transition-all"
              >
                <Share2 size={17} />
              </button>
            </div>

            {/* CURRENT AVAILABLE BALANCE */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col gap-4">
              <div className="bg-[#f4f4f4] border border-black/[0.04] rounded-[26px] p-5 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-neutral-400">Current available balance</div>
                    <div className="mt-2 text-[29px] font-semibold tracking-[-0.04em] text-neutral-900 md:text-[32px]">
                      {dashboardMoney(dashboardSnapshot.income - dashboardSnapshot.expenses, dashboardSnapshot.currency)}
                    </div>
                  </div>
                  <span className="w-10 h-10 rounded-full border border-black/[0.06] bg-white flex items-center justify-center text-[#e1694a] shrink-0">
                    <Wallet size={17} />
                  </span>
                </div>
                <div className="mt-4 border-t border-black/[0.06] pt-3.5 grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-1 text-[9px] text-neutral-400"><ArrowDownLeft size={12} className="text-[#e1694a]" /> Total income</div>
                    <div className="mt-1 text-[13px] font-semibold text-neutral-900">{dashboardMoney(dashboardSnapshot.income, dashboardSnapshot.currency)}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-[9px] text-neutral-400"><ArrowUpRight size={12} className="text-[#e1694a]" /> Total expenses</div>
                    <div className="mt-1 text-[13px] font-semibold text-neutral-900">{dashboardMoney(dashboardSnapshot.expenses, dashboardSnapshot.currency)}</div>
                  </div>
                </div>
                <div className="mt-3 text-[9px] text-neutral-400">Balance reflects all recorded student transactions.</div>
              </div>
              <div className="px-1 flex items-end justify-between gap-2">
                <div>
                  <div className="text-[10px] text-neutral-400">Student cash flow</div>
                  <div className={cn("mt-1 text-[14px] font-semibold", dashboardSnapshot.income >= dashboardSnapshot.expenses ? "text-emerald-700" : "text-[#e1694a]")}>{dashboardSnapshot.income >= dashboardSnapshot.expenses ? "In good shape" : "Needs a check-in"}</div>
                </div>
                <button onClick={() => setActivePage("Transactions")} className="flex items-center gap-1 text-[10px] font-semibold text-[#c85b40] hover:text-black transition-colors">
                  View activity <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* ADD INCOME / ADD EXPENSE */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-3 flex flex-col gap-4">
              <button
                onClick={() => requestDashboardAction("income")}
                title="Add income"
                className="bg-[#f4f4f4] border border-black/[0.04] rounded-[26px] p-5 text-left w-full hover:border-[#e1694a]/40 hover:bg-[#f7f1ee] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-full border border-black/10 bg-white flex items-center justify-center">
                    <ArrowDownLeft size={16} />
                  </span>
                  <span className="text-[11.5px] font-semibold bg-black text-white rounded-full px-4 py-[7px] flex items-center gap-2 transition-all group-hover:bg-[#e1694a]">
                    Add income <Plus size={13} />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-neutral-400">
                  Total income
                  <span className="text-[8.5px] font-semibold uppercase tracking-wider bg-white border border-black/[0.06] rounded-full px-1.5 py-[1px]">this month</span>
                </div>
                <div className="mt-1 text-[19px] font-semibold tracking-tight">
                  {dashboardMoney(periodIncomeTotal, dashboardSnapshot.currency)}
                </div>
                <div className="mt-2 text-[9px] text-[#c85b40] font-medium flex items-center gap-1">
                  <Plus size={11} /> Record a new incoming payment
                </div>
              </button>

              <button
                onClick={() => requestDashboardAction("expense")}
                title="Add expense"
                className="bg-[#f4f4f4] border border-black/[0.04] rounded-[26px] p-5 text-left w-full hover:border-[#e1694a]/40 hover:bg-[#f7f1ee] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-full border border-black/10 bg-white flex items-center justify-center">
                    <ArrowUpRight size={16} />
                  </span>
                  <span className="text-[11.5px] font-semibold bg-black text-white rounded-full px-4 py-[7px] flex items-center gap-2 transition-all group-hover:bg-[#e1694a]">
                    Add expense <Plus size={13} />
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-neutral-400">
                  Total expenses
                  <span className="text-[8.5px] font-semibold uppercase tracking-wider bg-white border border-black/[0.06] rounded-full px-1.5 py-[1px]">this month</span>
                </div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <div className="text-[19px] font-semibold tracking-tight">
                    {dashboardMoney(periodExpenseTotal, dashboardSnapshot.currency)}
                  </div>
                  <span className="w-6 h-6 rounded-full bg-[#e1694a]/90 text-white flex items-center justify-center">
                    <TrendingUp size={12} />
                  </span>
                </div>
                <div className="mt-2 text-[9px] text-[#c85b40] font-medium flex items-center gap-1">
                  <Plus size={11} /> Record a new spend
                </div>
              </button>
            </div>

            {/* CREATE GOALS + GROWTH */}
            <div className="col-span-6 lg:col-span-2 flex flex-col items-center gap-4">
              <button
                onClick={() => requestDashboardAction("goal")}
                title="Create a new saving goal"
                className="w-full max-w-[150px] aspect-square rounded-full bg-[#f4f4f4] border border-black/[0.04] flex flex-col items-center justify-center gap-2 hover:bg-[#e1694a] hover:text-white hover:border-[#e1694a] hover:-translate-y-0.5 transition-all group"
              >
                <span className="w-9 h-9 rounded-full bg-white text-[#e1694a] flex items-center justify-center transition-colors group-hover:bg-white/20 group-hover:text-white">
                  <Target size={17} />
                </span>
                <span className="text-[12px] font-medium leading-tight text-center px-2">
                  Create <br /> Goals
                </span>
              </button>
              <div
                onClick={() => show(`Savings rate ${savingsRate}% — income minus expenses this month`)}
                className="w-full max-w-[150px] aspect-square rounded-full bg-black text-white flex items-center justify-center relative cursor-pointer hover:scale-[1.03] transition-transform"
              >
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#2a2a2a" strokeWidth="7" />
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#e1694a" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${savingsRate * 2.387} 238.7`} className="transition-all duration-1000" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="8 10" opacity="0.9" />
                </svg>
                <div className="text-center relative">
                  <div className="text-[19px] font-semibold leading-none">{savingsRate}%</div>
                  <div className="text-[10px] text-white/50 mt-1">Savings rate</div>
                </div>
              </div>
            </div>

            {/* LIVE SAVINGS PACE — days left + safe-to-spend */}
            <div className="col-span-6 lg:col-span-3 grid grid-cols-2 lg:grid-cols-2 gap-4">
              <div className="bg-[#f4f4f4] border border-black/[0.04] rounded-[24px] p-4 flex flex-col">
                <span className="w-8 h-8 rounded-full bg-white border border-black/[0.06] flex items-center justify-center">
                  <Clock3 size={15} />
                </span>
                <div className="mt-3 font-semibold text-[16px] tracking-tight">{daysLeft} Days</div>
                <div className="text-[10.5px] text-neutral-500">left in {today.toLocaleDateString("en-US", { month: "long" })}</div>
                <div className="mt-3 grid grid-cols-7 gap-[5px]">
                  {Array.from({ length: daysInMonth }).map((_, i) => (
                    <span
                      key={i}
                      className={cn("h-[9px] w-[9px] rounded-full", i < daysInMonth - daysLeft + 1 ? "bg-[#e1694a]" : "bg-black/10")}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-[#f4f4f4] border border-black/[0.04] rounded-[24px] p-3 sm:p-4 flex min-h-[196px] flex-col">
                <div className="flex items-center justify-between gap-1">
                  <span className="w-8 h-8 rounded-full bg-white border border-black/[0.06] flex items-center justify-center shrink-0">
                    <BarChart3 size={15} />
                  </span>
                  <button
                    onClick={() => {
                      const periods = ["Week", "Month", "Semester", "All time"];
                      setDashboardChartPeriod(periods[(periods.indexOf(dashboardChartPeriod) + 1) % periods.length]);
                    }}
                    aria-label={`Change income and expenses period, currently ${dashboardChartPeriod}`}
                    className="flex items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1.5 text-[9px] font-medium hover:border-black transition-all"
                  >
                    {dashboardChartPeriod} <ChevronDown size={10} className="fill-black" />
                  </button>
                </div>
                <div className="mt-2.5 text-[10px] font-semibold tracking-tight">Income vs expenses</div>
                <div className="mt-1 grid grid-cols-2 gap-1 text-[8px]">
                  <span className="truncate font-semibold text-[#c85b40]" title={`Income ${dashboardMoney(chartIncome, dashboardSnapshot.currency)}`}>
                    +{dashboardMoneyCompact(chartIncome, dashboardSnapshot.currency)}
                  </span>
                  <span className="truncate text-right font-semibold text-neutral-600" title={`Expenses ${dashboardMoney(chartExpenses, dashboardSnapshot.currency)}`}>
                    -{dashboardMoneyCompact(chartExpenses, dashboardSnapshot.currency)}
                  </span>
                </div>
                <div className="mt-2 flex flex-1 items-end justify-center gap-1.5 border-b border-black/[0.08] bg-white px-2 pb-1.5 pt-2">
                  {dashboardChartRows.length === 0 ? (
                    <span className="pb-6 text-center text-[8px] text-neutral-400">No activity yet</span>
                  ) : dashboardChartRows.map((row, index) => {
                    const incomeHeight = row.income ? Math.max(3, (row.income / chartMax) * 68) : 2;
                    const expenseHeight = row.expense ? Math.max(3, (row.expense / chartMax) * 68) : 2;
                    return (
                      <div key={row.label} className="flex h-[77px] min-w-0 flex-1 flex-col items-center justify-end gap-1">
                        <div className="flex h-[68px] w-full items-end justify-center gap-[2px]">
                          <div title={`${row.label} income: ${dashboardMoney(row.income, dashboardSnapshot.currency)}`} className="flow-bar w-[38%] max-w-3 rounded-t-sm bg-[#e1694a]" style={{ height: `${incomeHeight}px`, animationDelay: `${index * 60}ms` }} />
                          <div title={`${row.label} expenses: ${dashboardMoney(row.expense, dashboardSnapshot.currency)}`} className="flow-bar w-[38%] max-w-3 rounded-t-sm bg-black/20" style={{ height: `${expenseHeight}px`, animationDelay: `${index * 60 + 35}ms` }} />
                        </div>
                        <span className="max-w-full truncate text-[7px] text-neutral-400">{row.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[7px] text-neutral-400">
                  <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#e1694a]" />Income</span>
                  <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-black/20" />Expenses</span>
                </div>
              </div>
            </div>

            {/* ANNUAL PROFITS */}
            <div className="col-span-12 sm:col-span-5 lg:col-span-3 bg-[#f4f4f4] border border-black/[0.04] rounded-[26px] p-5 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[15px] tracking-tight">Annual profits</h3>
                <button
                  onClick={() => {
                    const idx = availableYears.indexOf(Number(annualYear));
                    setAnnualYear(String(availableYears[(idx + 1) % availableYears.length]));
                  }}
                  title="Switch year"
                  className="text-[12px] font-medium border border-black/10 bg-white rounded-full px-4 py-[6px] flex items-center gap-2 hover:border-black transition-all"
                >
                  {annualYear} <ChevronDown size={12} className="fill-black" />
                </button>
              </div>
              <div className="flex-1 flex items-end justify-center pt-6 relative min-h-[260px]">
                <div className="relative w-[260px] h-[260px] flex items-end justify-center">
                  {annualData ? annualData.map((c) => (
                    <div
                      key={`${c.monthLabel}-${c.z}`}
                      title={c.detail}
                      className="absolute bottom-0 rounded-full flex justify-center transition-all duration-700"
                      style={{
                        width: c.size,
                        height: c.size,
                        background: c.bg,
                        zIndex: c.z,
                        boxShadow: c.z === 4 ? "0 18px 30px -12px rgba(225,105,74,0.55)" : "none",
                        border: c.z === 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                      }}
                    >
                      <span
                        className="mt-3 text-[15px] font-medium"
                        style={{ color: c.color }}
                      >
                        {c.monthLabel === "Year net" || c.monthLabel === "Net" ? (
                          <span className={c.z === 4 ? "text-white/70" : "text-[#e1694a]"}>{c.label}</span>
                        ) : (
                          <span className="text-[11px] font-semibold opacity-80">{c.monthLabel.slice(0, 3)} · {c.label}</span>
                        )}
                      </span>
                    </div>
                  )) : (
                    <div className="flex h-[260px] w-[260px] flex-col items-center justify-center rounded-full border border-dashed border-black/15 text-center">
                      <p className="px-8 text-[12px] font-semibold text-neutral-500">No data for {annualYear}</p>
                      <p className="mt-2 px-8 text-[10px] leading-relaxed text-neutral-400">Add transactions and your yearly income, expenses and net will build up here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <StudentActivityManager snapshot={dashboardSnapshot} onNavigate={setActivePage} />

            {/* RIGHT STACK */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
              <div className="bg-[#f4f4f4] border border-black/[0.04] rounded-[24px] p-5">
                <div className="flex items-start justify-between">
                  <span className="w-9 h-9 rounded-full bg-white border border-black/[0.06] flex items-center justify-center">
                    <ArrowLeftRight size={14} className="rotate-90" />
                  </span>
                  <div className="text-[18px] font-semibold tracking-tight">
                    {dashboardMoney(netSavings, dashboardSnapshot.currency)}
                  </div>
                </div>
                {/* sparkline */}
                <div className="mt-1 -mx-1">
                  <svg viewBox="0 0 260 70" className="w-full h-[64px]" role="img" aria-label="Net balance over the last 30 days">
                    <defs>
                      <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e1694a" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#e1694a" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {sparklinePath ? (
                      <>
                        <path d={sparklinePath.area} fill="url(#stockFill)" />
                        <path d={sparklinePath.line} fill="none" stroke="#e1694a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </>
                    ) : (
                      <line x1="0" y1="35" x2="260" y2="35" stroke="#d4d4d4" strokeWidth="2" strokeDasharray="4 6" />
                    )}
                  </svg>
                </div>
                <div className="flex items-end justify-between mt-1">
                  <div>
                    <div className="text-[17px] font-semibold tracking-tight">Net position</div>
                    <div className="text-[11px] text-neutral-500">{dashboardSnapshot.transactions.length} recorded entries</div>
                  </div>
                  <span className={cn("text-[12px] font-semibold border bg-white rounded-full px-3 py-1", netSavings >= 0 ? "text-emerald-600 border-emerald-600/25" : "text-red-600 border-red-600/25")}>
                    {netSavings >= 0 ? "+" : ""}{savingsRate}%
                  </span>
                </div>
              </div>

              <div className="bg-[#f4f4f4] border border-black/[0.04] rounded-[24px] p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-[6px] h-[6px] rounded-full bg-black/10" />
                    <span className="w-[6px] h-[6px] rounded-full bg-black/10" />
                    <span className="w-[18px] h-[6px] rounded-full bg-black" />
                  </div>
                  <button onClick={() => show("Feedback dismissed")} className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center hover:bg-black hover:text-white transition-all">
                    <X size={13} />
                  </button>
                </div>
                <div className="mt-4 text-[11px] text-neutral-400">Review rating</div>
                <div className="text-[19px] font-semibold leading-[1.2] tracking-tight mt-1">
                  How is your financial journey going?
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  {[
                    { icon: "arch-up", label: "Excellent" },
                    { icon: "arch-down", label: "Good" },
                    { icon: "line", label: "Okay" },
                    { icon: "smile-small", label: "Bad" },
                    { icon: "smile", label: "Terrible" },
                  ].map((m, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setMood(i);
                        try { localStorage.setItem("n2-review-mood", String(i)); } catch { /* ignore */ }
                        show(`Feedback: ${m.label} — thanks!`);
                      }}
                      title={m.label}
                      className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center transition-all border",
                        mood === i
                          ? "bg-black text-white border-black scale-105 shadow-lg"
                          : "bg-white border-black/[0.04] hover:border-black hover:scale-105"
                      )}
                    >
                      {/* custom mouth shapes to match reference */}
                      {i === 0 && (
                        <span className="block w-4 h-2 border-[1.8px] border-current border-b-0 rounded-t-full mt-[2px]" />
                      )}
                      {i === 1 && (
                        <span className="block w-4 h-[6px] border-[1.8px] border-current border-b-0 rounded-t-[99px] scale-[0.85]" />
                      )}
                      {i === 2 && <span className="block w-4 h-[2px] bg-current rounded-full" />}
                      {i === 3 && (
                        <span className="block w-4 h-2 border-[1.8px] border-current border-t-0 rounded-b-full mb-[2px]" />
                      )}
                      {i === 4 && (
                        <span className="block w-4 h-[9px] border-[1.8px] border-current border-t-0 rounded-b-full mb-[1px]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>}

        <FinancePages
          activePage={activePage}
          onToast={show}
          onNavigate={setActivePage}
          onDashboardData={setDashboardSnapshot}
          dashboardPeriod={dashboardChartPeriod}
          actionRequest={dashboardAction}
          onActionConsumed={() => setDashboardAction(null)}
          refreshNonce={onboardingRefreshNonce}
        />

        {/* SIDEBAR NAVIGATION */}
        <div className={cn("fixed inset-0 z-[70] transition-all duration-300", sidebarOpen ? "visible" : "invisible")}>
          <button
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className={cn("absolute inset-0 h-full w-full bg-black/30 backdrop-blur-[2px] transition-opacity", sidebarOpen ? "opacity-100" : "opacity-0")}
          />
          <aside className={cn("absolute left-0 top-0 flex h-full w-[min(88vw,360px)] flex-col bg-[#fbfbfb] p-5 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:p-6", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-[15px] font-extrabold tracking-tight text-white">N2</div>
                <div className="leading-tight"><div className="text-[15px] font-bold">Financial</div><div className="mt-0.5 text-[10px] text-neutral-400">STUDENT MONEY SPACE</div></div>
              </div>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close navigation" className="flex h-9 w-9 items-center justify-center rounded-full bg-white transition hover:bg-black hover:text-white"><X size={15} /></button>
            </div>

            <div className="mt-6 mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">Workspace</div>
            <nav aria-label="Main navigation" className="scroll-thin flex-1 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const selected = activePage === item.title;
                return <button
                  key={item.title}
                  onClick={() => { setActivePage(item.title); setSidebarOpen(false); }}
                  aria-current={selected ? "page" : undefined}
                  className={cn("group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all", selected ? "bg-black text-white shadow-lg shadow-black/10" : "text-neutral-600 hover:bg-[#f0f0f0] hover:text-black")}
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition", selected ? "bg-[#e1694a] text-white" : "bg-white text-neutral-500 group-hover:text-black")}><Icon size={16} strokeWidth={1.8} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold">{item.title}</span><span className={cn("mt-0.5 block truncate text-[9px]", selected ? "text-white/50" : "text-neutral-400")}>{item.description}</span></span>
                  <ChevronRight size={14} className={cn("shrink-0 transition-transform", selected ? "text-white/50" : "text-neutral-300 group-hover:translate-x-0.5")} />
                </button>;
              })}
            </nav>

            <div className="mt-5 rounded-[22px] bg-[#f4f4f4] p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#e1694a]"><Sparkles size={13} /></span>Student finance tip</div>
              <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">Small, regular saving goals can make big expenses easier to plan for.</p>
              <button onClick={() => { setActivePage("AI Insights & Saving Tips"); setSidebarOpen(false); }} className="mt-2 text-[10px] font-semibold text-[#c85b40]">See your insights <ArrowRight size={12} className="ml-1 inline" /></button>
            </div>
            <button onClick={() => { setSidebarOpen(false); onSignOut(); }} className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-[#f4f4f4] p-3 text-left transition hover:bg-[#ebebeb]"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#c85b40]"><LogOut size={16} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold">Sign out</span><span className="text-[9px] text-neutral-400">Back to landing page</span></span><ArrowRight size={14} /></button>
            <div className="mt-4 flex items-center gap-3 border-t border-black/[0.06] pt-4">
              <div className="min-w-0 flex-1 text-[11px] font-semibold">Account settings</div>
              <button onClick={() => { setActivePage("Settings"); setSidebarOpen(false); }} aria-label="Open settings" className="flex h-8 w-8 items-center justify-center rounded-full bg-white hover:bg-black hover:text-white"><Settings size={14} /></button>
            </div>
          </aside>
        </div>

        {/* TASKS DRAWER */}
        <div
          className={cn(
            "fixed inset-0 z-50 transition-all duration-300",
            tasksOpen ? "visible" : "invisible"
          )}
        >
          <div
            onClick={() => setTasksOpen(false)}
            className={cn(
              "absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity",
              tasksOpen ? "opacity-100" : "opacity-0"
            )}
          />
          <aside
            className={cn(
              "absolute right-0 top-0 h-full w-full max-w-[380px] bg-[#fbfbfb] shadow-2xl p-6 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              tasksOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-neutral-400">{today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
                <div className="text-[22px] font-bold tracking-tight">My Tasks</div>
              </div>
              <button onClick={() => setTasksOpen(false)} className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#e1694a]">
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-[12px] bg-black text-white rounded-full px-3 py-1 font-medium">
                {remaining} remaining
              </span>
              <span className="text-[12px] bg-[#e1694a]/10 text-[#e1694a] rounded-full px-3 py-1 font-medium">
                {doneCount} done
              </span>
              <span className="text-[12px] bg-neutral-100 text-neutral-500 rounded-full px-3 py-1 font-medium">
                {visibleSmartTasks.length} live from your money
              </span>
            </div>
            <div className="mt-5 space-y-3 flex-1 overflow-y-auto scroll-thin">
              {allTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "bg-white border rounded-2xl p-4 flex items-start gap-3 transition-all",
                    task.done ? "border-black/10 opacity-60" : "border-black/10 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.15)]"
                  )}
                >
                  {task.smart ? (
                    <button
                      onClick={() => dismissSmartTask(task.id)}
                      aria-label="Dismiss task"
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-[1px] transition-all border-black/15 text-neutral-400 hover:border-black hover:text-black"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-[1px] transition-all",
                        task.done ? "bg-[#e1694a] border-[#e1694a] text-white" : "border-black/20 hover:border-[#e1694a]"
                      )}
                    >
                      {task.done && <Check size={12} strokeWidth={3} />}
                    </button>
                  )}
                  <div className="flex-1">
                    <div className={cn("text-[13.5px] font-semibold leading-snug", task.done && "line-through")}>
                      {task.title}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={cn(
                        "text-[10.5px] rounded-full px-2 py-[2px] font-medium",
                        task.tag === "Budget" ? "bg-red-50 text-red-600" :
                        task.tag === "Goal" ? "bg-emerald-50 text-emerald-700" :
                        task.tag === "Recurring" ? "bg-blue-50 text-blue-600" :
                        task.tag === "Insight" ? "bg-amber-50 text-amber-700" :
                        task.tag === "Habit" ? "bg-purple-50 text-purple-600" :
                        "bg-neutral-100"
                      )}>{task.tag}</span>
                      <span className="text-[11px] text-neutral-400">{task.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              {allTasks.length === 0 && (
                <div className="rounded-2xl border border-dashed border-black/15 p-6 text-center">
                  <div className="text-[13px] font-semibold">All clear 🎉</div>
                  <p className="mt-1 text-[11px] text-neutral-400">No live money tasks right now — budgets on track, goals moving, nothing overdue.</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addManualTask(); } }}
                placeholder="Add your own task…"
                aria-label="New task title"
                className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-4 py-3 text-[12.5px] outline-none focus:border-[#e1694a]"
              />
              <button
                onClick={addManualTask}
                className="shrink-0 bg-[#e1694a] hover:bg-black text-white rounded-full px-5 py-3 text-[13px] font-semibold flex items-center gap-1.5 transition-all"
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </aside>
        </div>

        {/* TOAST */}
        <div
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300",
            toast ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
          )}
        >
          <div className="bg-black text-white text-[13px] font-medium pl-4 pr-5 py-3 rounded-full flex items-center gap-2.5 shadow-2xl whitespace-nowrap">
            <span className="w-6 h-6 rounded-full bg-[#e1694a] flex items-center justify-center">
              <Check size={12} strokeWidth={3} />
            </span>
            {toast}
          </div>
        </div>
      </div>
    </div>
  );
}
