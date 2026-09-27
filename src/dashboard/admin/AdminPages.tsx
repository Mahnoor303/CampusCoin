import { useEffect, useMemo, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  Download,
  GraduationCap,
  Lightbulb,
  Mail,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import DashboardAnalytics from "../DashboardAnalytics";
import { cn } from "../utils/cn";
import {
  type AdminCategory,
  type AdminData,
  type AdminPage,
  type AdminPeriod,
  type AdminPreferences,
  type AdminStudent,
  type AdminTransaction,
  categoryName,
  formatDate,
  formatMoney,
  initialAdminData,
  LINKED_STUDENT_ID,
  matchesCategory,
  periodTransactions,
  studentInitials,
  summarize,
} from "./data";

const surface = "rounded-[26px] border border-black/[0.045] bg-[#f5f5f5]";
const field = "mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[12px] text-neutral-900 outline-none transition focus:border-[#e1694a]";
const smallButton = "inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[11px] font-semibold transition hover:bg-black hover:text-white";
const primaryButton = "inline-flex items-center justify-center gap-2 rounded-full bg-[#e1694a] px-5 py-3 text-[11px] font-semibold text-white transition hover:bg-[#c95a3e]";

interface Props {
  page: Exclude<AdminPage, "Dashboard">;
  data: AdminData;
  setData: Dispatch<SetStateAction<AdminData>>;
  transactions: AdminTransaction[];
  goals: AdminData["goals"];
  period: AdminPeriod;
  onPeriodChange: (period: AdminPeriod) => void;
  referenceDate: string;
  onNavigate: (page: AdminPage, studentId?: number) => void;
  notify: (message: string) => void;
  studentRequest: { id: number; nonce: number } | null;
  addStudentRequest: number;
  searchRequest: { target: "Students" | "Transactions"; value: string; nonce: number } | null;
  /** Persist an enable/disable change for a server-backed student (ADM6). */
  onStudentStatusChange?: (backendId: string, isActive: boolean) => Promise<void>;
  /** Persist a brand-new student account via /api/auth/register (ADM7). */
  onCreateStudent?: (name: string, email: string) => Promise<boolean>;
}

function Heading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div><div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400"><span className="h-1.5 w-1.5 rounded-full bg-[#e1694a]" />{eyebrow}</div><h1 className="text-[28px] font-semibold leading-tight tracking-[-0.045em] md:text-[36px]">{title}</h1><p className="mt-2 max-w-[670px] text-[12px] leading-relaxed text-neutral-500 md:text-[13px]">{description}</p></div>
    {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
  </div>;
}

function Stat({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: LucideIcon }) {
  return <div className={`${surface} min-w-0 p-5`}><div className="flex items-start justify-between gap-2"><span className="text-[11px] text-neutral-500">{label}</span><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white"><Icon size={16} /></span></div><div className="mt-3 truncate text-[24px] font-semibold tracking-tight" title={value}>{value}</div><div className="mt-1 text-[10px] text-neutral-400">{detail}</div></div>;
}

function exportTransactions(rows: AdminTransaction[], students: AdminStudent[], categories: AdminCategory[], name: string) {
  const fields = [["Date", "Student", "Description", "Type", "Category", "Amount", "Flagged"], ...rows.map((row) => [row.date, students.find((student) => student.id === row.studentId)?.name ?? "Student", row.title, row.type, categoryName(row.category, categories), String(row.amount), row.flagged ? "Yes" : "No"])];
  const csv = fields.map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminPages({ page, data, setData, transactions, goals, period, onPeriodChange, referenceDate, onNavigate, notify, studentRequest, addStudentRequest, searchRequest, onStudentStatusChange, onCreateStudent }: Props) {
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatus, setStudentStatus] = useState("All students");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [studentForm, setStudentForm] = useState({ name: "", email: "", program: "", year: "Year 1" });
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionType, setTransactionType] = useState("All types");
  const [transactionCategory, setTransactionCategory] = useState("All categories");
  const [transactionStudent, setTransactionStudent] = useState("All students");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [categoryType, setCategoryType] = useState<"Expense" | "Income">("Expense");
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryDraft, setCategoryDraft] = useState({ name: "", type: "Expense" as "Income" | "Expense" });
  const [preferencesDraft, setPreferencesDraft] = useState<AdminPreferences>(data.preferences);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (studentRequest) setSelectedStudentId(studentRequest.id);
  }, [studentRequest]);
  useEffect(() => {
    if (addStudentRequest > 0) {
      setEditingStudentId(null);
      setStudentForm({ name: "", email: "", program: "", year: "Year 1" });
      setStudentFormOpen(true);
    }
  }, [addStudentRequest]);
  useEffect(() => {
    if (!searchRequest) return;
    if (searchRequest.target === "Students") setStudentSearch(searchRequest.value);
    else setTransactionSearch(searchRequest.value);
  }, [searchRequest]);
  useEffect(() => { setPreferencesDraft(data.preferences); }, [data.preferences]);

  const currency = data.preferences.currency;
  const visibleStudents = data.students.filter((student) => {
    const search = studentSearch.trim().toLowerCase();
    return (studentStatus === "All students" || student.status === studentStatus)
      && (!search || `${student.name} ${student.email} ${student.program}`.toLowerCase().includes(search));
  });
  const selectedStudent = data.students.find((student) => student.id === selectedStudentId);
  const selectedStudentRows = [...transactions].filter((row) => row.studentId === selectedStudentId).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const selectedStudentTotals = summarize(selectedStudentRows);
  const selectedStudentGoals = goals.filter((goal) => goal.studentId === selectedStudentId);

  const filteredRows = useMemo(() => transactions.filter((row) => {
    const name = data.students.find((student) => student.id === row.studentId)?.name ?? "";
    const search = transactionSearch.trim().toLowerCase();
    return (!search || `${row.title} ${row.category} ${name} ${row.note}`.toLowerCase().includes(search))
      && (transactionType === "All types" || row.type === transactionType)
      && (transactionCategory === "All categories" || categoryName(row.category, data.categories) === transactionCategory)
      && (transactionStudent === "All students" || row.studentId === Number(transactionStudent))
      && (!dateFrom || row.date >= dateFrom)
      && (!dateTo || row.date <= dateTo);
  }).sort((a, b) => sort === "amount-high" ? b.amount - a.amount : sort === "amount-low" ? a.amount - b.amount : b.date.localeCompare(a.date) || b.id - a.id), [transactions, data.students, data.categories, transactionSearch, transactionType, transactionCategory, transactionStudent, dateFrom, dateTo, sort]);
  const selectedTransaction = transactions.find((row) => row.id === selectedTransactionId);
  const visibleCategories = data.categories.filter((category) => category.type === categoryType);
  const periodRows = periodTransactions(transactions, period, referenceDate);
  const periodTotals = summarize(periodRows);
  const saved = goals.reduce((total, goal) => total + goal.saved, 0);
  const totalGoalTarget = goals.reduce((total, goal) => total + goal.target, 0);

  const openStudentForm = (student?: AdminStudent) => {
    setEditingStudentId(student?.id ?? null);
    setStudentForm(student ? { name: student.name, email: student.email, program: student.program, year: student.year } : { name: "", email: "", program: "", year: "Year 1" });
    setStudentFormOpen(true);
  };
  const saveStudent = (event: FormEvent) => {
    event.preventDefault();
    const name = studentForm.name.trim();
    const email = studentForm.email.trim().toLowerCase();
    if (!name || !email.includes("@") || !studentForm.program.trim()) { notify("Enter a valid name, email and program"); return; }
    if (data.students.some((student) => student.email.toLowerCase() === email && student.id !== editingStudentId)) { notify("A student with that email already exists"); return; }
    if (editingStudentId !== null) {
      setData((current) => ({ ...current, students: current.students.map((student) => student.id === editingStudentId ? { ...student, name, email, program: studentForm.program.trim(), year: studentForm.year } : student) }));
      notify("Student record updated");
    } else {
      // New students get a real backend account via /api/auth/register (ADM7) when wired up.
      const createFlow = onCreateStudent ? onCreateStudent(name, email) : Promise.resolve(false);
      void createFlow.then((created) => {
        if (!created) {
          setData((current) => ({ ...current, students: [...current.students, { id: Date.now(), name, email, program: studentForm.program.trim(), year: studentForm.year, status: "Active", joined: referenceDate }] }));
          notify("Student added to the directory (local)");
        }
      });
    }
    setStudentFormOpen(false);
  };
  const setStudentStatusValue = (student: AdminStudent) => {
    const next = student.status === "Active" ? "Paused" : "Active";
    setData((current) => ({ ...current, students: current.students.map((item) => item.id === student.id ? { ...item, status: next } : item) }));
    // Server-backed students are paused/activated via PATCH /api/admin/users/:id/status (ADM6).
    const backendId = (student as AdminStudent & { backendId?: string }).backendId;
    if (backendId && onStudentStatusChange) {
      void onStudentStatusChange(backendId, next === "Active");
    }
    notify(`${student.name} is now ${next.toLowerCase()}`);
  };
  const toggleFlag = (row: AdminTransaction) => {
    if (row.linked) { notify("Linked transactions are managed in Student workspace"); return; }
    setData((current) => ({ ...current, transactions: current.transactions.map((item) => item.id === row.id ? { ...item, flagged: !item.flagged } : item) }));
    notify(row.flagged ? "Review flag cleared" : "Transaction flagged for review");
  };
  const saveCategory = (event: FormEvent) => {
    event.preventDefault();
    const name = categoryDraft.name.trim();
    if (!name) { notify("Enter a category name"); return; }
    if (data.categories.some((category) => category.name.toLowerCase() === name.toLowerCase() && category.id !== editingCategoryId)) { notify("That category name already exists"); return; }
    if (editingCategoryId !== null) {
      const original = data.categories.find((category) => category.id === editingCategoryId);
      if (!original) return;
      setData((current) => ({
        ...current,
        categories: current.categories.map((category) => category.id === editingCategoryId ? { ...category, name } : category),
        transactions: current.transactions.map((row) => matchesCategory(row.category, original) ? { ...row, category: name } : row),
      }));
      notify(`${name} category updated`);
    } else {
      setData((current) => ({ ...current, categories: [...current.categories, { id: Date.now(), name, sourceName: name, type: categoryDraft.type }] }));
      notify(`${name} category added`);
    }
    setCategoryFormOpen(false);
    setEditingCategoryId(null);
  };
  const removeCategory = (category: AdminCategory) => {
    if (transactions.some((row) => matchesCategory(row.category, category))) { notify("This category has transactions and cannot be removed"); return; }
    setData((current) => ({ ...current, categories: current.categories.filter((item) => item.id !== category.id) }));
    notify(`${category.name} category removed`);
  };

  return (
    <main className="animate-[page-in_.35s_ease-out] px-5 pb-10 pt-9 md:px-10 md:pt-12">
      {page === "Students" && <>
        <Heading eyebrow="Administration / Directory" title="Students" description="A clear view of every registered student and their financial activity." action={<button onClick={() => openStudentForm()} className={primaryButton}><Plus size={15} /> Add student</button>} />
        <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat label="Registered students" value={String(data.students.length).padStart(2, "0")} detail="Across the campus" icon={Users} /><Stat label="Active accounts" value={String(data.students.filter((student) => student.status === "Active").length).padStart(2, "0")} detail="Currently monitored" icon={GraduationCap} /><Stat label="Students with goals" value={String(new Set(goals.map((goal) => goal.studentId)).size).padStart(2, "0")} detail="Saving toward a target" icon={Target} /></div>
        <section className={surface}>
          <div className="flex flex-col gap-3 border-b border-black/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between md:p-5"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3 py-2.5 sm:max-w-[350px]"><Search size={15} className="text-neutral-400" /><span className="sr-only">Search students</span><input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search name, email or program" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none" /></label><select aria-label="Filter students by status" value={studentStatus} onChange={(event) => setStudentStatus(event.target.value)} className="rounded-full border border-black/[0.07] bg-white px-3 py-2.5 text-[11px] outline-none"><option>All students</option><option>Active</option><option>Paused</option></select></div>
          <div className="overflow-x-auto"><div className="min-w-[710px]"><div className="grid grid-cols-[2.15fr_1.4fr_1fr_1fr_.8fr_60px] gap-3 px-5 py-3 text-[9px] font-semibold uppercase tracking-wider text-neutral-400"><span>Student</span><span>Program</span><span>Income</span><span>Expenses</span><span>Status</span><span /></div><div className="divide-y divide-black/[0.05]">{visibleStudents.map((student) => {
            const totals = summarize(transactions.filter((row) => row.studentId === student.id));
            return <button key={student.id} onClick={() => setSelectedStudentId(student.id)} className="grid w-full grid-cols-[2.15fr_1.4fr_1fr_1fr_.8fr_60px] items-center gap-3 px-5 py-3.5 text-left transition hover:bg-white/70"><span className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-[#c85b40]">{studentInitials(student.name)}</span><span className="min-w-0"><span className="block truncate text-[11px] font-semibold">{student.name}</span><span className="block truncate text-[9px] text-neutral-400">{student.email}</span></span></span><span className="truncate text-[10px] text-neutral-600">{student.program}</span><span className="text-[11px] font-semibold">{formatMoney(totals.income, currency)}</span><span className="text-[11px] font-semibold">{formatMoney(totals.expenses, currency)}</span><span className={cn("w-fit rounded-full px-2.5 py-1 text-[9px] font-semibold", student.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-white text-neutral-500")}>{student.status}</span><span className="flex items-center justify-end text-neutral-400"><ArrowRight size={14} /></span></button>;
          })}{!visibleStudents.length && <div className="p-9 text-center text-[11px] text-neutral-400">No students match this search.</div>}</div></div></div><div className="border-t border-black/[0.06] px-5 py-3 text-[10px] text-neutral-400">Showing {visibleStudents.length} of {data.students.length} students</div>
        </section>
      </>}

      {page === "Transactions" && <>
        <Heading eyebrow="Administration / Money movement" title="Transactions" description="Monitor income and expenses recorded by students. Filter by date, category, student and transaction type." action={<button onClick={() => { exportTransactions(filteredRows, data.students, data.categories, "admin-transactions.csv"); notify("Filtered transactions exported as CSV"); }} className={primaryButton}><Download size={15} /> Export CSV</button>} />
        <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat label="Recorded income" value={formatMoney(summarize(filteredRows).income, currency)} detail="Matches current filters" icon={ArrowDownLeft} /><Stat label="Recorded expenses" value={formatMoney(summarize(filteredRows).expenses, currency)} detail="Matches current filters" icon={ArrowUpRight} /><Stat label="Transactions shown" value={String(filteredRows.length).padStart(2, "0")} detail={`${filteredRows.filter((row) => row.flagged).length} flagged for review`} icon={Wallet} /></div>
        <section className={surface}>
          <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] p-4 md:p-5"><label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-full bg-white px-3 py-2.5"><Search size={14} className="text-neutral-400" /><span className="sr-only">Search transactions</span><input value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} placeholder="Search activity..." className="min-w-0 w-full bg-transparent text-[11px] outline-none" /></label><select aria-label="Transaction type" value={transactionType} onChange={(event) => setTransactionType(event.target.value)} className="rounded-full bg-white px-3 py-2.5 text-[10px] outline-none"><option>All types</option><option>Income</option><option>Expense</option></select><select aria-label="Transaction category" value={transactionCategory} onChange={(event) => setTransactionCategory(event.target.value)} className="max-w-[160px] rounded-full bg-white px-3 py-2.5 text-[10px] outline-none"><option>All categories</option>{data.categories.map((category) => <option key={category.id}>{category.name}</option>)}</select><select aria-label="Student" value={transactionStudent} onChange={(event) => setTransactionStudent(event.target.value)} className="max-w-[160px] rounded-full bg-white px-3 py-2.5 text-[10px] outline-none"><option>All students</option>{data.students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select><input aria-label="From date" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="min-w-0 rounded-full bg-white px-3 py-2 text-[10px] outline-none" /><input aria-label="To date" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="min-w-0 rounded-full bg-white px-3 py-2 text-[10px] outline-none" /><select aria-label="Sort transactions" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-full bg-white px-3 py-2.5 text-[10px] outline-none"><option value="newest">Newest first</option><option value="amount-high">Amount: high to low</option><option value="amount-low">Amount: low to high</option></select>{(transactionSearch || transactionType !== "All types" || transactionCategory !== "All categories" || transactionStudent !== "All students" || dateFrom || dateTo || sort !== "newest") && <button onClick={() => { setTransactionSearch(""); setTransactionType("All types"); setTransactionCategory("All categories"); setTransactionStudent("All students"); setDateFrom(""); setDateTo(""); setSort("newest"); }} className="px-2 text-[10px] font-semibold text-[#c85b40]">Clear</button>}</div>
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400"><th className="px-5 py-3">Transaction</th><th className="px-3 py-3">Student</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Date</th><th className="px-4 py-3 text-right">Amount</th><th className="px-5 py-3 text-right">Status</th></tr></thead><tbody>{filteredRows.map((row) => <tr key={`${row.studentId}-${row.id}`} onClick={() => setSelectedTransactionId(row.id)} className="cursor-pointer border-t border-black/[0.05] transition hover:bg-white/70"><td className="px-5 py-3"><span className="flex items-center gap-3"><span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", row.type === "Income" ? "bg-[#e1694a]/10 text-[#c85b40]" : "bg-white text-neutral-700")}>{row.type === "Income" ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}</span><span><strong className="block text-[11px] font-semibold">{row.title}</strong><small className="text-[9px] text-neutral-400">{row.type}</small></span></span></td><td className="px-3 py-3 text-[10px] text-neutral-600">{data.students.find((student) => student.id === row.studentId)?.name ?? "Student"}</td><td className="px-3 py-3 text-[10px] text-neutral-600">{categoryName(row.category, data.categories)}</td><td className="px-3 py-3 text-[10px] text-neutral-500">{formatDate(row.date)}</td><td className={cn("px-4 py-3 text-right text-[11px] font-semibold", row.type === "Income" ? "text-emerald-700" : "text-neutral-900")}>{row.type === "Income" ? "+" : "-"}{formatMoney(row.amount, currency)}</td><td className="px-5 py-3 text-right"><span className={cn("rounded-full px-2.5 py-1 text-[9px] font-medium", row.flagged ? "bg-[#e1694a]/10 text-[#c85b40]" : "bg-white text-neutral-500")}>{row.flagged ? "Review" : row.linked ? "Linked" : "Recorded"}</span></td></tr>)}</tbody></table>{!filteredRows.length && <div className="px-5 py-12 text-center text-[11px] text-neutral-400">No transactions match these filters.</div>}</div><div className="border-t border-black/[0.06] px-5 py-3 text-[10px] text-neutral-400">{filteredRows.length} transactions / click a row to review</div>
        </section>
      </>}

      {page === "Categories" && <>
        <Heading eyebrow="Administration / Organization" title="Categories" description="Maintain the income and expense categories students use to organize their money." action={<button onClick={() => { setEditingCategoryId(null); setCategoryDraft({ name: "", type: categoryType }); setCategoryFormOpen(true); }} className={primaryButton}><Plus size={15} /> Add category</button>} />
        <div className="mb-5 flex items-center justify-between gap-3"><div className="flex rounded-full bg-[#f5f5f5] p-1">{(["Expense", "Income"] as const).map((type) => <button key={type} onClick={() => setCategoryType(type)} className={cn("rounded-full px-4 py-2 text-[11px] font-semibold transition", categoryType === type ? "bg-black text-white" : "text-neutral-500 hover:text-black")}>{type} categories</button>)}</div><span className="text-[11px] text-neutral-400">{visibleCategories.length} in use</span></div>
        <section className={`${surface} p-5 md:p-6`}><div className="mb-4 flex items-center justify-between"><div><h2 className="text-[15px] font-semibold">{categoryType} categories</h2><p className="mt-1 text-[10px] text-neutral-400">Names and totals update in admin reports.</p></div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white"><BarChart3 size={16} /></span></div><div className="divide-y divide-black/[0.06]">{visibleCategories.map((category) => {
          const rows = transactions.filter((row) => matchesCategory(row.category, category));
          const amount = rows.reduce((total, row) => total + row.amount, 0);
          const typeTotal = transactions.filter((row) => row.type === category.type).reduce((total, row) => total + row.amount, 0);
          const percent = typeTotal > 0 ? Math.min(100, Math.round((amount / typeTotal) * 100)) : 0;
          return <div key={category.id} className="flex flex-wrap items-center gap-3 py-4 sm:flex-nowrap"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#c85b40]"><Wallet size={16} /></span><div className="min-w-[120px] flex-1"><div className="text-[12px] font-semibold">{category.name}</div><div className="mt-1 text-[9px] text-neutral-400">{rows.length} {rows.length === 1 ? "entry" : "entries"}</div></div><div className="w-full max-w-[260px] flex-1"><div className="mb-1.5 flex justify-between text-[9px]"><span className="text-neutral-400">Share of {categoryType.toLowerCase()}</span><span className="font-semibold">{percent}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-[#e1694a] transition-all duration-500" style={{ width: `${percent}%` }} /></div></div><span className="min-w-[75px] text-right text-[11px] font-semibold">{formatMoney(amount, currency)}</span><div className="flex gap-1 sm:ml-1"><button aria-label={`Edit ${category.name}`} onClick={() => { setEditingCategoryId(category.id); setCategoryDraft({ name: category.name, type: category.type }); setCategoryFormOpen(true); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-500 transition hover:text-black"><Pencil size={13} /></button><button aria-label={`Remove ${category.name}`} onClick={() => removeCategory(category)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-400 transition hover:bg-red-50 hover:text-red-500"><Trash2 size={13} /></button></div></div>;
        })}{!visibleCategories.length && <div className="py-10 text-center text-[11px] text-neutral-400">No categories yet. Add the first one above.</div>}</div></section>
      </>}

      {page === "Reports & Analytics" && <>
        <Heading eyebrow="Administration / Data intelligence" title="Reports & Analytics" description="Compare student income, spending and goal progress across periods. Export a record whenever you need it." action={<><select aria-label="Report period" value={period} onChange={(event) => onPeriodChange(event.target.value as AdminPeriod)} className="rounded-full border border-black/10 bg-white px-4 py-3 text-[11px] font-medium outline-none"><option>Month</option><option>Quarter</option><option>Year</option><option>All time</option></select><button onClick={() => { exportTransactions(periodRows, data.students, data.categories, "admin-financial-report.csv"); notify("Report exported as CSV"); }} className={primaryButton}><Download size={15} /> Export report</button></>} />
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Income" value={formatMoney(periodTotals.income, currency)} detail={`${period} / recorded activity`} icon={ArrowDownLeft} /><Stat label="Expenses" value={formatMoney(periodTotals.expenses, currency)} detail={`${period} / recorded activity`} icon={ArrowUpRight} /><Stat label="Net cash flow" value={formatMoney(periodTotals.net, currency)} detail="Income minus expenses" icon={TrendingUp} /><Stat label="Saved toward goals" value={formatMoney(saved, currency)} detail={`${totalGoalTarget ? Math.round(saved / totalGoalTarget * 100) : 0}% of combined targets`} icon={Target} /></div>
        <div className="grid gap-4 lg:grid-cols-[1.35fr_.75fr]">
          <section className={`${surface} p-5 md:p-6`}><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-[16px] font-semibold">Income vs. expenses</h2><p className="mt-1 text-[10px] text-neutral-400">Recorded cash flow over the selected period</p></div><div className="flex gap-3 text-[9px] text-neutral-500"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#e1694a]" />Income</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-black/25" />Expenses</span></div></div>
            {(() => {
              const groups = new Map<string, { income: number; expenses: number; label: string; sort: string }>();
              periodRows.forEach((row) => { const week = Math.ceil(Number(row.date.slice(8, 10)) / 7); const key = period === "Month" ? `${row.date.slice(0, 7)}-${week}` : row.date.slice(0, 7); const current = groups.get(key) ?? { income: 0, expenses: 0, label: period === "Month" ? `Week ${week}` : row.date.slice(5, 7), sort: row.date }; if (row.type === "Income") current.income += row.amount; else current.expenses += row.amount; if (row.date < current.sort) current.sort = row.date; groups.set(key, current); });
              const bars = [...groups.values()].sort((a, b) => a.sort.localeCompare(b.sort)).slice(-12);
              const max = Math.max(...bars.flatMap((bar) => [bar.income, bar.expenses]), 1);
              return bars.length ? <div className="mt-6 flex h-[250px] items-end gap-2 overflow-x-auto border-b border-black/[0.08] pb-2 sm:gap-4">{bars.map((bar, index) => <div key={`${bar.sort}-${index}`} className="flex h-full min-w-[40px] flex-1 flex-col items-center justify-end gap-2"><div className="flex h-[205px] w-full items-end justify-center gap-1"><div title={`Income ${formatMoney(bar.income, currency)}`} className="flow-bar w-[35%] max-w-7 rounded-t-lg bg-[#e1694a]" style={{ height: `${Math.max(4, bar.income / max * 198)}px`, animationDelay: `${index * 50}ms` }} /><div title={`Expenses ${formatMoney(bar.expenses, currency)}`} className="flow-bar w-[35%] max-w-7 rounded-t-lg bg-black/20" style={{ height: `${Math.max(4, bar.expenses / max * 198)}px`, animationDelay: `${index * 50 + 30}ms` }} /></div><span className="text-[9px] text-neutral-400">{bar.label}</span></div>)}</div> : <div className="flex h-[250px] items-center justify-center text-[11px] text-neutral-400">No recorded transactions for this period.</div>;
            })()}
          </section>
          <section className={`${surface} p-5 md:p-6`}><h2 className="text-[16px] font-semibold">Expense mix</h2><p className="mt-1 text-[10px] text-neutral-400">Where students spend the most</p><div className="mt-6 space-y-5">{data.categories.filter((category) => category.type === "Expense").map((category) => ({ ...category, amount: periodRows.filter((row) => row.type === "Expense" && matchesCategory(row.category, category)).reduce((total, row) => total + row.amount, 0) })).sort((a, b) => b.amount - a.amount).slice(0, 5).map((category) => {
            const share = periodTotals.expenses ? Math.round(category.amount / periodTotals.expenses * 100) : 0;
            return <div key={category.id}><div className="mb-1.5 flex justify-between text-[10px]"><span className="font-medium">{category.name}</span><span className="font-semibold">{formatMoney(category.amount, currency)} <span className="font-normal text-neutral-400">{share}%</span></span></div><div className="h-1.5 rounded-full bg-white"><div className="h-full rounded-full bg-[#e1694a] transition-all duration-700" style={{ width: `${share}%` }} /></div></div>;
          })}</div></section>
        </div>
        <DashboardAnalytics transactions={periodRows.map((row) => ({ id: row.id, title: row.title, category: categoryName(row.category, data.categories), date: row.date, amount: row.amount, type: row.type }))} categories={data.categories.map((category) => ({ id: category.id, name: category.name, type: category.type, amount: periodRows.filter((row) => row.type === category.type && matchesCategory(row.category, category)).reduce((total, row) => total + row.amount, 0) }))} period={period} currency={currency} title="Explore system-wide patterns" description="Radial histogram, EWMA, dendrogram and radial tree views across student accounts." />
        <section className={`${surface} mt-5 p-5 md:p-6`}><div className="flex items-center justify-between"><div><h2 className="text-[15px] font-semibold">Student overview</h2><p className="mt-1 text-[10px] text-neutral-400">Compare recorded activity by student</p></div><Users size={17} className="text-[#e1694a]" /></div><div className="mt-4 grid gap-x-7 gap-y-4 md:grid-cols-2">{data.students.map((student) => {
          const amounts = summarize(periodRows.filter((row) => row.studentId === student.id));
          return <button key={student.id} onClick={() => onNavigate("Students", student.id)} className="flex items-center gap-3 border-b border-black/[0.05] pb-3 text-left"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-[#c85b40]">{studentInitials(student.name)}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{student.name}</span><span className="text-[9px] text-neutral-400">In {formatMoney(amounts.income, currency)} / Out {formatMoney(amounts.expenses, currency)}</span></span><ArrowRight size={13} className="text-neutral-400" /></button>;
        })}</div></section>
      </>}

      {page === "AI Insights" && <>
        {(() => {
          const topCategory = data.categories.filter((category) => category.type === "Expense").map((category) => ({ ...category, amount: periodRows.filter((row) => row.type === "Expense" && matchesCategory(row.category, category)).reduce((total, row) => total + row.amount, 0) })).sort((a, b) => b.amount - a.amount)[0];
          const studentRatios = data.students.map((student) => ({ student, totals: summarize(periodRows.filter((row) => row.studentId === student.id)) })).filter((entry) => entry.totals.income > 0).sort((a, b) => b.totals.expenses / b.totals.income - a.totals.expenses / a.totals.income);
          const highestRatio = studentRatios[0];
          const largeExpense = [...periodRows].filter((row) => row.type === "Expense" && row.amount >= data.preferences.reviewThreshold).sort((a, b) => b.amount - a.amount)[0];
          const flagged = data.transactions.filter((row) => row.flagged).length;
          const goalRate = totalGoalTarget ? Math.round(saved / totalGoalTarget * 100) : 0;
          const share = topCategory && periodTotals.expenses > 0 ? Math.round(topCategory.amount / periodTotals.expenses * 100) : 0;
          return <>
            <Heading eyebrow="Administration / System signals" title="AI Insights" description="Spot useful financial patterns across your student accounts. Insights below are calculated from recorded demo activity." action={<select aria-label="Insight period" value={period} onChange={(event) => onPeriodChange(event.target.value as AdminPeriod)} className="rounded-full border border-black/10 bg-white px-4 py-3 text-[11px] font-medium outline-none"><option>Month</option><option>Quarter</option><option>Year</option><option>All time</option></select>} />
            <section className="relative overflow-hidden rounded-[26px] bg-black p-6 text-white md:p-8"><div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full border border-white/10" /><div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="max-w-[650px]"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e1694a]"><Sparkles size={15} /> System intelligence</div><h2 className="mt-4 text-[25px] font-semibold leading-tight tracking-[-0.035em] md:text-[32px]">{topCategory?.amount ? `${topCategory.name} is the largest student expense.` : "Your student finances, in sharper focus."}</h2><p className="mt-3 max-w-[580px] text-[11px] leading-relaxed text-white/50">{topCategory?.amount ? `${share}% of recorded expenses this ${period.toLowerCase()} fall into ${topCategory.name}. Use category reports to understand where students may need more guidance.` : "Record a few transactions to unlock a clearer category picture."}</p></div><button onClick={() => onNavigate("Reports & Analytics")} className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[#e1694a] px-5 py-3 text-[11px] font-semibold transition hover:bg-white hover:text-black sm:self-auto">Explore reports <ArrowRight size={14} /></button></div></section>
            <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_.7fr]"><section className={`${surface} p-5 md:p-6`}><h2 className="text-[16px] font-semibold">Patterns worth noticing</h2><p className="mt-1 text-[10px] text-neutral-400">Calculated from recorded accounts, not predictions</p><div className="mt-5 divide-y divide-black/[0.06]">
              {[
                { icon: BarChart3, title: "Highest spending category", text: topCategory?.amount ? `${topCategory.name} accounts for ${formatMoney(topCategory.amount, currency)} (${share}%) of expenses this ${period.toLowerCase()}.` : "No category spending recorded yet.", action: "Explore categories", page: "Categories" as AdminPage },
                { icon: AlertCircle, title: "Student spending pressure", text: highestRatio ? `${highestRatio.student.name} spent ${Math.round(highestRatio.totals.expenses / highestRatio.totals.income * 100)}% of recorded income this ${period.toLowerCase()}.` : "Add income and expense activity to compare accounts.", action: "View students", page: "Students" as AdminPage },
                { icon: Target, title: "Saving goal momentum", text: `Students have saved ${formatMoney(saved, currency)} of ${formatMoney(totalGoalTarget, currency)} across ${goals.length} goals (${goalRate}% complete).`, action: "Explore analytics", page: "Reports & Analytics" as AdminPage },
                { icon: Bell, title: "Review queue", text: largeExpense ? `An expense of ${formatMoney(largeExpense.amount, currency)} passed the ${formatMoney(data.preferences.reviewThreshold, currency)} review threshold. ${flagged} transaction${flagged === 1 ? " is" : "s are"} flagged.` : `${flagged} transaction${flagged === 1 ? " is" : "s are"} flagged. No expense crossed the review threshold this period.`, action: "View transactions", page: "Transactions" as AdminPage },
              ].map((insight) => { const Icon = insight.icon; return <div key={insight.title} className="flex gap-3 py-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#e1694a]"><Icon size={16} /></span><div><h3 className="text-[12px] font-semibold">{insight.title}</h3><p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{insight.text}</p><button onClick={() => onNavigate(insight.page)} className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#c85b40]">{insight.action} <ArrowRight size={12} /></button></div></div>; })}
            </div></section><div className="flex flex-col gap-4"><section className="rounded-[26px] bg-[#f4f4f4] p-5"><Lightbulb size={18} className="text-[#e1694a]" /><h3 className="mt-4 text-[16px] font-semibold">A practical next step</h3><p className="mt-2 text-[10px] leading-relaxed text-neutral-500">{highestRatio && highestRatio.totals.expenses > highestRatio.totals.income * .75 ? `Review ${highestRatio.student.name}'s expense-to-income balance and consider sharing a budget reminder.` : "Regular check-ins help students notice small spending habits before they grow."}</p><button onClick={() => onNavigate("Students", highestRatio?.student.id)} className="mt-4 inline-flex items-center gap-1 rounded-full bg-black px-4 py-2.5 text-[10px] font-semibold text-white">Review student accounts <ArrowRight size={12} /></button></section><section className="rounded-[26px] border border-black/[0.04] bg-white p-5"><ShieldCheck size={17} className="text-[#e1694a]" /><h3 className="mt-3 text-[13px] font-semibold">About these insights</h3><p className="mt-2 text-[10px] leading-relaxed text-neutral-500">These signals use simple calculations on sample financial records. They are not automated decisions or professional financial advice.</p></section></div></div>
          </>;
        })()}
      </>}

      {page === "Settings" && <>
        <Heading eyebrow="Administration / Preferences" title="Settings" description="Manage your admin profile, system notifications and review preferences for this workspace." action={<button onClick={(event) => { event.preventDefault(); if (!preferencesDraft.name.trim() || !preferencesDraft.email.includes("@")) { notify("Enter a name and valid email"); return; } setData((current) => ({ ...current, preferences: preferencesDraft })); notify("Admin preferences saved"); }} className={primaryButton}><Check size={15} /> Save changes</button>} />
        <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]"><div className="space-y-4"><section className={`${surface} p-5 md:p-6`}><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-[14px] font-semibold text-white">{studentInitials(preferencesDraft.name || "Admin")}</span><div><h2 className="text-[15px] font-semibold">Admin profile</h2><p className="mt-0.5 text-[10px] text-neutral-400">Your workspace identity</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-[10px] font-medium text-neutral-500">Full name<input value={preferencesDraft.name} onChange={(event) => setPreferencesDraft({ ...preferencesDraft, name: event.target.value })} className={field} /></label><label className="text-[10px] font-medium text-neutral-500">Email address<input type="email" value={preferencesDraft.email} onChange={(event) => setPreferencesDraft({ ...preferencesDraft, email: event.target.value })} className={field} /></label><label className="text-[10px] font-medium text-neutral-500 sm:col-span-2">Organization<input value={preferencesDraft.organization} onChange={(event) => setPreferencesDraft({ ...preferencesDraft, organization: event.target.value })} className={field} /></label></div></section><section className={`${surface} p-5 md:p-6`}><div className="flex items-center gap-2"><Settings size={17} className="text-[#c85b40]" /><h2 className="text-[15px] font-semibold">System preferences</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-[10px] font-medium text-neutral-500">Display currency<select value={preferencesDraft.currency} onChange={(event) => setPreferencesDraft({ ...preferencesDraft, currency: event.target.value })} className={field}><option>USD</option><option>PKR</option><option>EUR</option><option>GBP</option></select></label><label className="text-[10px] font-medium text-neutral-500">Large expense review at<input type="number" min="1" value={preferencesDraft.reviewThreshold} onChange={(event) => setPreferencesDraft({ ...preferencesDraft, reviewThreshold: Math.max(1, Number(event.target.value) || 1) })} className={field} /></label></div><p className="mt-3 text-[9px] leading-relaxed text-neutral-400">Currency changes display formatting only; no exchange-rate conversion is performed.</p></section></div>
          <div className="space-y-4"><section className={`${surface} p-5 md:p-6`}><div className="flex items-center gap-2"><Bell size={17} className="text-[#c85b40]" /><h2 className="text-[15px] font-semibold">Notifications</h2></div><p className="mt-1 text-[10px] text-neutral-400">Choose the signals you want to review.</p><div className="mt-4 divide-y divide-black/[0.06]">{([{ key: "budgetAlerts", title: "Budget alerts", detail: "Flag students near their income limit" }, { key: "largeTransactionAlerts", title: "Large transactions", detail: "Watch expenses above the review threshold" }, { key: "weeklyDigest", title: "Weekly summary", detail: "Include a campus-wide finance recap" }] as const).map((item) => <div key={item.key} className="flex items-center justify-between gap-3 py-4"><div><div className="text-[11px] font-semibold">{item.title}</div><div className="mt-0.5 text-[9px] text-neutral-400">{item.detail}</div></div><button type="button" role="switch" aria-label={item.title} aria-checked={preferencesDraft[item.key]} onClick={() => setPreferencesDraft((current) => ({ ...current, [item.key]: !current[item.key] }))} className={cn("relative h-6 w-11 shrink-0 rounded-full transition", preferencesDraft[item.key] ? "bg-[#e1694a]" : "bg-black/15")}><span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", preferencesDraft[item.key] ? "left-6" : "left-1")} /></button></div>)}</div></section><section className="rounded-[26px] border border-black/[0.04] bg-white p-5 md:p-6"><div className="flex items-start gap-3"><ShieldCheck size={19} className="shrink-0 text-[#c85b40]" /><div><h3 className="text-[13px] font-semibold">About this admin workspace</h3><p className="mt-2 text-[10px] leading-relaxed text-neutral-500">Admin sample records and preferences are saved in this browser. The linked student account comes from the Student workspace. No server is connected.</p><button onClick={() => setResetConfirmOpen(true)} className="mt-3 text-[10px] font-semibold text-[#c85b40] hover:text-black">Reset admin sample data</button></div></div></section></div></div>
      </>}

      {/* Student detail drawer */}
      {selectedStudent && <div className="fixed inset-0 z-[80]"><button aria-label="Close student details" onClick={() => setSelectedStudentId(null)} className="absolute inset-0 h-full w-full bg-black/35 backdrop-blur-[2px]" /><aside role="dialog" aria-modal="true" aria-label={`${selectedStudent.name} details`} className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col overflow-y-auto bg-[#fbfbfb] p-6 shadow-2xl"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Student record</span><button onClick={() => setSelectedStudentId(null)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f2f2] hover:bg-black hover:text-white"><X size={15} /></button></div><div className="mt-6 flex items-center gap-3"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-[16px] font-semibold text-white">{studentInitials(selectedStudent.name)}</span><div className="min-w-0"><h2 className="truncate text-[21px] font-semibold tracking-tight">{selectedStudent.name}</h2><p className="mt-0.5 truncate text-[11px] text-neutral-500">{selectedStudent.program} / {selectedStudent.year}</p></div></div><div className="mt-5 flex flex-wrap items-center gap-2"><span className={cn("rounded-full px-3 py-1.5 text-[10px] font-semibold", selectedStudent.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-[#f0f0f0] text-neutral-600")}>{selectedStudent.status}</span><span className="text-[10px] text-neutral-400">Joined {formatDate(selectedStudent.joined)}</span></div><div className="mt-4 flex items-center gap-2 text-[11px] text-neutral-500"><Mail size={14} />{selectedStudent.email}</div><div className="mt-6 grid grid-cols-2 gap-3"><div className={`${surface} p-4`}><div className="text-[10px] text-neutral-400">Income</div><div className="mt-1 text-[16px] font-semibold">{formatMoney(selectedStudentTotals.income, currency)}</div></div><div className={`${surface} p-4`}><div className="text-[10px] text-neutral-400">Expenses</div><div className="mt-1 text-[16px] font-semibold">{formatMoney(selectedStudentTotals.expenses, currency)}</div></div></div><div className={`${surface} mt-3 p-4`}><div className="text-[10px] text-neutral-400">Saved toward goals</div><div className="mt-1 text-[18px] font-semibold">{formatMoney(selectedStudentGoals.reduce((total, goal) => total + goal.saved, 0), currency)}</div></div><div className="mt-6 flex items-center justify-between"><h3 className="text-[14px] font-semibold">Recent activity</h3><span className="text-[10px] text-neutral-400">{selectedStudentRows.length} entries</span></div><div className="mt-2 divide-y divide-black/[0.06]">{selectedStudentRows.slice(0, 5).map((row) => <div key={row.id} className="flex items-center justify-between gap-2 py-3"><span className="min-w-0"><strong className="block truncate text-[11px] font-semibold">{row.title}</strong><small className="text-[9px] text-neutral-400">{categoryName(row.category, data.categories)} / {formatDate(row.date)}</small></span><span className={cn("shrink-0 text-[11px] font-semibold", row.type === "Income" ? "text-emerald-700" : "text-neutral-900")}>{row.type === "Income" ? "+" : "-"}{formatMoney(row.amount, currency)}</span></div>)}{!selectedStudentRows.length && <p className="py-6 text-[10px] text-neutral-400">No activity recorded yet.</p>}</div><div className="mt-auto flex gap-2 pt-6"><button onClick={() => { openStudentForm(selectedStudent); setSelectedStudentId(null); }} className={smallButton}><Pencil size={13} /> Edit record</button><button onClick={() => setStudentStatusValue(selectedStudent)} className={primaryButton}>{selectedStudent.status === "Active" ? "Pause account" : "Reactivate"}</button></div></aside></div>}

      {/* Transaction detail drawer */}
      {selectedTransaction && <div className="fixed inset-0 z-[80]"><button aria-label="Close transaction details" onClick={() => setSelectedTransactionId(null)} className="absolute inset-0 h-full w-full bg-black/35 backdrop-blur-[2px]" /><aside role="dialog" aria-modal="true" aria-label="Transaction details" className="absolute right-0 top-0 flex h-full w-full max-w-[390px] flex-col bg-[#fbfbfb] p-6 shadow-2xl"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Transaction detail</span><button aria-label="Close" onClick={() => setSelectedTransactionId(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f2f2] hover:bg-black hover:text-white"><X size={15} /></button></div><span className="mt-7 flex h-12 w-12 items-center justify-center rounded-full bg-[#e1694a]/10 text-[#c85b40]">{selectedTransaction.type === "Income" ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}</span><h2 className="mt-4 text-[23px] font-semibold tracking-tight">{selectedTransaction.title}</h2><div className="mt-1 text-[24px] font-semibold">{selectedTransaction.type === "Income" ? "+" : "-"}{formatMoney(selectedTransaction.amount, currency)}</div><div className={`${surface} mt-6 divide-y divide-black/[0.06] p-4`}>{[["Student", data.students.find((student) => student.id === selectedTransaction.studentId)?.name ?? "Student"], ["Type", selectedTransaction.type], ["Category", categoryName(selectedTransaction.category, data.categories)], ["Date", formatDate(selectedTransaction.date)], ["Source", selectedTransaction.linked ? "Student workspace" : "Admin sample records"]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 py-3 text-[11px]"><span className="text-neutral-400">{label}</span><span className="text-right font-semibold">{value}</span></div>)}</div>{selectedTransaction.note && <p className="mt-4 text-[11px] leading-relaxed text-neutral-500">{selectedTransaction.note}</p>}<div className="mt-auto pt-6">{selectedTransaction.linked ? <p className="text-[10px] leading-relaxed text-neutral-400">This transaction is linked from the Student workspace and cannot be flagged here.</p> : <button onClick={() => toggleFlag(selectedTransaction)} className={primaryButton}>{selectedTransaction.flagged ? <Check size={14} /> : <Bell size={14} />}{selectedTransaction.flagged ? "Clear review flag" : "Flag for review"}</button>}</div></aside></div>}

      {/* Student add/edit form */}
      {studentFormOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"><form onSubmit={saveStudent} role="dialog" aria-modal="true" aria-label={editingStudentId ? "Edit student" : "Add student"} className="w-full max-w-[440px] rounded-[26px] bg-[#fbfbfb] p-6 shadow-2xl"><div className="flex items-start justify-between gap-2"><div><h2 className="text-[19px] font-semibold">{editingStudentId ? "Edit student" : "Add a student"}</h2><p className="mt-1 text-[10px] text-neutral-400">Keep the student directory accurate.</p></div><button type="button" onClick={() => setStudentFormOpen(false)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-white"><X size={15} /></button></div><div className="mt-5 space-y-4"><label className="block text-[10px] font-medium text-neutral-500">Full name<input required value={studentForm.name} onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })} placeholder="Student name" className={field} /></label><label className="block text-[10px] font-medium text-neutral-500">Email address<input required type="email" value={studentForm.email} onChange={(event) => setStudentForm({ ...studentForm, email: event.target.value })} placeholder="student@university.edu" className={field} /></label><label className="block text-[10px] font-medium text-neutral-500">Program<input required value={studentForm.program} onChange={(event) => setStudentForm({ ...studentForm, program: event.target.value })} placeholder="e.g. Computer Science" className={field} /></label><label className="block text-[10px] font-medium text-neutral-500">Academic year<select value={studentForm.year} onChange={(event) => setStudentForm({ ...studentForm, year: event.target.value })} className={field}><option>Year 1</option><option>Year 2</option><option>Year 3</option><option>Year 4</option><option>Graduate</option></select></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setStudentFormOpen(false)} className={smallButton}>Cancel</button><button type="submit" className={primaryButton}>{editingStudentId ? "Save student" : "Add student"}</button></div>{editingStudentId === LINKED_STUDENT_ID && <p className="mt-3 text-[9px] text-neutral-400">Profile edits here are admin-only; student finances remain linked to the Student workspace.</p>}</form></div>}

      {/* Category add/edit form */}
      {categoryFormOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"><form onSubmit={saveCategory} role="dialog" aria-modal="true" aria-label={editingCategoryId ? "Edit category" : "Add category"} className="w-full max-w-[420px] rounded-[26px] bg-[#fbfbfb] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-[19px] font-semibold">{editingCategoryId ? "Edit category" : "New category"}</h2><p className="mt-1 text-[10px] text-neutral-400">Organize student income and expenses.</p></div><button type="button" onClick={() => setCategoryFormOpen(false)} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full bg-white"><X size={15} /></button></div><div className="mt-5 space-y-4"><label className="block text-[10px] font-medium text-neutral-500">Category name<input required value={categoryDraft.name} onChange={(event) => setCategoryDraft({ ...categoryDraft, name: event.target.value })} placeholder="e.g. Books and supplies" className={field} /></label><label className="block text-[10px] font-medium text-neutral-500">Category type<select disabled={editingCategoryId !== null} value={categoryDraft.type} onChange={(event) => setCategoryDraft({ ...categoryDraft, type: event.target.value as "Income" | "Expense" })} className={field}><option>Expense</option><option>Income</option></select></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setCategoryFormOpen(false)} className={smallButton}>Cancel</button><button type="submit" className={primaryButton}>Save category</button></div></form></div>}

      {/* Explicit confirmation keeps the sample workspace safe from accidental resets. */}
      {resetConfirmOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"><div role="dialog" aria-modal="true" aria-label="Reset admin data" className="w-full max-w-[390px] rounded-[26px] bg-white p-6 shadow-2xl"><AlertCircle size={22} className="text-[#e1694a]" /><h2 className="mt-4 text-[19px] font-semibold">Reset admin demo data?</h2><p className="mt-2 text-[11px] leading-relaxed text-neutral-500">This restores the original admin students, categories, transactions and settings. Student workspace data will not be touched.</p><div className="mt-6 flex justify-end gap-2"><button onClick={() => setResetConfirmOpen(false)} className={smallButton}>Cancel</button><button onClick={() => { setData(initialAdminData); setResetConfirmOpen(false); notify("Admin sample data restored"); }} className={primaryButton}>Reset data</button></div></div></div>}
    </main>
  );
}