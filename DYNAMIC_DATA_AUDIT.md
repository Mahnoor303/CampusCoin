# CampusCoin — Dynamic Data Audit

**Date:** 2026-09-27 · **Scope:** Student dashboard, Admin workspace, Landing page
**Question:** Kya data REAL (live user/backend data se aata hai) aur kya STATIC (hardcoded, chaahe wo dynamic dikhta ho)?

Legend: ✅ REAL · ⚠️ PARTIAL · ❌ STATIC (fake/dummy) · 🎨 STATIC-by-design (marketing demo, theek hai)

---

## 1. Student Dashboard — `src/dashboard/App.tsx`

### ✅ REAL (already live-data driven)
| Widget | Source |
|---|---|
| "Hey, {name}" greeting | Logged-in user (`getStoredUser`) |
| Header date "27 Sun, September" | `new Date()` |
| Current balance / Total income / Total expenses | `dashboardSnapshot` (live transactions) |
| Income vs Expenses bar chart (weekly/monthly) | Snapshot transactions |
| **Savings rate ring** (pehle "Growth rate 36%") | `(income − expenses) / income` — live % |
| "N Days left in September" card | Live month pacing + proportional dots |
| **Net position widget** (pehle "Main Stocks Rs 1,607,349") | Real `income − expenses` + entry count |
| "In good shape / Needs a check-in" | Income vs expenses comparison |
| Smart Tasks drawer (badge count + tasks) | Live engine: budgets, goals, recurring, habit, spend-pace |
| Money Coach tips (Sparkles button) | Snapshot-derived rotating tips |
| Tasks drawer date | Live date |
| "Syncing…" badge | Real in-flight API mutation counter |
| "Show my Tasks" count badge | Live task engine |
| Transactions quick-list (region "Student finance activity") | Snapshot transactions |

### ❌ STATIC — dynamic DIKHTA hai magar fake data hai
| # | Widget | File:Line | Kya fake hai | Fix ka rasta |
|---|---|---|---|---|
| S1 | **Annual profits** nested-circle chart | `App.tsx:347-371` (data), `770-805` (render) | `annualData` mein hardcoded `Rs 4.2M / 2.8M / 2.0M / 1.2M` — years 2023/2022/2024 ke liye 3 alag fake sets. Koi backend aggregation nahi. | `GET /api/reports/monthly` (backend already hai) se saal-bhar ke months aggregate karke real values render karo; years dropdown ko user ke actual data years se banao |
| S2 | **Net position sparkline** curve | `App.tsx:824-843` | Fixed SVG path — `d="M0,35 C10,28…"` hamesha same shape; data ke sath nahi badalta | Last 30 days ke daily net balance se path points generate karo |
| S3 | **21-dot month-progress grid** | `App.tsx:719-726` | Dots `daysLeft/daysInMonth` se fill hote hain (partial real) magar total hamesha 21 fixed, har mahine nahi badalta | `daysInMonth` length ka grid banao |
| S4 | **Review rating widget** ("How is your financial journey going?" 😊) | `App.tsx:868-900` | `mood` sirf React state — refresh par lost, backend mein kabhi save nahi hota | `POST /api/feedback` endpoint banao ya `localStorage` persist + admin analytics mein bhejo |
| S5 | **Calendar widget** (top bar dropdown) | `App.tsx:389-425` | Month grid static hai; `‹ ›` buttons koi state change nahi karte; koi transactions-as-events overlay nahi | Month navigation state + transactions ko day-cells par map karo |
| S6 | Modal/inline **transaction form default date** | `FinancePages.tsx:438, 836` | `date: "2023-12-19"` hardcoded — Dashboard "Add income/expense" kholne par form Dec-2023 date dikhata hai | Default `latestTransactionDate` ya `today` use karo |
| S7 | **Demo seed workspace** (first-run data) | `FinancePages.tsx:120-164` | `initialTransactions` (14 entries "Campus coffee Dec-2023"), `initialGoals` (Laptop 1400/820…), `initialBudgets`, `initialCategories`, profile **"Jhon Carter / jhon.carter@northside.edu"** | Naya user create hone par seed data na dalo; khali state + "Add your first transaction" empty-states. (Backend fetch aane par ye replace ho jata hai, magar offline/first-paint par fake dikhta hai) |

### ⚠️ PARTIAL
| Widget | Status |
|---|---|
| Feedback/mood widget persistence | UI real hai, storage nahi (see S4) |
| EWMA smoothing slider | Real data, alpha user-set hai — koi persistence nahi (minor) |

