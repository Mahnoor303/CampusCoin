# CampusCoin — Student Budget & Expense Tracker API

CampusCoin is a student-first personal finance platform tailored for college and university students. It empowers students to track income (allowance, part-time jobs, scholarships, gifts) and expenses (food, transport, hostel/rent, academics, subscriptions, entertainment) with category matching, transaction filtering, summary metrics, and CSV bulk import.

---

## Architecture & Technology Stack

* **Runtime**: Node.js (v18+)
* **Framework**: Express.js
* **Database**: MongoDB with Mongoose ODM
* **Authentication**: JWT (JSON Web Tokens) with Bearer token header
* **Password Hashing**: bcryptjs (10 salt rounds)
* **Validation**: express-validator with structured error reporting
* **File Uploads & Parsing**: Multer (in-memory) & csv-parse
* **Security**: Helmet, CORS, parameterized queries, and strict multi-tenant data isolation

---

## Getting Started

### 1. Prerequisites
* Node.js v18 or higher installed
* MongoDB Community Server running locally on `localhost:27017`

### 2. Environment Setup
Configure your environment in `backend/.env` (a `.env.example` template is provided):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/campuscoin
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Installation
From the project root:
```bash
npm --prefix backend install
```

### 4. Running the Application
```bash
# Start server with auto-reload (development)
npm run dev

# Or start directly
npm start
```

### 5. Running Automated Tests
```bash
npm test
```

---

## Complete API Reference

All protected endpoints require the following HTTP header:
`Authorization: Bearer <your_jwt_token>`

---

### Authentication Endpoints (`/api/auth`)

#### 1. Register User
* **Method**: `POST`
* **URL**: `/api/auth/register`
* **Authentication**: None (Public)
* **Request Body**:
```json
{
  "name": "Sarah Jenkins",
  "email": "sarah.jenkins@university.edu",
  "password": "password123",
  "role": "student",
  "academicYear": "2nd Year",
  "monthlyAllowanceBaseline": 450,
  "monthlySavingsGoal": 100
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "_id": "6741...",
      "name": "Sarah Jenkins",
      "email": "sarah.jenkins@university.edu",
      "role": "student",
      "academicYear": "2nd Year",
      "monthlyAllowanceBaseline": 450,
      "monthlySavingsGoal": 100,
      "createdAt": "2026-09-25T07:46:00.000Z"
    }
  }
}
```
* **Error Cases**:
  * `400 Bad Request`: Email already registered, missing required fields, password < 6 characters.

#### 2. Login User
* **Method**: `POST`
* **URL**: `/api/auth/login`
* **Authentication**: None (Public)
* **Request Body**:
```json
{
  "email": "sarah.jenkins@university.edu",
  "password": "password123"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "_id": "6741...",
      "name": "Sarah Jenkins",
      "email": "sarah.jenkins@university.edu",
      "role": "student"
    }
  }
}
```
* **Error Cases**:
  * `401 Unauthorized`: Invalid email or incorrect password.

