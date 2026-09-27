import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Bus,
  GraduationCap,
  ListFilter,
  Plus,
  ShoppingCart,
  Sparkle,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import type { DashboardSnapshot, FinancePage } from "./FinancePages";
import { readStudentPreferences } from "./FinancePages";
import { cn } from "./utils/cn";

function formatAmount(amount: number, currency: string) {
  const locale = currency === "PKR" ? "en-PK" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `Rs ${amount.toFixed(2)}`;
  }
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/** Icon shown inside each plan pill circle (matches the reference mock's little glyphs). */
function planGlyph(category: string) {
  const key = category.toLowerCase();
  if (/(food|meal|cafeteria|canteen|dining|grocer)/.test(key)) return Utensils;
  if (/(transport|bus|travel|commut|fare|fuel)/.test(key)) return Bus;
  if (/(book|study|tuition|course|stationer|supplies|education)/.test(key)) return BookOpen;
  return Wallet;
}

/** Avg weekly spend for the month = month spend ÷ number of distinct weeks touched. */
function averageWeeklySpend(snapshot: DashboardSnapshot, monthKey: string) {
  const monthExpenses = snapshot.transactions.filter((t) => t.type === "Expense" && t.date.startsWith(monthKey));
  if (!monthExpenses.length) return null;
  const total = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const weeks = new Set(
    monthExpenses.map((t) => {
      const d = new Date(`${t.date}T00:00:00Z`);
      const day = d.getUTCDay();
      // ISO-ish week start (Monday)
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
      return monday.toISOString().slice(0, 10);
    }),
  );
  return total / Math.max(1, weeks.size);
}

