import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, Search, Target } from "lucide-react";
import type { DashboardSnapshot, FinancePage } from "./FinancePages";
import { cn } from "./utils/cn";

type ActivityFilter = "All" | "Income" | "Expense";

function formatAmount(amount: number, currency: string) {
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

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

export default function StudentActivityManager({
  snapshot,
  onNavigate,
}: {
  snapshot: DashboardSnapshot;
  onNavigate: (page: FinancePage) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ActivityFilter>("All");
  const [monthOnly, setMonthOnly] = useState(true);

  const monthKey = snapshot.latestTransactionDate.slice(0, 7);
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${monthKey}-01T00:00:00Z`),
  );

  const visibleTransactions = useMemo(() => {
    const search = query.trim().toLowerCase();
    return snapshot.transactions
      .filter((transaction) => !monthOnly || transaction.date.startsWith(monthKey))
      .filter((transaction) => filter === "All" || transaction.type === filter)
      .filter((transaction) => !search || `${transaction.title} ${transaction.category}`.toLowerCase().includes(search))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }, [snapshot.transactions, monthOnly, monthKey, filter, query]);

  const netActivity = visibleTransactions.reduce(
    (total, transaction) => total + (transaction.type === "Income" ? transaction.amount : -transaction.amount),
    0,
  );
  const chartEntries = visibleTransactions.slice(0, 10).reverse();
  const chartMax = Math.max(...chartEntries.map((transaction) => transaction.amount), 1);
  const featuredGoal = snapshot.goals.find((goal) => goal.saved < goal.target) ?? snapshot.goals[0];
  const goalProgress = featuredGoal?.target
    ? Math.min(100, Math.round((featuredGoal.saved / featuredGoal.target) * 100))
    : 0;

  return (
    <section className="col-span-12 flex flex-col rounded-[26px] border border-black/[0.04] bg-[#f4f4f4] p-5 sm:col-span-7 lg:col-span-6" aria-label="Student finance activity">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">Student finance activity</h3>
          <p className="mt-1 text-[10px] text-neutral-400">Your campus money, all in one place.</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("Transactions")}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-medium transition hover:bg-black hover:text-white"
        >
          View all <ArrowUpRight size={13} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="flex min-w-[185px] flex-1 items-center gap-2 rounded-full border border-black/[0.06] bg-white py-1 pl-1 pr-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10">
            <Search size={14} />
          </span>
          <span className="sr-only">Search student finance activity</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search activity..."
            className="min-w-0 w-full bg-transparent text-[11px] outline-none placeholder:text-neutral-400"
          />
        </label>
        <button
          type="button"
          aria-pressed={monthOnly}
          title={monthOnly ? "Show all recorded dates" : "Show latest month only"}
          onClick={() => setMonthOnly((value) => !value)}
          className="inline-flex h-[38px] items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-3 text-[10px] font-medium transition hover:border-black/30"
        >
          <CalendarDays size={12} className="text-[#e1694a]" /> {monthOnly ? monthLabel : "All time"}
        </button>
        <div className="flex h-[38px] items-center rounded-full border border-black/[0.06] bg-white p-1" role="group" aria-label="Filter activity by type">
          {(["All", "Income", "Expense"] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={filter === type}
              onClick={() => setFilter(type)}
              className={cn(
                "rounded-full px-2 py-1.5 text-[9px] font-medium transition-colors",
                filter === type ? "bg-black text-white" : "text-neutral-500 hover:text-neutral-900",
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="flex min-h-[196px] flex-col rounded-[20px] border border-black/[0.04] bg-white p-4">
          <div className="text-[10px] text-neutral-400">Net activity</div>
          <div className={cn("mt-1 text-[21px] font-semibold tracking-tight", netActivity < 0 ? "text-[#e1694a]" : "text-neutral-900")}>
            {netActivity > 0 ? "+" : ""}{formatAmount(netActivity, snapshot.currency)}
          </div>
          <div className="mt-0.5 text-[9px] text-neutral-400">{visibleTransactions.length} {visibleTransactions.length === 1 ? "entry" : "entries"} in view</div>
          <div className="mt-auto flex h-[66px] items-end gap-1.5 pt-3" role="img" aria-label="Last ten filtered transactions by amount">
            {chartEntries.length ? chartEntries.map((transaction, index) => (
              <div
                key={transaction.id}
                className={cn("flow-bar min-w-0 flex-1 rounded-full", transaction.type === "Income" ? "bg-neutral-900" : "bg-[#e1694a]")}
                style={{ height: `${Math.max(8, (transaction.amount / chartMax) * 52)}px`, animationDelay: `${index * 45}ms` }}
                title={`${transaction.title}: ${transaction.type === "Income" ? "+" : "-"}${formatAmount(transaction.amount, snapshot.currency)}`}
              />
            )) : <span className="self-center text-[10px] text-neutral-400">No matching entries</span>}
          </div>
          <div className="mt-2 flex gap-3 text-[9px] text-neutral-400">
            <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-neutral-900" />In</span>
            <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#e1694a]" />Out</span>
          </div>
        </div>

        <div className="flex min-h-[196px] flex-col rounded-[20px] border border-black/[0.04] bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-semibold">Latest entries</h4>
            <span className="text-[9px] text-neutral-400">{visibleTransactions.length} total</span>
          </div>
          {visibleTransactions.length ? (
            <div className="mt-3 space-y-1.5">
              {visibleTransactions.slice(0, 3).map((transaction) => {
                const income = transaction.type === "Income";
                return (
                  <button
                    key={transaction.id}
                    type="button"
                    onClick={() => onNavigate("Transactions")}
                    title={`View ${transaction.title} in Transactions`}
                    className="flex w-full items-center gap-2 rounded-xl py-1 text-left transition hover:bg-[#f7f7f7]"
                  >
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", income ? "bg-black text-white" : "bg-[#e1694a]/10 text-[#e1694a]")}>
                      {income ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[9px] font-semibold">{transaction.title}</span>
                      <span className="block truncate text-[8px] text-neutral-400">{transaction.category} · {formatShortDate(transaction.date)}</span>
                    </span>
                    <span className={cn("shrink-0 text-[9px] font-semibold", income ? "text-neutral-900" : "text-[#c85b40]")}>
                      {income ? "+" : "-"}{formatAmount(transaction.amount, snapshot.currency)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-1 items-center text-[10px] leading-relaxed text-neutral-400">No activity matches your search.</div>
          )}
          <button type="button" onClick={() => onNavigate("Transactions")} className="mt-auto flex items-center gap-1 pt-2 text-[9px] font-semibold text-[#c85b40] hover:text-black">
            Open transactions <ArrowRight size={11} />
          </button>
        </div>

        <div className="flex min-h-[196px] flex-col rounded-[20px] border border-black/[0.04] bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-semibold">Saving goal</h4>
            <Target size={15} className="text-[#e1694a]" />
          </div>
          {featuredGoal ? (
            <>
              <div className="mt-3 flex items-center gap-2.5">
                <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center">
                  <svg viewBox="0 0 52 52" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
                    <circle cx="26" cy="26" r="21" fill="none" stroke="#f2f2f2" strokeWidth="5" />
                    <circle cx="26" cy="26" r="21" fill="none" stroke="#e1694a" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(goalProgress / 100) * 132} 132`} className="transition-all duration-700" />
                  </svg>
                  <span className="relative text-[11px] font-semibold">{goalProgress}%</span>
                </div>
                <div className="min-w-0">
                  <div className="line-clamp-2 text-[10px] font-semibold leading-tight">{featuredGoal.name}</div>
                  <div className="mt-1 text-[9px] text-neutral-400">{formatAmount(featuredGoal.saved, snapshot.currency)} saved</div>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f2f2f2]">
                <div className="h-full rounded-full bg-[#e1694a] transition-all duration-700" style={{ width: `${goalProgress}%` }} />
              </div>
              <div className="mt-1.5 text-[9px] text-neutral-400">{formatAmount(Math.max(0, featuredGoal.target - featuredGoal.saved), snapshot.currency)} left to reach your target</div>
            </>
          ) : (
            <p className="mt-5 text-[10px] leading-relaxed text-neutral-400">Set a goal for your next campus milestone.</p>
          )}
          <button
            type="button"
            onClick={() => onNavigate("Student Save Goals")}
            className="mt-auto flex items-center justify-center gap-1 rounded-full bg-[#e1694a] px-3 py-2 text-[10px] font-semibold text-white transition-colors hover:bg-[#c95a3e]"
          >
            {featuredGoal ? "View saving goal" : "Create a goal"} <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </section>
  );
}