#### 3. Get Authenticated User
* **Method**: `GET`
* **URL**: `/api/auth/me`
* **Authentication**: Bearer Token
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Authenticated user profile retrieved",
  "data": {
    "user": {
      "_id": "6741...",
      "name": "Sarah Jenkins",
      "email": "sarah.jenkins@university.edu",
      "role": "student"
    }
  }
}
```
* **Error Cases**:
  * `401 Unauthorized`: Missing, expired, or invalid token.

#### 4. Logout User
* **Method**: `POST`
* **URL**: `/api/auth/logout`
* **Authentication**: Optional
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### User Profile Endpoints (`/api/users`)

#### 1. Get Profile
* **Method**: `GET`
* **URL**: `/api/users/me`
* **Authentication**: Bearer Token
* **Success Response (200 OK)**: Returns full user profile details.

#### 2. Update Profile
* **Method**: `PUT`
* **URL**: `/api/users/me`
* **Authentication**: Bearer Token
* **Request Body**:
```json
{
  "name": "Sarah J. Connor",
  "academicYear": "3rd Year",
  "monthlyAllowanceBaseline": 550,
  "monthlySavingsGoal": 150,
  "bio": "Sophomore focusing on budget tracking"
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "6741...",
      "name": "Sarah J. Connor",
      "email": "sarah.jenkins@university.edu",
      "role": "student",
      "academicYear": "3rd Year",
      "monthlyAllowanceBaseline": 550,
      "monthlySavingsGoal": 150,
      "bio": "Sophomore focusing on budget tracking"
    }
  }
}
```
* **Error Cases**:
  * `400 / 403 Forbidden`: Attempting to modify `role` or `password` through profile update.

---

### Category Endpoints (`/api/categories`)

#### 1. Get Available Categories
* **Method**: `GET`
* **URL**: `/api/categories`
* **Authentication**: Bearer Token
* **Query Parameters**:
  * `type` (`income` | `expense`): Optional filter by category type.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "_id": "6ab4...",
      "name": "Food",
      "type": "expense",
      "isDefault": true,
      "user": null,
      "color": "#EF4444",
      "icon": "utensils"
    },
    {
      "_id": "6ab5...",
      "name": "Campus Gym",
      "type": "expense",
      "isDefault": false,
      "user": "6741...",
      "color": "#3B82F6",
      "icon": "dumbbell"
    }
  ]
}
```

#### 2. Create Custom Category
* **Method**: `POST`
* **URL**: `/api/categories`
* **Authentication**: Bearer Token
* **Request Body**:
```json
{
  "name": "Campus Gym",
  "type": "expense",
  "icon": "dumbbell",
  "color": "#3B82F6"
}
```
* **Success Response (201 Created)**: Returns created category object.
* **Error Cases**:
  * `400 Bad Request`: Duplicate category name/type for user, invalid type.

#### 3. Update Custom Category
* **Method**: `PUT`
* **URL**: `/api/categories/:id`
* **Authentication**: Bearer Token
* **Request Body**:
```json
{
  "name": "Campus Gym & Fitness",
  "color": "#10B981"
}
```
* **Error Cases**:
  * `403 Forbidden`: User attempts to modify a system default category (`isDefault: true`) or another user's category.
  * `404 Not Found`: Category not found.

#### 4. Delete Custom Category
* **Method**: `DELETE`
* **URL**: `/api/categories/:id`
* **Authentication**: Bearer Token
* **Error Cases**:
  * `400 Bad Request`: Category is currently linked to existing transactions.
  * `403 Forbidden`: Attempting to delete a system default category or another user's category.

---

### Transaction Endpoints (`/api/transactions`)

#### 1. Create Transaction
* **Method**: `POST`
* **URL**: `/api/transactions`
* **Authentication**: Bearer Token
* **Request Body**:
```json
{
  "type": "expense",
  "amount": 24.50,
  "category": "6ab4ad2f24ebb7b25c76d603",
  "title": "Campus Canteen Lunch",
  "description": "Lunch combo with study group",
  "date": "2026-09-25T12:00:00.000Z",
  "notes": "Paid via student card",
  "recurring": {
    "isRecurring": false,
    "frequency": "none"
  }
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Transaction recorded successfully",
  "data": {
    "_id": "6741...",
    "user": "6741...",
    "type": "expense",
    "amount": 24.5,
    "category": {
      "_id": "6ab4...",
      "name": "Food",
      "type": "expense",
      "icon": "utensils",
      "color": "#EF4444",
      "isDefault": true
    },
    "title": "Campus Canteen Lunch",
    "description": "Lunch combo with study group",
    "date": "2026-09-25T12:00:00.000Z",
    "notes": "Paid via student card",
    "recurring": {
      "isRecurring": false,
      "frequency": "none"
    }
  }
}
```
* **Error Cases**:
  * `400 Bad Request`:
    * Amount <= 0.
    * Missing title, type, or category.
    * **Category Type Mismatch**: Expense transaction cannot use an income category (e.g. Allowance), and vice versa.
    * Category ID does not exist or belongs to another user.

