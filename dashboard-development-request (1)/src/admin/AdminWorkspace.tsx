import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  GraduationCap,
  Home,
  Plus,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { DashboardSnapshot } from "../FinancePages";
import { cn } from "../utils/cn";
import AdminDashboard from "./AdminDashboard";
import AdminPages from "./AdminPages";
import {
  type AdminPage,
  type AdminPeriod,
  formatMoney,
  latestDate,
  linkedGoals,
  linkedTransactions,
  periodTransactions,
  readAdminData,
  storeAdminData,
  studentInitials,
  summarize,
} from "./data";

const adminNavigation: { title: AdminPage; description: string; icon: LucideIcon }[] = [
  { title: "Dashboard", description: "System overview", icon: Home },
  { title: "Students", description: "Student directory", icon: Users },
  { title: "Transactions", description: "All student activity", icon: Receipt },
  { title: "Categories", description: "Income and expense groups", icon: Tags },
  { title: "Reports & Analytics", description: "Charts and reports", icon: BarChart3 },
  { title: "AI Insights", description: "Spending patterns", icon: Sparkles },
  { title: "Settings", description: "Account preferences", icon: Settings },
];

export default function AdminWorkspace({
  studentSnapshot,
  onSwitchToStudent,
}: {
  studentSnapshot: DashboardSnapshot;
  onSwitchToStudent: () => void;
}) {
  const [data, setData] = useState(readAdminData);
  const [page, setPage] = useState<AdminPage>("Dashboard");
  const [period, setPeriod] = useState<AdminPeriod>("Month");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [studentRequest, setStudentRequest] = useState<{ id: number; nonce: number } | null>(null);
  const [addStudentRequest, setAddStudentRequest] = useState(0);
  const [searchRequest, setSearchRequest] = useState<{ target: "Students" | "Transactions"; value: string; nonce: number } | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allTransactions = useMemo(() => [...data.transactions, ...linkedTransactions(studentSnapshot)], [data.transactions, studentSnapshot.transactions]);
  const allGoals = useMemo(() => [...data.goals, ...linkedGoals(studentSnapshot)], [data.goals, studentSnapshot.goals]);
  const referenceDate = latestDate(allTransactions);
  const monthRows = periodTransactions(allTransactions, "Month", referenceDate);
  const expenseReview = monthRows.filter((row) => row.type === "Expense" && row.amount >= data.preferences.reviewThreshold);
  const flagged = data.transactions.filter((row) => row.flagged);
  const highSpendStudents = data.students.filter((student) => {
    const totals = summarize(monthRows.filter((row) => row.studentId === student.id));
    return totals.income > 0 && totals.expenses / totals.income >= 0.75;
  });
  const alertCount = flagged.length + (data.preferences.largeTransactionAlerts ? expenseReview.length : 0) + (data.preferences.budgetAlerts ? highSpendStudents.length : 0);
  const displayDate = new Date(`${referenceDate}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(displayDate);
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(displayDate);

  useEffect(() => { storeAdminData(data); }, [data]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  };

  const navigate = (destination: AdminPage, studentId?: number) => {
    setPage(destination);
    setSidebarOpen(false);
    setAlertOpen(false);
    setSearchRequest(null);
    if (destination === "Students" && studentId !== undefined) setStudentRequest({ id: studentId, nonce: Date.now() });
    else setStudentRequest(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const addStudent = () => {
    navigate("Students");
    setAddStudentRequest((current) => current + 1);
  };
  const searchWorkspace = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim().toLowerCase();
    if (!query) { notify("Enter a name, category or transaction to search"); return; }
    const student = data.students.find((item) => `${item.name} ${item.email} ${item.program}`.toLowerCase().includes(query));
    if (student) {
      navigate("Students", student.id);
      setSearchRequest({ target: "Students", value: search.trim(), nonce: Date.now() });
    } else if (allTransactions.some((item) => `${item.title} ${item.category}`.toLowerCase().includes(query))) {
      navigate("Transactions");
      setSearchRequest({ target: "Transactions", value: search.trim(), nonce: Date.now() });
    } else {
      notify("No matching students or transactions");
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-[#d2d2d2] p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="relative w-full max-w-[1380px] overflow-hidden rounded-[28px] bg-[#fbfbfb] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)] md:rounded-[44px]">
        <header className="flex flex-wrap items-center justify-between gap-4 px-5 pt-6 md:px-10 md:pt-8">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setSidebarOpen(true)} aria-label="Open admin navigation" className="group flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full border border-black/[0.06] bg-white transition hover:bg-black hover:text-white md:h-12 md:w-12"><span className="h-[1.8px] w-4 rounded-full bg-current" /><span className="h-[1.8px] w-[11px] self-start rounded-full bg-current transition-all group-hover:w-4 ml-[14px] md:ml-[15px]" /></button>
            <button onClick={() => navigate("Dashboard")} title="Admin dashboard" className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-[17px] font-extrabold tracking-tight text-white md:h-12 md:w-12">N<span className="-ml-px text-[13px]">2</span></button>
            <div className="leading-[1.1]"><div className="text-[17px] font-bold tracking-tight md:text-[19px]">Financial</div><div className="-mt-0.5 max-w-[190px] truncate text-[14px] font-light tracking-tight text-neutral-400 md:text-[16px]">{page === "Dashboard" ? "Admin Dashboard" : page}</div></div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 md:gap-4">
            <div className="flex items-center rounded-full border border-black/[0.06] bg-[#f4f4f4] p-1" role="group" aria-label="Switch workspace">
              <button aria-pressed="true" className="rounded-full bg-black px-3 py-2 text-[10px] font-semibold text-white md:px-4">Admin</button>
              <button onClick={onSwitchToStudent} aria-pressed="false" className="rounded-full px-3 py-2 text-[10px] font-semibold text-neutral-500 transition hover:text-black md:px-4">Student</button>
            </div>
            <button onClick={addStudent} aria-label="Add student" title="Add student" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-black hover:text-white md:h-[52px] md:w-[52px]"><Plus size={18} /></button>
            <div className="relative">
              <button onClick={() => setAlertOpen((open) => !open)} aria-label={`Notifications, ${alertCount} items`} className={cn("relative flex h-11 w-11 items-center justify-center rounded-full border transition md:h-[52px] md:w-[52px]", alertOpen ? "border-black bg-black text-white" : "border-black/10 bg-white hover:border-black")}><Bell size={17} />{alertCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e1694a] px-0.5 text-[8px] font-bold text-white">{alertCount}</span>}</button>
              {alertOpen && <div className="absolute right-0 top-[60px] z-40 w-[min(84vw,310px)] rounded-[20px] border border-black/10 bg-white p-4 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-[12px] font-semibold">Review notifications</h3><button onClick={() => setAlertOpen(false)} aria-label="Close notifications"><X size={14} /></button></div><div className="mt-3 space-y-2.5 text-[10px] leading-relaxed text-neutral-600">{highSpendStudents.length > 0 && data.preferences.budgetAlerts && <p className="rounded-xl bg-[#f6f6f6] p-2.5">{highSpendStudents.length} student account{highSpendStudents.length === 1 ? " has" : "s have"} spent at least 75% of recorded income.</p>}{expenseReview.length > 0 && data.preferences.largeTransactionAlerts && <p className="rounded-xl bg-[#f6f6f6] p-2.5">{expenseReview.length} expense{expenseReview.length === 1 ? " is" : "s are"} above the {formatMoney(data.preferences.reviewThreshold, data.preferences.currency)} review threshold.</p>}{flagged.length > 0 && <p className="rounded-xl bg-[#f6f6f6] p-2.5">{flagged.length} transaction{flagged.length === 1 ? " is" : "s are"} flagged for review.</p>}{alertCount === 0 && <p className="py-3 text-neutral-400">Everything looks calm right now.</p>}</div><button onClick={() => navigate("AI Insights")} className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-[#c85b40]">Explore insights <ArrowRight size={12} /></button></div>}
            </div>
            <form onSubmit={searchWorkspace} className="hidden items-center gap-2 md:flex"><button type="submit" aria-label="Search admin workspace" className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-black hover:text-white"><Search size={18} /></button><label className="sr-only" htmlFor="admin-global-search">Search admin workspace</label><input id="admin-global-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students or activity..." className="w-[175px] border-b border-transparent bg-transparent pb-1 text-[11px] outline-none placeholder:text-neutral-400 focus:border-black/25 lg:w-[205px]" /></form>
          </div>
        </header>

        {page === "Dashboard" && <div className="mb-7 mt-8 flex flex-col justify-between gap-6 px-5 md:mt-10 md:px-10 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-4 md:gap-5"><div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-full border border-black/10 bg-white md:h-[106px] md:w-[106px]"><span className="text-[28px] font-semibold tracking-tight md:text-[32px]">{displayDate.getUTCDate()}</span></div><div className="leading-tight"><div className="text-[15px] font-medium md:text-[17px]">{weekday},</div><div className="text-[15px] font-medium md:text-[17px]">{monthName}</div></div><span className="mx-1 hidden h-10 w-px bg-black/15 sm:block" /><button onClick={() => navigate("Transactions")} className="group flex items-center gap-5 rounded-full bg-[#e1694a] py-2 pl-5 pr-2 text-white shadow-[0_10px_25px_-8px_rgba(225,105,74,0.6)] transition hover:bg-[#c95a3e] md:gap-8 md:pl-6"><span className="whitespace-nowrap text-[12px] font-medium md:text-[13px]">Review activity</span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-1 md:h-10 md:w-10"><ArrowRight size={18} /></span></button><button onClick={() => navigate("Reports & Analytics")} title="View reports" aria-label="View reports" className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-black"><CalendarDays size={19} /></button></div>
          <div className="flex flex-1 items-center justify-between gap-5 lg:justify-end lg:gap-8"><div><div className="text-[27px] font-medium leading-[1.06] tracking-tight md:text-[38px]">Hello, Admin.</div><div className="mt-1 text-[23px] font-light leading-[1.08] tracking-tight text-neutral-900/25 md:text-[34px]">The whole picture, at a glance.</div></div><span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.12)] md:h-[104px] md:w-[104px]"><ShieldCheck size={25} strokeWidth={1.5} /></span></div>
        </div>}

        {page === "Dashboard" ? <AdminDashboard students={data.students} transactions={allTransactions} goals={allGoals} categories={data.categories} preferences={data.preferences} period={period} referenceDate={referenceDate} onPeriodChange={setPeriod} onNavigate={navigate} onAddStudent={addStudent} /> : <AdminPages page={page} data={data} setData={setData} transactions={allTransactions} goals={allGoals} period={period} onPeriodChange={setPeriod} referenceDate={referenceDate} onNavigate={navigate} notify={notify} studentRequest={studentRequest} addStudentRequest={addStudentRequest} searchRequest={searchRequest} />}

        <div className={cn("fixed inset-0 z-[70] transition-all duration-300", sidebarOpen ? "visible" : "invisible")}>
          <button aria-label="Close admin navigation" onClick={() => setSidebarOpen(false)} className={cn("absolute inset-0 h-full w-full bg-black/35 backdrop-blur-[2px] transition-opacity", sidebarOpen ? "opacity-100" : "opacity-0")} />
          <aside className={cn("absolute left-0 top-0 flex h-full w-[min(88vw,360px)] flex-col bg-[#fbfbfb] p-5 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] md:p-6", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-5"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-[15px] font-extrabold text-white">N2</span><span><strong className="block text-[15px]">Financial</strong><span className="text-[10px] uppercase tracking-wider text-neutral-400">Admin workspace</span></span></div><button onClick={() => setSidebarOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white hover:bg-black hover:text-white"><X size={15} /></button></div>
            <div className="mb-3 mt-6 px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">Workspace</div>
            <nav aria-label="Admin navigation" className="scroll-thin flex-1 space-y-1 overflow-y-auto">{adminNavigation.map((item) => { const Icon = item.icon; const selected = page === item.title; return <button key={item.title} aria-current={selected ? "page" : undefined} onClick={() => navigate(item.title)} className={cn("group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition", selected ? "bg-black text-white shadow-lg shadow-black/10" : "text-neutral-600 hover:bg-[#f0f0f0] hover:text-black")}><span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", selected ? "bg-[#e1694a] text-white" : "bg-white text-neutral-500")}><Icon size={16} strokeWidth={1.8} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold">{item.title}</span><span className={cn("mt-0.5 block truncate text-[9px]", selected ? "text-white/50" : "text-neutral-400")}>{item.description}</span></span><ChevronRight size={14} className={cn("shrink-0", selected ? "text-white/50" : "text-neutral-300")} /></button>; })}</nav>
            <button onClick={() => { setSidebarOpen(false); onSwitchToStudent(); }} className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-[#f4f4f4] p-3 text-left transition hover:bg-[#ececec]"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#c85b40]"><GraduationCap size={16} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold">Switch to Student</span><span className="text-[9px] text-neutral-400">Open personal finance view</span></span><ArrowRight size={14} /></button>
            <div className="mt-4 flex items-center gap-3 border-t border-black/[0.06] pt-4"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white">{studentInitials(data.preferences.name || "Admin")}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{data.preferences.name}</span><span className="text-[9px] text-neutral-400">Administrator</span></span><button onClick={() => navigate("Settings")} aria-label="Admin settings" className="flex h-8 w-8 items-center justify-center rounded-full bg-white"><Settings size={14} /></button></div>
          </aside>
        </div>

        <div className={cn("pointer-events-none fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 transition-all duration-300", toast ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")} role="status" aria-live="polite"><div className="flex max-w-[90vw] items-center gap-2.5 rounded-full bg-black py-3 pl-3 pr-5 text-[12px] font-medium text-white shadow-2xl"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e1694a]"><Check size={12} strokeWidth={3} /></span><span className="truncate">{toast}</span></div></div>
      </div>
    </div>
  );
}