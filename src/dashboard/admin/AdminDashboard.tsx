import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  GraduationCap,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "../utils/cn";
import {
  type AdminCategory,
  type AdminGoal,
  type AdminPage,
  type AdminPeriod,
  type AdminPreferences,
  type AdminStudent,
  type AdminTransaction,
  categoryName,
  formatDate,
  formatMoney,
  matchesCategory,
  periodTransactions,
  studentInitials,
  summarize,
} from "./data";

interface Props {
  students: AdminStudent[];
  transactions: AdminTransaction[];
  goals: AdminGoal[];
  categories: AdminCategory[];
  preferences: AdminPreferences;
  period: AdminPeriod;
  referenceDate: string;
  onPeriodChange: (period: AdminPeriod) => void;
  onNavigate: (page: AdminPage, studentId?: number) => void;
  onAddStudent: () => void;
}

export default function AdminDashboard({
  students,
  transactions,
  goals,
  categories,
  preferences,
  period,
  referenceDate,
  onPeriodChange,
  onNavigate,
  onAddStudent,
}: Props) {
  const [activityQuery, setActivityQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const currency = preferences.currency;
  const periodRows = useMemo(() => periodTransactions(transactions, period, referenceDate), [transactions, period, referenceDate]);
  const periodTotals = summarize(periodRows);
  const allTotals = summarize(transactions);
  const saved = goals.reduce((total, goal) => total + goal.saved, 0);
  const target = goals.reduce((total, goal) => total + goal.target, 0);
  const savingsRate = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  const activeStudents = students.filter((student) => student.status === "Active").length;
  const recentRows = [...transactions]
    .filter((row) => `${row.title} ${row.category} ${students.find((student) => student.id === row.studentId)?.name ?? ""}`.toLowerCase().includes(activityQuery.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .slice(0, 4);
  const expenseCategories = categories.filter((category) => category.type === "Expense")
    .map((category) => ({
      ...category,
      amount: periodRows.filter((row) => row.type === "Expense" && matchesCategory(row.category, category))
        .reduce((total, row) => total + row.amount, 0),
    }))
    .sort((a, b) => b.amount - a.amount);
  const selectedCategory = expenseCategories.find((category) => category.name === activeCategory) ?? expenseCategories[0];

  const riskStudents = students.map((student) => {
    const totals = summarize(periodRows.filter((row) => row.studentId === student.id));
    return { student, ...totals, ratio: totals.income > 0 ? totals.expenses / totals.income : 0 };
  }).filter((entry) => entry.income > 0 && entry.ratio >= 0.75).sort((a, b) => b.ratio - a.ratio);
  const reviewExpenses = periodRows.filter((row) => row.type === "Expense" && row.amount >= preferences.reviewThreshold)
    .sort((a, b) => b.date.localeCompare(a.date));
  const reviewCount = riskStudents.length + (preferences.largeTransactionAlerts ? reviewExpenses.length : 0) + transactions.filter((row) => row.flagged).length;

  const flow = (() => {
    const map = new Map<string, { label: string; income: number; expenses: number; sort: string }>();
    periodRows.forEach((row) => {
      const key = period === "Month" ? `Week ${Math.ceil(Number(row.date.slice(8, 10)) / 7)}` : row.date.slice(0, 7);
      const label = period === "Month" ? `W${Math.ceil(Number(row.date.slice(8, 10)) / 7)}` : row.date.slice(5, 7);
      const current = map.get(key) ?? { label, income: 0, expenses: 0, sort: row.date };
      if (row.type === "Income") current.income += row.amount;
      else current.expenses += row.amount;
      if (row.date < current.sort) current.sort = row.date;
      map.set(key, current);
    });
    return [...map.values()].sort((a, b) => a.sort.localeCompare(b.sort)).slice(-6);
  })();
  const maxFlow = Math.max(...flow.flatMap((row) => [row.income, row.expenses]), 1);

  return (
    <main className="px-5 pb-9 md:px-10 md:pb-10">
      <div className="grid grid-cols-12 gap-4 md:gap-5">
        <div className="hidden flex-col gap-3 lg:col-span-1 lg:flex">
          <div className="flex min-h-[224px] flex-1 flex-col items-center justify-between rounded-full border border-black/[0.04] bg-[#f4f4f4] py-3.5">
            <button onClick={() => onNavigate("Students")} title="Students" aria-label="Students" className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black hover:text-white"><Users size={17} /></button>
            <button onClick={() => onNavigate("Transactions")} title="Transactions" aria-label="Transactions" className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black hover:text-white"><ArrowDownLeft size={17} /></button>
            <button onClick={() => onNavigate("Reports & Analytics")} title="Reports" aria-label="Reports" className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black hover:text-white"><TrendingUp size={17} /></button>
            <button onClick={onAddStudent} title="Add student" aria-label="Add student" className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black hover:text-white"><Plus size={18} /></button>
          </div>
          <button onClick={() => onNavigate("AI Insights")} title="AI Insights" aria-label="AI Insights" className="flex aspect-square items-center justify-center rounded-full border border-black/[0.04] bg-[#f4f4f4] transition hover:bg-black hover:text-white"><Sparkles size={16} /></button>
        </div>

        <section className="col-span-12 flex flex-col gap-3 sm:col-span-6 lg:col-span-3">
          <div className="flex-1 rounded-[26px] border border-black/[0.04] bg-[#f4f4f4] p-5">
            <div className="flex items-center justify-between"><span className="text-[11px] text-neutral-400">Registered students</span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white"><GraduationCap size={16} /></span></div>
            <div className="mt-5 text-[47px] font-semibold leading-none tracking-[-0.07em]">{String(students.length).padStart(2, "0")}</div>
            <p className="mt-2 text-[11px] text-neutral-400">Accounts across {preferences.organization}</p>
            <div className="mt-5 flex items-center gap-2 border-t border-black/[0.06] pt-4">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e1694a]" />
              <span className="text-[11px] font-semibold">{activeStudents} active</span>
              <span className="ml-auto text-[10px] text-neutral-400">{students.length - activeStudents} paused</span>
            </div>
          </div>
          <button onClick={() => onNavigate("Students")} className="flex items-center justify-between px-1 text-left text-[11px] font-semibold text-[#c85b40] transition hover:text-black">Explore student records <ArrowRight size={14} /></button>
        </section>

        <div className="col-span-12 flex flex-col gap-3 sm:col-span-6 lg:col-span-3">
          <button onClick={() => onNavigate("Transactions")} className="flex-1 rounded-[26px] border border-black/[0.04] bg-[#f4f4f4] p-5 text-left transition hover:border-[#e1694a]/25">
            <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white"><ArrowDownLeft size={16} /></span><span className="text-[10px] text-neutral-400">All recorded</span></div>
            <div className="mt-4 text-[10px] text-neutral-400">Total student income</div>
            <div className="mt-1 text-[20px] font-semibold tracking-tight">{formatMoney(allTotals.income, currency)}</div>
          </button>
          <button onClick={() => onNavigate("Transactions")} className="flex-1 rounded-[26px] border border-black/[0.04] bg-[#f4f4f4] p-5 text-left transition hover:border-[#e1694a]/25">
            <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white"><ArrowUpRight size={16} /></span><span className="text-[10px] text-neutral-400">All recorded</span></div>
            <div className="mt-4 text-[10px] text-neutral-400">Total student expenses</div>
            <div className="mt-1 text-[20px] font-semibold tracking-tight">{formatMoney(allTotals.expenses, currency)}</div>
          </button>
        </div>

        <div className="col-span-6 flex flex-col items-center justify-center gap-4 lg:col-span-2">
          <button onClick={() => onNavigate("Reports & Analytics")} className="flex w-full max-w-[152px] aspect-square flex-col items-center justify-center rounded-full border border-black/[0.04] bg-[#f4f4f4] text-center transition hover:bg-black hover:text-white">
            <Target size={18} className="mb-2" />
            <span className="text-[12px] font-semibold">{formatMoney(saved, currency, true)}</span>
            <span className="mt-1 px-2 text-[9px]">Saved toward goals</span>
          </button>
          <button onClick={() => onNavigate("Reports & Analytics")} className="relative flex w-full max-w-[152px] aspect-square items-center justify-center rounded-full bg-black text-white transition hover:scale-[1.035]">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="37" fill="none" stroke="#303030" strokeWidth="7" /><circle cx="50" cy="50" r="37" fill="none" stroke="#e1694a" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(savingsRate / 100) * 232.5} 232.5`} /></svg>
            <span className="relative text-center"><strong className="block text-[20px] font-semibold leading-none">{savingsRate}%</strong><span className="mt-1 block text-[9px] text-white/50">Goal progress</span></span>
          </button>
        </div>

        <section className="col-span-6 flex flex-col rounded-[26px] border border-black/[0.04] bg-[#f4f4f4] p-4 lg:col-span-3">
          <div className="flex items-center justify-between gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white"><TrendingUp size={15} /></span><button onClick={() => onPeriodChange(period === "Month" ? "Quarter" : period === "Quarter" ? "Year" : period === "Year" ? "All time" : "Month")} title="Change chart period" className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[9px] font-medium">{period} <ChevronDown size={10} /></button></div>
          <div className="mt-3 text-[14px] font-semibold tracking-tight">System cash flow</div>
          <div className="mt-2 flex justify-between gap-1 text-[9px]"><span className="truncate text-[#c85b40]" title={formatMoney(periodTotals.income, currency)}>In {formatMoney(periodTotals.income, currency, true)}</span><span className="truncate text-neutral-500" title={formatMoney(periodTotals.expenses, currency)}>Out {formatMoney(periodTotals.expenses, currency, true)}</span></div>
          <div className="mt-4 flex min-h-[96px] flex-1 items-end gap-1.5 rounded-xl bg-white px-3 pb-2 pt-4">
            {flow.length ? flow.map((row, index) => (
              <div key={`${row.sort}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <div className="flex h-[68px] w-full items-end justify-center gap-[3px]"><div title={`Income ${formatMoney(row.income, currency)}`} className="flow-bar w-[37%] max-w-3 rounded-t-sm bg-[#e1694a]" style={{ height: `${Math.max(3, (row.income / maxFlow) * 65)}px`, animationDelay: `${index * 60}ms` }} /><div title={`Expenses ${formatMoney(row.expenses, currency)}`} className="flow-bar w-[37%] max-w-3 rounded-t-sm bg-black/20" style={{ height: `${Math.max(3, (row.expenses / maxFlow) * 65)}px`, animationDelay: `${index * 60 + 30}ms` }} /></div>
                <span className="text-[8px] text-neutral-400">{row.label}</span>
              </div>
            )) : <div className="self-center text-[10px] text-neutral-400">No entries this period</div>}
          </div>
          <button onClick={() => onNavigate("AI Insights")} className="mt-3 flex items-center justify-between text-left text-[10px] font-medium"><span className="flex items-center gap-1 text-neutral-500"><Bell size={13} className="text-[#e1694a]" /> Needs your attention</span><span className="font-semibold text-[#c85b40]">{reviewCount} <ArrowRight size={12} className="inline" /></span></button>
        </section>

        <section className="col-span-12 flex flex-col rounded-[26px] border border-black/[0.04] bg-[#f4f4f4] p-5 sm:col-span-5 lg:col-span-3">
          <div className="flex items-center justify-between"><h2 className="text-[15px] font-semibold tracking-tight">Where money goes</h2><button onClick={() => onNavigate("Reports & Analytics")} className="rounded-full bg-white px-3 py-1.5 text-[9px] font-medium">{period}</button></div>
          <p className="mt-1 text-[10px] text-neutral-400">Top student spending categories</p>
          <div className="mt-auto flex min-h-[268px] items-end justify-center overflow-hidden pt-5">
            <div className="relative flex h-[248px] w-[248px] items-end justify-center">
              {expenseCategories.slice(0, 4).map((category, index) => {
                const size = 245 - index * 47;
                const tones = ["#fbeeea", "#f6d7ca", "#efaa94", "#e1694a"];
                return <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.name)}
                  title={`${category.name}: ${formatMoney(category.amount, currency)}`}
                  className={cn("absolute bottom-0 flex items-start justify-center rounded-full border border-black/[0.025] pt-5 transition-transform duration-500 hover:-translate-y-1", selectedCategory?.name === category.name && "-translate-y-1")}
                  style={{ width: size, height: size, background: tones[index], zIndex: index + 1, boxShadow: index === 3 ? "0 14px 22px -14px rgba(225,105,74,.55)" : undefined }}
                ><span className={cn("text-[12px] font-semibold", index === 3 ? "text-white" : "text-neutral-800")}>{formatMoney(category.amount, currency, true)}</span></button>;
              })}
              {!expenseCategories.length && <span className="mb-24 text-[10px] text-neutral-400">No expenses yet</span>}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-[10px]"><span className="truncate font-semibold">{selectedCategory?.name ?? "No category"}</span><span className="shrink-0 text-[#c85b40]">{formatMoney(selectedCategory?.amount ?? 0, currency)}</span></div>
        </section>

        <section className="col-span-12 flex flex-col rounded-[26px] border border-black/[0.04] bg-[#f4f4f4] p-5 sm:col-span-7 lg:col-span-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-[15px] font-semibold tracking-tight">Student activity manager</h2><p className="mt-1 text-[10px] text-neutral-400">The latest activity across every account</p></div><button onClick={() => onNavigate("Transactions")} className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[10px] font-medium transition hover:bg-black hover:text-white">All activity <ArrowUpRight size={12} /></button></div>
          <label className="mt-4 flex items-center gap-2 rounded-full bg-white px-3 py-2.5"><Search size={15} className="text-neutral-400" /><span className="sr-only">Search recent student activity</span><input value={activityQuery} onChange={(event) => setActivityQuery(event.target.value)} placeholder="Search student activity..." className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-neutral-400" /></label>
          <div className="mt-3 flex-1 divide-y divide-black/[0.05]">
            {recentRows.length ? recentRows.map((row) => {
              const student = students.find((item) => item.id === row.studentId);
              return <button key={`${row.studentId}-${row.id}`} onClick={() => onNavigate("Transactions")} className="flex w-full items-center gap-3 py-3 text-left transition hover:opacity-65"><span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", row.type === "Income" ? "bg-white text-[#c85b40]" : "bg-white text-neutral-600")}>{row.type === "Income" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{row.title}</span><span className="mt-0.5 block truncate text-[9px] text-neutral-400">{student?.name ?? "Student"} / {categoryName(row.category, categories)} / {formatDate(row.date)}</span></span><span className={cn("shrink-0 text-[11px] font-semibold", row.type === "Income" ? "text-emerald-700" : "text-neutral-800")}>{row.type === "Income" ? "+" : "-"}{formatMoney(row.amount, currency)}</span></button>;
            }) : <p className="py-10 text-center text-[11px] text-neutral-400">No matching activity.</p>}
          </div>
          <button onClick={onAddStudent} className="mt-3 flex items-center gap-2 self-start text-[10px] font-semibold text-[#c85b40] hover:text-black"><Plus size={13} /> Add a student</button>
        </section>

        <div className="col-span-12 flex flex-col gap-4 lg:col-span-3">
          <section className="flex-1 rounded-[26px] border border-black/[0.04] bg-[#f4f4f4] p-5"><div className="flex items-center justify-between"><h2 className="text-[15px] font-semibold">Review queue</h2><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#c85b40]"><Bell size={16} /></span></div><p className="mt-1 text-[10px] text-neutral-400">Signals worth a closer look</p><div className="mt-4 space-y-3">{riskStudents.slice(0, 2).map((item) => <button key={item.student.id} onClick={() => onNavigate("Students", item.student.id)} className="flex w-full items-center gap-2.5 text-left"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e1694a]/10 text-[9px] font-bold text-[#c85b40]">{studentInitials(item.student.name)}</span><span className="min-w-0"><strong className="block truncate text-[10px]">{item.student.name}</strong><span className="block text-[9px] text-neutral-400">{Math.round(item.ratio * 100)}% of recorded income spent</span></span></button>)}{!riskStudents.length && <div className="text-[10px] text-neutral-500">No student spending alerts this period.</div>}{reviewExpenses.length > 0 && <button onClick={() => onNavigate("Transactions")} className="flex w-full items-center gap-2.5 border-t border-black/[0.06] pt-3 text-left"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#c85b40]"><ArrowUpRight size={15} /></span><span className="min-w-0"><strong className="block truncate text-[10px]">Large expense recorded</strong><span className="block text-[9px] text-neutral-400">{formatMoney(reviewExpenses[0].amount, currency)} / {formatDate(reviewExpenses[0].date)}</span></span></button>}</div></section>
          <button onClick={() => onNavigate("AI Insights")} className="rounded-[26px] bg-black p-5 text-left text-white transition hover:bg-[#282828]"><Sparkles size={19} className="text-[#e1694a]" /><span className="mt-3 block text-[15px] font-semibold">See the bigger picture.</span><span className="mt-1 block text-[10px] leading-relaxed text-white/50">Explore spending patterns and useful signals across student accounts.</span><span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-[#e1694a]">Open insights <ArrowRight size={12} /></span></button>
        </div>
      </div>
    </main>
  );
}