#### 2. Get Transactions (Filtered & Paginated)
* **Method**: `GET`
* **URL**: `/api/transactions`
* **Authentication**: Bearer Token
* **Query Parameters**:
  * `page` (integer, default `1`): Current page number.
  * `limit` (integer, default `10`, max `100`): Records per page.
  * `type` (`income` | `expense`): Filter by transaction type.
  * `category` (MongoId): Filter by specific category.
  * `startDate` (ISO Date, e.g. `2026-09-01`): Start of date range.
  * `endDate` (ISO Date, e.g. `2026-09-30`): End of date range.
  * `search` (string): Case-insensitive keyword search matching title, description, or notes.
  * `sort` (`-date`, `date`, `-amount`, `amount`, `-createdAt`): Sort order (default `-date`).
  * `isRecurring` (`true` | `false`): Filter recurring items.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### 3. Get Transaction by ID
* **Method**: `GET`
* **URL**: `/api/transactions/:id`
* **Authentication**: Bearer Token
* **Error Cases**:
  * `403 Forbidden`: Resource belongs to another user.
  * `404 Not Found`: Transaction does not exist.

#### 4. Update Transaction
* **Method**: `PUT`
* **URL**: `/api/transactions/:id`
* **Authentication**: Bearer Token
* **Request Body**: Any valid transaction fields (`amount`, `title`, `category`, `notes`, etc.).
* **Error Cases**:
  * `400 Bad Request`: Updating to a category whose type mismatches transaction type.
  * `403 Forbidden`: Access denied (not resource owner).

#### 5. Delete Transaction
* **Method**: `DELETE`
* **URL**: `/api/transactions/:id`
* **Authentication**: Bearer Token
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Transaction deleted successfully",
  "data": {
    "deletedTransactionId": "6741..."
  }
}
```

#### 6. Transaction Summary & Aggregation
* **Method**: `GET`
* **URL**: `/api/transactions/summary`
* **Authentication**: Bearer Token
* **Query Parameters**:
  * `startDate` & `endDate`: Optional date window filtering.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Transaction summary retrieved successfully",
  "data": {
    "totalIncome": 650.00,
    "totalExpense": 182.50,
    "balance": 467.50,
    "transactionCount": 14,
    "incomeCount": 2,
    "expenseCount": 12,
    "categoryBreakdown": [
      {
        "categoryId": "6ab4...",
        "categoryName": "Food",
        "type": "expense",
        "icon": "utensils",
        "color": "#EF4444",
        "totalAmount": 95.50,
        "count": 7
      }
    ]
  }
}
```

---

### CSV Import Endpoint (`/api/import`)

#### Import Transactions from CSV
* **Method**: `POST`
* **URL**: `/api/import/transactions`
* **Authentication**: Bearer Token
* **Accepted Input**:
  1. `multipart/form-data` with file attached to field name `file`.
  2. `application/json` with raw CSV string in `csv` or `csvData` field.
* **Supported CSV Format**:
```csv
date,type,amount,category,title,description,notes
2026-09-10,expense,12.50,Food,Coffee & Sandwich,Campus cafeteria,Morning study
2026-09-12,income,150.00,Part-time Job,Tutoring Session,Math tutoring,2 hours
2026-09-14,expense,45.00,Transport,Monthly Bus Card,Public transit,Commute
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "CSV processed: 2 of 3 transactions imported successfully.",
  "data": {
    "totalRows": 3,
    "importedRows": 2,
    "failedRows": 1,
    "errors": [
      {
        "row": 3,
        "reason": "Category 'Allowance' is an income category, but row transaction type is expense."
      }
    ]
  }
}
```
* **Validation & Security Features**:
  * Authenticated user ownership is strictly attached to all imported rows.
  * Case-insensitive category lookup against system defaults and user's custom categories.
  * Category type must match transaction type.
  * Non-existent categories or negative amounts are rejected safely with precise row numbers and reasons.
  * Valid rows in a mixed batch are imported safely without aborting the entire upload.

---

### Health Check Endpoint