export default function StudentActivityManager({
  snapshot,
  onNavigate,
}: {
  snapshot: DashboardSnapshot;
  onNavigate: (page: FinancePage) => void;
}) {
  const [monthOnly, setMonthOnly] = useState(true);
  // Persisted in the student workspace preferences — survives page reloads and
  // stays in sync with the Settings page (same localStorage key, cross-tab updates).
  const [remindersOn, setRemindersOn] = useState<boolean>(() => readStudentPreferences().savingReminders);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key && event.key !== "n2-student-workspace-v1") return;
      setRemindersOn(readStudentPreferences().savingReminders);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const toggleReminders = useCallback(() => {
    setRemindersOn((current) => {
      const next = !current;
      try {
        const raw = localStorage.getItem("n2-student-workspace-v1");
        const stored = raw ? (JSON.parse(raw) as { preferences?: Record<string, unknown> }) : {};
        localStorage.setItem(
          "n2-student-workspace-v1",
          JSON.stringify({ ...stored, preferences: { ...(stored.preferences ?? {}), savingReminders: next } }),
        );
      } catch {
        // Storage unavailable — UI state still updates for this session.
      }
      return next;
    });
  }, []);

  const monthKey = snapshot.latestTransactionDate.slice(0, 7);
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${monthKey}-01T00:00:00Z`),
  );

  const scopedTransactions = useMemo(
    () =>
      snapshot.transactions
        .filter((transaction) => !monthOnly || transaction.date.startsWith(monthKey))
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
    [snapshot.transactions, monthOnly, monthKey],
  );

  // Card 1 — last 9 expenses drive the mini bar chart.
  const lastExpenses = useMemo(
    () => scopedTransactions.filter((transaction) => transaction.type === "Expense").slice(0, 9),
    [scopedTransactions],
  );
  const expenseMax = Math.max(...lastExpenses.map((transaction) => transaction.amount), 1);
  const avgWeekly = averageWeeklySpend(snapshot, monthKey);

  // Card 2 — group the scoped expenses by category, keep the 3 biggest "study money plans".
  const plans = useMemo(() => {
    const totals = new Map<string, number>();
    for (const transaction of scopedTransactions) {
      if (transaction.type !== "Expense") continue;
      totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount);
    }
    return [...totals.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [scopedTransactions]);

  const alertingBudgets = snapshot.budgets.filter((budget) => budget.alerts);

  return (
    <section
      className="col-span-12 flex flex-col rounded-[26px] border border-black/[0.04] bg-[#f4f4f4] p-5 sm:col-span-7 lg:col-span-6"
      aria-label="Student finance activity"
    >
      {/* Floating "This month ×" chip */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMonthOnly(true)}
          aria-pressed={monthOnly}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border bg-white py-2 pl-4 pr-2.5 text-[11px] font-medium shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition",
            monthOnly ? "border-transparent text-neutral-900" : "border-black/[0.08] text-neutral-400 hover:text-neutral-700",
          )}
          title={monthOnly ? "Showing latest month only" : "Showing all recorded dates"}
        >
          This month
          <span
            role="button"
            tabIndex={monthOnly ? 0 : -1}
            aria-label={monthOnly ? "Clear this-month filter" : "Apply this-month filter"}
            onClick={(event) => {
              event.stopPropagation();
              setMonthOnly((value) => !value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                setMonthOnly((value) => !value);
              }
            }}
            className={cn(
              "flex h-[18px] w-[18px] items-center justify-center rounded-full border border-black/10 text-neutral-400 transition hover:bg-neutral-900 hover:text-white",
              monthOnly ? "" : "rotate-45",
            )}
          >
            <X size={10} strokeWidth={2.5} />
          </span>
        </button>
        {monthOnly && <span className="text-[9px] text-neutral-400">{monthLabel}</span>}
      </div>

      <div className="mt-4 grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {/* Card 1 — Avg weekly spend + last 9 expenses bars */}
        <div className="flex min-h-[196px] flex-col rounded-[20px] border border-black/[0.04] bg-white p-4">
          <div className="text-[10px] text-neutral-400">Avg weekly spend</div>
          <div className="mt-1 text-[26px] font-bold tracking-tight text-neutral-900">
            {avgWeekly === null ? "—" : formatAmount(avgWeekly, snapshot.currency)}
          </div>
          <div
            className="mt-auto flex h-[72px] items-end justify-between gap-[7px] pt-3"
            role="img"
            aria-label="Last nine expenses by amount"
          >
            {lastExpenses.length ? (
              lastExpenses.map((transaction, index) => {
                const isLast = index === lastExpenses.length - 1;
                return (
                  <span key={transaction.id} className="flex min-w-0 flex-1 flex-col items-center">
                    <i
                      className={cn("flow-bar w-full max-w-[9px] rounded-full", isLast ? "bg-[#e1694a]" : "bg-neutral-200")}
                      style={{
                        height: `${Math.max(6, (transaction.amount / expenseMax) * 58)}px`,
                        animationDelay: `${index * 45}ms`,
                      }}
                      title={`${transaction.title} · ${formatShortDate(transaction.date)}: ${formatAmount(transaction.amount, snapshot.currency)}`}
                    />
                  </span>
                );
              })
            ) : (
              <span className="self-center text-[10px] text-neutral-400">No expenses yet</span>
            )}
          </div>
          <div className="mt-2 text-center text-[9px] text-neutral-400">Last 9 expenses</div>
        </div>

        {/* Card 2 — Study money plans */}
        <div className="flex min-h-[196px] flex-col rounded-[20px] border border-black/[0.04] bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[13px] font-bold leading-tight tracking-tight">Study money plans</h4>
            <GraduationCap size={16} className="mt-0.5 shrink-0 text-[#e1694a]" />
          </div>

          {plans.length ? (
            <div className="mt-3 space-y-2">
              {plans.map((plan) => {
                const Glyph = planGlyph(plan.category);
                return (
                  <button
                    key={plan.category}
                    type="button"
                    onClick={() => onNavigate("Categories")}
                    title={`Open ${plan.category} in Categories`}
                    className="group flex w-full items-center gap-2 rounded-full border border-black/[0.06] bg-white py-1 pl-1 pr-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition hover:border-black/20"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e1694a]/25 bg-[#e1694a]/10 text-[#e1694a]">
                      <Glyph size={13} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">{plan.category}</span>
                    <span className="shrink-0 text-[10px] font-semibold text-[#c85b40]">
                      {formatAmount(plan.amount, snapshot.currency)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-1 items-center text-[10px] leading-relaxed text-neutral-400">
              Add expenses to see your study money plans.
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate("Categories")}
            className="mt-auto flex items-center gap-1 pt-3 text-[10px] font-semibold text-[#c85b40] hover:text-black"
          >
            Manage categories <ArrowRight size={11} />
          </button>
        </div>

        {/* Card 3 — Saving reminders */}
        <div className="flex min-h-[196px] flex-col items-center rounded-[20px] border border-black/[0.04] bg-white p-4 text-center">
          <Sparkle
            size={30}
            className={cn("mt-1 text-[#c85b40]", remindersOn && "animate-pulse")}
            fill="currentColor"
            strokeWidth={1.5}
          />
          <h4 className="mt-2 text-[13px] font-bold tracking-tight">Saving reminders</h4>
          <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
            {remindersOn
              ? `Weekly nudges are on${alertingBudgets.length ? ` — ${alertingBudgets.length} budget${alertingBudgets.length > 1 ? "s" : ""} watched` : ""}.`
              : "Get a weekly nudge to save money into your study goals."}
          </p>
          <button
            type="button"
            onClick={toggleReminders}
            aria-pressed={remindersOn}
            className={cn(
              "mt-auto flex items-center justify-center gap-1 rounded-full px-6 py-2.5 text-[11px] font-semibold text-white transition-colors",
              remindersOn ? "bg-neutral-900 hover:bg-neutral-700" : "bg-[#e1694a] hover:bg-[#c95a3e]",
            )}
          >
            {remindersOn ? (
              "Reminders on"
            ) : (
              <>
                Turn on <Plus size={12} strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Small utility row kept for quick access */}
      <div className="mt-3 flex items-center justify-between text-[9px] text-neutral-400">
        <span className="inline-flex items-center gap-1">
          <ListFilter size={11} /> {scopedTransactions.length} {scopedTransactions.length === 1 ? "entry" : "entries"} in view
        </span>
        <button
          type="button"
          onClick={() => onNavigate("Transactions")}
          className="font-semibold text-[#c85b40] transition hover:text-black"
        >
          Open transactions <ArrowRight size={10} className="inline" />
        </button>
      </div>
    </section>
  );
}
