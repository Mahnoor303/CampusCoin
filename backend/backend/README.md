# CampusCoin Backend API

CampusCoin is a student personal finance management web application backend built with Node.js, Express, MongoDB, and Mongoose. It exposes clean, modular, and secure RESTful APIs for student finance management, income and expense tracking, recurring transactions, budgeting, goal setting, reports/analytics, rule-based saving tips, financial insights, CSV transaction imports, and administrative management.

---

## Tech Stack
* **Runtime**: Node.js (v18+)
* **Framework**: Express.js (v4)
* **Database**: MongoDB (v6+)
* **ODM**: Mongoose (v8)
* **Authentication**: JSON Web Token (JWT) with bcryptjs password hashing
* **Security & Middleware**: Helmet, CORS, Morgan, Centralized Error Handling, Express Validator
* **Testing**: Jest & Supertest

---

## Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) installed
* [MongoDB](https://www.mongodb.com/) running locally or via MongoDB Atlas URI

### 1. Clone & Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables Configuration
Create a `.env` file in the `backend/` root directory based on `.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/campuscoin
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
ADMIN_SECRET_KEY=campuscoin_admin_secret_2026
```

---

## Database Setup & Seeding

On server startup (`npm run dev` or `npm start`), the application automatically connects to MongoDB and idempotently seeds the system default income and expense categories into the database.

### Default Expense Categories
* **Food** (`#F97316`, `utensils`)
* **Transport** (`#3B82F6`, `bus`)
* **Hostel/Rent** (`#6366F1`, `home`)
* **Academics** (`#14B8A6`, `book-open`)
* **Subscriptions** (`#A855F7`, `credit-card`)
* **Entertainment** (`#F43F5E`, `film`)
* **Miscellaneous** (`#9CA3AF`, `more-horizontal`)

### Default Income Categories
* **Allowance** (`#10B981`, `hand-coins`)
* **Part-time Job** (`#06B6D4`, `briefcase`)
* **Scholarship** (`#8B5CF6`, `graduation-cap`)
* **Gift** (`#EC4899`, `gift`)
* **Other** (`#6B7280`, `circle-dollar-sign`)

---

## Running Locally

### Development Mode (with Nodemon)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Running Automated Tests
```bash
npm test
```

---

## Base API URL & Authentication

* **API Base URL**: `http://localhost:5000/api`
* **Authentication Scheme**: Bearer Token in HTTP Authorization Header
```http
Authorization: Bearer <your_jwt_token_here>
```

---

## Endpoint List Summary

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a new student or admin user
* `POST /api/auth/login` — Authenticate user and obtain JWT token
* `GET /api/auth/me` — Fetch currently authenticated user profile
* `POST /api/auth/logout` — Logout user (stateless session end)

### User Profile (`/api/users`)
* `GET /api/users/me` — Get user profile details
* `PUT /api/users/me` — Update user profile (name, allowance baseline, savings goal, etc.)
* `PUT /api/users/me/password` — Change password safely

### Categories (`/api/categories`)
* `GET /api/categories` — List default and custom user categories
* `POST /api/categories` — Create custom category
* `GET /api/categories/:id` — Get single category details
* `PUT /api/categories/:id` — Update custom category
* `DELETE /api/categories/:id` — Soft/Hard delete custom category

### Transactions (`/api/transactions`)
* `GET /api/transactions` — Paginated list of transactions (supports filters: `type`, `category`, `startDate`, `endDate`, `search`, `page`, `limit`)
* `POST /api/transactions` — Record new income or expense transaction
* `GET /api/transactions/summary` — Aggregate summary totals (total income, total expense, balance)
* `GET /api/transactions/:id` — Get single transaction detail
* `PUT /api/transactions/:id` — Update transaction
* `DELETE /api/transactions/:id` — Delete transaction

### CSV Import (`/api/import`)
* `POST /api/import/csv` — Bulk import transactions from CSV payload (validates every row, supports preview & commit)

### Budgets (`/api/budgets`)
* `GET /api/budgets` — List active user budgets with calculated spending usage and alert status
* `POST /api/budgets` — Set budget for a category
* `GET /api/budgets/:id` — Get budget details
* `PUT /api/budgets/:id` — Update budget limit, timeframe, or alert threshold
* `DELETE /api/budgets/:id` — Delete budget

### Goals (`/api/goals`)
* `GET /api/goals` — List user savings goals with progress percentages
* `POST /api/goals` — Create savings goal
* `GET /api/goals/:id` — Get single goal details
* `PUT /api/goals/:id` — Update goal
* `PATCH /api/goals/:id/deposit` — Deposit money into goal
* `DELETE /api/goals/:id` — Delete savings goal

### Reports & Analytics (`/api/reports`)
* `GET /api/reports/dashboard` — Comprehensive financial summary dashboard
* `GET /api/reports/monthly` — Monthly income vs expense breakdowns
* `GET /api/reports/category-breakdown` — Category spending distribution
* `GET /api/reports/trends` — Multi-month financial trends

### Saving Tips & Financial Insights (`/api/tips`, `/api/insights`)
* `GET /api/tips` / `GET /api/insights/tips` — Rule-based real-time financial tips
* `GET /api/insights` — Persisted user financial insights
* `POST /api/insights/generate` — Generate & persist current month insights
* `PATCH /api/insights/:id/read` — Mark insight as read
* `PATCH /api/insights/:id/pin` — Toggle insight pinned state

### Admin Management (`/api/admin`)
* `GET /api/admin/dashboard` — Platform overview metrics (total users, active users, transactions, financial volume)
* `GET /api/admin/users` — List platform users (paginated, searchable, role filtered)
* `GET /api/admin/users/:id` — Get user detail by ID
* `PATCH /api/admin/users/:id/role` — Update user role (`student` / `admin`)
* `PATCH /api/admin/users/:id/status` — Activate/deactivate user account (`isActive: true/false`)
* `DELETE /api/admin/users/:id` — Delete user account & cascade purge data
* `GET /api/admin/statistics` — Aggregate system analytics & trends

---

## Standard Response Format

### Success Response (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Transaction recorded successfully",
  "data": {
    "_id": "66f3a1b2c4e5f67890123456",
    "title": "Textbook Purchase",
    "amount": 120,
    "type": "expense",
    "category": {
      "_id": "66f3a1b2c4e5f67890123001",
      "name": "Academics"
    },
    "date": "2026-09-25T08:00:00.000Z"
  }
}
```

### Error Response (HTTP 400 / 401 / 403 / 404 / 500)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be greater than zero"
    }
  ]
}
```

---

## CSV Import Format

Upload CSV raw content or POST `JSON` with `csvContent` string:

```csv
Date,Title,Amount,Type,Category,Description
2026-09-20,Monthly Allowance,500,income,Allowance,Parental allowance
2026-09-21,Cafeteria Lunch,15,expense,Food,Lunch with friends
2026-09-22,Bus Pass,40,expense,Transport,Monthly transit pass
```

---

## Admin Access Setup

To create an initial administrator account during registration, set `ADMIN_SECRET_KEY` in `.env` and pass `adminSecretKey` in the registration request body:

```json
{
  "name": "System Administrator",
  "email": "admin@campuscoin.edu",
  "password": "AdminPassword123!",
  "role": "admin",
  "adminSecretKey": "campuscoin_admin_secret_2026"
}
```

Alternatively, existing administrators can promote any user to `admin` role via `PATCH /api/admin/users/:id/role`.