* **Method**: `GET`
* **URL**: `/api/health`
* **Authentication**: None (Public)
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "CampusCoin API is operational",
  "data": {
    "status": "healthy",
    "timestamp": "2026-09-25T08:00:00.000Z",
    "environment": "development"
  }
}
```

---

### Budget Management Endpoints (`/api/budgets`)

#### 1. Create Budget
* **Method**: `POST`
* **URL**: `/api/budgets`
* **Authentication**: Bearer Token
* **Request Body**:
```json
{
  "category": "6ab4ad2f24ebb7b25c76d603",
  "limit": 150.00,
  "period": "monthly",
  "startDate": "2026-09-01",
  "endDate": "2026-09-30",
  "alertThreshold": 80
}
```
* **Validation**:
  * Category must be an `expense` category.
  * `endDate` must be chronologically after `startDate`.
  * `limit` must be a positive number (`> 0`).
  * `alertThreshold` is an integer percentage (`1`–`100`, default `80`).
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Budget created successfully",
  "data": {
    "_id": "6742...",
    "category": {
      "_id": "6ab4...",
      "name": "Food",
      "type": "expense",
      "icon": "utensils",
      "color": "#EF4444"
    },
    "limit": 150,
    "period": "monthly",
    "startDate": "2026-09-01T00:00:00.000Z",
    "endDate": "2026-09-30T00:00:00.000Z",
    "alertThreshold": 80,
    "usage": {
      "budgetId": "6742...",
      "limit": 150,
      "amountSpent": 120,
      "remainingAmount": 30,
      "percentageUsed": 80,
      "alertThreshold": 80,
      "alertStatus": "warning",
      "isApproaching": true,
      "isExceeded": false,
      "transactionCount": 3
    }
  }
}
```

#### 2. Get All Budgets
* **Method**: `GET`
* **URL**: `/api/budgets`
* **Authentication**: Bearer Token
* **Query Parameters**:
  * `period` (`weekly` | `monthly` | `yearly`): Filter by budget period.
  * `category` (MongoId): Filter by specific category.
  * `activeOnly` (`true` | `false`): Filter only currently active budgets.
* **Success Response (200 OK)**: Returns list of budgets with populated categories and dynamic usage metrics.

#### 3. Get Budget by ID
* **Method**: `GET`
* **URL**: `/api/budgets/:id`
* **Authentication**: Bearer Token
* **Success Response (200 OK)**: Returns budget object with live usage.

#### 4. Get Budget Usage
* **Method**: `GET`
* **URL**: `/api/budgets/:id/usage`
* **Authentication**: Bearer Token
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Budget usage calculated successfully",
  "data": {
    "budgetId": "6742...",
    "limit": 150,
    "amountSpent": 120,
    "remainingAmount": 30,
    "percentageUsed": 80,
    "alertThreshold": 80,
    "alertStatus": "warning",
    "isApproaching": true,
    "isExceeded": false,
    "transactionCount": 3,
    "period": "monthly",
    "startDate": "2026-09-01T00:00:00.000Z",
    "endDate": "2026-09-30T00:00:00.000Z"
  }
}
```

#### 5. Update Budget
* **Method**: `PUT`
* **URL**: `/api/budgets/:id`
* **Authentication**: Bearer Token
* **Request Body**: Partial or full budget fields (`limit`, `alertThreshold`, `endDate`, etc.).
* **Success Response (200 OK)**: Returns updated budget with recalculated usage.

#### 6. Delete Budget
* **Method**: `DELETE`
* **URL**: `/api/budgets/:id`
* **Authentication**: Bearer Token
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Budget deleted successfully",
  "data": {
    "deletedBudgetId": "6742..."
  }
}
```

---

### Savings Goals Endpoints (`/api/goals`)

