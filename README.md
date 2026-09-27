# CampusCoin — Student Budget & Expense Tracker (MERN)

CampusCoin is a student-first personal finance platform: track income (allowance, part-time jobs, scholarships) and expenses (food, transport, education...), set category budgets, save toward goals, and get insights — all in Rs. (PKR).

## Stack
- **Frontend**: React 19 + Vite + Tailwind v4 (port 3000)
- **Backend**: Node.js + Express + Mongoose (port 5000)
- **Database**: MongoDB (port 27017)
- **Auth**: JWT (Bearer) + bcryptjs, with forgot/reset password flow

## Quick Start

### 1. MongoDB
Start a local mongod on `127.0.0.1:27017`. Any 8.x binary works; the data directory `backend/.mongodb-data` is pre-provisioned (use a MongoDB **8.3** binary for that dir, e.g. `backend/.tmp/mongodb-win32-x86_64-windows-8.3.11/bin/mongod.exe`):

```bash
backend/.tmp/mongodb-win32-x86_64-windows-8.3.11/bin/mongod.exe \
  --dbpath backend/.mongodb-data --port 27017 --bind_ip 127.0.0.1 \
  --logpath backend/.mongodb-log/mongod.log --logappend
```

### 2. Backend
```bash
cd backend/backend
npm install        # first time only
PORT=5000 node src/server.js
# Health check: http://localhost:5000/api/health
```
> Windows shell may export `PORT=0` globally — always pass `PORT=5000` explicitly.

### 3. Frontend
```bash
npm install        # first time only
npm run dev        # starts Vite on http://localhost:3000 (proxies /api → :5000)
```

Open **http://localhost:3000** — sign up with any email (e.g. `you@university.edu`) and password (min 6 chars). The 3-step onboarding wizard creates your first income transaction and savings goal automatically.

### 4. Tests
```bash
cd backend/backend
npm test           # 4 jest suites: auth, transactions+CSV, budgets+goals+reports, tips+insights+admin
```

## Feature Checklist (SRS Compliance)

**Auth**: register, login (JWT), logout, persistent session, forgot/reset password (dev returns token inline), profile update, admin/staff roles via `authorize()` middleware.

**Transactions**: CRUD with 5-filter search panel (type, category, date range, amount, search), sorting, recurring flag (monthly), AI category suggestion field, pagination, summary aggregation.

**CSV Import**: Transactions → *Import CSV* → upload a file or paste rows (`date,type,amount,category,title`), per-row error reporting, case-insensitive category matching.

**Categories**: 12 system defaults (protected from deletion), custom categories synced to the backend, income/expense type isolation.

**Budgets**: per-category monthly limits, progress bars, adjustable alert threshold (50–100%), 3-month auto-suggest, create/update/delete all synced to `/api/budgets`.

**Savings Goals**: create/edit/delete with progress bars, weekly pacing hints, contribution flow — fully backend-synced, surfaced on the dashboard + dedicated page + onboarding wizard.

**Reports**: monthly/quarterly/yearly views, category breakdown, **Export CSV**, **Export PDF** (print), **Export image (PNG)**.

**AI Insights**: rule-based narrative insights + save/bookmark, backend insight generation (`/api/insights/generate`), real-time tips API, **EWMA spending forecast** for the next 30 days, **anomaly detection** (2× average daily spend).

**Admin**: real user list from `/api/admin/users`, per-student transactions, pause/activate accounts (persisted via PATCH status), create student accounts (via register endpoint), platform analytics.

**Settings & Accessibility**: profile + currency, **dark mode toggle**, **font size slider (85%–125%)**, loading skeletons, keyboard shortcuts:
- `Ctrl+K` → jump to Transactions search
- `Esc` → close overlays
- `Alt+D/T/G/R/S` → Dashboard / Transactions / Goals / Reports / Settings

## Demo credentials (local dev)
Any registered account works; create one via the sign-up modal. For an admin login, flip your user's `role` in MongoDB:
```js
db.users.updateOne({ email: "you@university.edu" }, { $set: { role: "admin" } })
```

## Project Layout
```
backend/backend/    Express API (controllers, models, routes, validators, tests)
src/                React app
  components/       Landing page sections + auth modal
  dashboard/        Student dashboard (FinancePages) + admin workspace
  lib/              api.ts (fetch layer), sync.ts (backend mappers), adminApi.ts
  onboarding/       3-step signup wizard
```