---

## 2. Dashboard Analytics — `src/dashboard/DashboardAnalytics.tsx`
✅ **SAB REAL** — Radial Histogram, EWMA, Dendrogram, Radial Tree — sab live `transactions` se compute hote hain. Koi fake data nahi.

---

## 3. Student Activity Region — `src/dashboard/StudentActivityManager.tsx`
✅ **SAB REAL** — search, month toggle ("Sep 2026"), Income/Expense filters, "Net activity", top-10 bar visualization — sab snapshot se.

---

## 4. Finance Pages — `src/dashboard/FinancePages.tsx`
✅ REAL: transactions CRUD + CSV import, budgets CRUD + alerts, goals + contributions, categories, reports (Monthly/Quarterly/Yearly), PDF/PNG/CSV exports, forecast card, insights generate, settings.
❌ STATIC: sirf **S6** (form default date) aur **S7** (seed data) upar listed.

---

## 5. Admin Workspace — `src/dashboard/admin/*`
| Item | Status |
|---|---|
| `loadServerUsers()` — real users from `/api/admin/users` | ✅ REAL |
| User status toggle / create student → backend APIs | ✅ REAL (verified 200/201) |
| `initialStudents` "Jhon Carter, Areeba Khan, Hamza Ali…" roster | ⚠️ Legacy — code comments kehti hain "Never render in production views"; defaults khali arrays hain. File mein maujood hai magar render nahi hota. |
| Admin preferences defaults: **"Alex Morgan / Northside University / USD"** | ❌ STATIC — logged-in admin ka naam/org dikhna chahiye |
| Demo transactions `entry(101, 2, "Campus meal plan"…)` | ⚠️ Legacy — sirf linked-student fallback; admin khud ka data use karta hai |

---

## 6. Landing Page — `src/components/*` 🎨 STATIC-BY-DESIGN
Ye marketing/demo section hai — live data yahan hona hi nahi chahiye, magar completeness ke liye listed:

| Component | Fake data |
|---|---|
| `HeroSection.tsx` | `balance = useState(577.25)` mini-dashboard; "Rs 322.75 spent / Rs 450.00 stash / Rs 14.20 daily"; budget bars 82%/52%; "4.9 rating · 18.3K+ students" |
| `DashboardPreviewSection.tsx` | "Total Inflow Rs 1,250.00 / Spent Rs 627.50 / Remaining Rs 622.50 / Pace Rs 34.58 day"; category breakdown 81%/71%/75%/82%; 6 demo transactions (include `$28.50`, `+$800.00` — **$ symbols yahan bhi hain!**) |
| `InfiniteTicker.tsx` | "Average Rs 180 Saved Every Month", "Rs 1.4M+ Allowances Managed", university names (Stanford, NYU…) |
| `StudentProblemSection.tsx` | "Rs 4 iced coffees" type demo mentions |
| `FeaturesSection.tsx` | "Log Rs 8.50 coffee…" use-cases |

⚠️ **Note:** `DashboardPreviewSection.tsx` ki demo transactions mein abhi bhi `-$28.50`, `+$800.00` jaise `$` symbols hain (lines ~317-337) — currency-cleanup miss ho gaya tha.

---

## 7. Backend
✅ Sab real — MongoDB models, JWT auth, validators, insights engine (anomaly rule included), CSV import, tests 122/122.

---

## Priority Fix List (agar 100% real karna hai)

| Priority | Item | Effort |
|---|---|---|
| 🔴 1 | **S1 Annual profits** — sab se prominent fake widget; backend `/api/reports/monthly` already hai | Medium |
| 🔴 2 | **S6 Form default date "2023-12-19"** — user-facing bug, 1-line fix | Trivial |
| 🟠 3 | **S2 Sparkline** real daily-net path se generate karo | Small |
| 🟠 4 | **S4 Review rating** persist karo (localStorage + optional backend) | Small |
| 🟡 5 | **S7 Seed workspace** new users ke liye empty state se replace karo | Medium |
| 🟡 6 | **S3 Dot-grid** `daysInMonth` length banao | Trivial |
| 🟡 7 | **S5 Calendar** month-nav + transaction events | Medium |
| 🟡 8 | Admin preferences defaults → logged-in admin se | Trivial |
| 🎨 | Landing page demo numbers — design choice; agar real chahiye to logged-in preview dikha sakte hain | — |
| 🟠 | `DashboardPreviewSection` ke `$` symbols cleanup | Trivial |