#### 1. Create Savings Goal
* **Method**: `POST`
* **URL**: `/api/goals`
* **Authentication**: Bearer Token
* **Request Body**:
```json
{
  "name": "Semester Laptop Fund",
  "targetAmount": 800.00,
  "currentAmount": 200.00,
  "deadline": "2026-12-31",
  "notes": "Saving for upgraded development machine"
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Savings goal created successfully",
  "data": {
    "_id": "6743...",
    "name": "Semester Laptop Fund",
    "targetAmount": 800,
    "currentAmount": 200,
    "deadline": "2026-12-31T00:00:00.000Z",
    "status": "in_progress",
    "notes": "Saving for upgraded development machine",
    "progress": {
      "goalId": "6743...",
      "name": "Semester Laptop Fund",
      "targetAmount": 800,
      "currentAmount": 200,
      "remainingAmount": 600,
      "percentageCompleted": 25,
      "deadline": "2026-12-31T00:00:00.000Z",
      "status": "in_progress",
      "isCompleted": false,
      "isOverdue": false
    }
  }
}
```

#### 2. Get All Goals
* **Method**: `GET`
* **URL**: `/api/goals`
* **Authentication**: Bearer Token
* **Query Parameters**:
  * `status` (`in_progress` | `completed` | `cancelled`): Filter by goal status.
* **Success Response (200 OK)**: Returns list of user goals with computed progress metrics.

#### 3. Get Goal by ID
* **Method**: `GET`
* **URL**: `/api/goals/:id`
* **Authentication**: Bearer Token

#### 4. Get Goal Progress
* **Method**: `GET`
* **URL**: `/api/goals/:id/progress`
* **Authentication**: Bearer Token
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Goal progress calculated successfully",
  "data": {
    "goalId": "6743...",
    "name": "Semester Laptop Fund",
    "targetAmount": 800,
    "currentAmount": 200,
    "remainingAmount": 600,
    "percentageCompleted": 25,
    "deadline": "2026-12-31T00:00:00.000Z",
    "status": "in_progress",
    "isCompleted": false,
    "isOverdue": false
  }
}
```

#### 5. Update Goal
* **Method**: `PUT`
* **URL**: `/api/goals/:id`
* **Authentication**: Bearer Token
* **Request Body**: Any updated goal fields (`currentAmount`, `targetAmount`, `deadline`, `status`, `name`).
* **Auto-completion**: If `currentAmount >= targetAmount`, status is automatically updated to `completed`.

#### 6. Delete Goal
* **Method**: `DELETE`
* **URL**: `/api/goals/:id`
* **Authentication**: Bearer Token

---

### Reports & Dashboard Endpoints (`/api/reports`)

#### 1. Unified Dashboard API
* **Method**: `GET`
* **URL**: `/api/reports/dashboard`
* **Authentication**: Bearer Token
* **Purpose**: Primary aggregation endpoint powering the entire React Dashboard in a single, high-performance query.

##### Detailed Response Structure:
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "summary": {
      "totalIncome": 1250.00,
      "totalExpense": 420.50,
      "balance": 829.50,
      "savingsRate": 66.36,
      "transactionCount": 18
    },
    "currentMonth": {
      "monthName": "September 2026",
      "income": 600.00,
      "expense": 170.00,
      "balance": 430.00,
      "transactionCount": 4
    },
    "recentTransactions": [
      {
        "_id": "6741...",
        "type": "expense",
        "amount": 50,
        "title": "Metro Pass",
        "date": "2026-09-12T12:00:00.000Z",
        "category": {
          "_id": "6ab4...",
          "name": "Transport",
          "type": "expense",
          "icon": "bus",
          "color": "#3B82F6"
        }
      }
    ],
    "expenseByCategory": [
      {
        "categoryId": "6ab4...",
        "name": "Food",
        "type": "expense",
        "icon": "utensils",
        "color": "#EF4444",
        "totalAmount": 120,
        "count": 2,
        "percentage": 70.59
      },
      {
        "categoryId": "6ab4...",
        "name": "Transport",
        "type": "expense",
        "icon": "bus",
        "color": "#3B82F6",
        "totalAmount": 50,
        "count": 1,
        "percentage": 29.41
      }
    ],
    "incomeByCategory": [
      {
        "categoryId": "6ab4...",
        "name": "Allowance",
        "type": "income",
        "icon": "hand-coins",
        "color": "#10B981",
        "totalAmount": 600,
        "count": 1,
        "percentage": 100
      }
    ],
    "activeBudgets": [
      {
        "_id": "6742...",
        "category": {
          "_id": "6ab4...",
          "name": "Food",
          "type": "expense",
          "icon": "utensils",
          "color": "#EF4444"
        },
        "limit": 150,
        "period": "monthly",
        "startDate": "2026-09-01T00:00:00.000Z",
        "endDate": "2026-09-30T00:00:00.000Z",
        "usage": {
          "budgetId": "6742...",
          "limit": 150,
          "amountSpent": 120,
          "remainingAmount": 30,
          "percentageUsed": 80,
          "alertThreshold": 75,
          "alertStatus": "warning",
          "isApproaching": true,
          "isExceeded": false,
          "transactionCount": 2
        }
      }
    ],
    "activeGoals": [
      {
        "_id": "6743...",
        "name": "Semester Laptop Fund",
        "targetAmount": 800,
        "currentAmount": 200,
        "deadline": "2026-12-31T00:00:00.000Z",
        "status": "in_progress",
        "notes": "Saving for new laptop",
        "progress": {
          "goalId": "6743...",
          "name": "Semester Laptop Fund",
          "targetAmount": 800,
          "currentAmount": 200,
          "remainingAmount": 600,
          "percentageCompleted": 25,
          "deadline": "2026-12-31T00:00:00.000Z",
          "status": "in_progress",
          "isCompleted": false,
          "isOverdue": false
        }
      }
    ],
    "monthlyTrend": [
      {
        "month": "2026-04",
        "monthLabel": "Apr 2026",
        "income": 450,
        "expense": 380,
        "net": 70
      },
      {
        "month": "2026-09",
        "monthLabel": "Sep 2026",
        "income": 600,
        "expense": 170,
        "net": 430
      }
    ]
  }
}
```

#### 2. Financial Summary Report
* **Method**: `GET`
* **URL**: `/api/reports/summary`
* **Authentication**: Bearer Token
* **Query Parameters**:
  * `startDate` & `endDate`: Date range filter.
  * `category`: Filter by category ID.
  * `type`: Filter by `income` or `expense`.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Report summary retrieved successfully",
  "data": {
    "totalIncome": 600,
    "totalExpense": 170,
    "balance": 430,
    "transactionCount": 4,
    "incomeCount": 1,
    "expenseCount": 3,
    "dailyAverageExpense": 5.67
  }
}
```

#### 3. Category Breakdown Report
* **Method**: `GET`
* **URL**: `/api/reports/category-breakdown`
* **Authentication**: Bearer Token
* **Query Parameters**:
  * `type` (`expense` | `income`, default `expense`)
  * `startDate` & `endDate`: Optional date window.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Category breakdown report retrieved successfully",
  "data": {
    "type": "expense",
    "totalAmount": 170,
    "categoryCount": 2,
    "categories": [
      {
        "categoryId": "6ab4...",
        "name": "Food",
        "type": "expense",
        "icon": "utensils",
        "color": "#EF4444",
        "totalAmount": 120,
        "count": 2,
        "percentage": 70.59
      },
      {
        "categoryId": "6ab4...",
        "name": "Transport",
        "type": "expense",
        "icon": "bus",
        "color": "#3B82F6",
        "totalAmount": 50,
        "count": 1,
        "percentage": 29.41
      }
    ]
  }
}
```

#### 4. Monthly Report
* **Method**: `GET`
* **URL**: `/api/reports/monthly`
* **Authentication**: Bearer Token
* **Query Parameters**:
  * `year` (e.g. `2026`, defaults to current year)
* **Success Response (200 OK)**: Returns full 12-month array with monthly income, expenses, net savings, and transaction count.

#### 5. Financial Trends Report
* **Method**: `GET`
* **URL**: `/api/reports/trends`
* **Authentication**: Bearer Token
* **Query Parameters**:
  * `startDate` & `endDate`: Date boundaries for time-series points.
* **Success Response (200 OK)**: Returns daily/periodic array of `{ date, income, expense, net, count }` data points suitable for area/line charts.

