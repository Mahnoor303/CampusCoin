# CampusCoin Frontend API Reference & Handoff Document

This document provides a comprehensive REST API reference for the React frontend developer building the CampusCoin user interface.

---

## 🔑 Authentication Scheme

All protected endpoints require an HTTP `Authorization` header containing a valid Bearer token:

```http
Authorization: Bearer <token>
```

---

## 📦 Global Response Envelope Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": { ... } // Optional pagination metadata
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description here",
  "errors": [ ... ] // Optional detailed field validation errors
}
```

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
* **Auth**: Public
* **Request Body**:
```json
{
  "name": "Student Name",
  "email": "student@university.edu",
  "password": "Password123!",
  "role": "student", // Optional: "student" or "admin"
  "academicYear": "Year 2", // Optional
  "monthlyAllowanceBaseline": 600, // Optional
  "monthlySavingsGoal": 100 // Optional
}
```
* **Success (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "_id": "66f3a1...",
      "name": "Student Name",
      "email": "student@university.edu",
      "role": "student",
      "monthlyAllowanceBaseline": 600,
      "monthlySavingsGoal": 100
    }
  }
}
```
* **Possible Errors**: `400 Bad Request` (duplicate email, validation errors).

---

### `POST /api/auth/login`
* **Auth**: Public
* **Request Body**:
```json
{
  "email": "student@university.edu",
  "password": "Password123!"
}
```
* **Success (200)**:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "_id": "66f3a1...",
      "name": "Student Name",
      "email": "student@university.edu",
      "role": "student"
    }
  }
}
```
* **Possible Errors**: `401 Unauthorized` (invalid credentials), `403 Forbidden` (deactivated account).

---

### `GET /api/auth/me`
* **Auth**: Private (Bearer Token)
* **Success (200)**:
```json
{
  "success": true,
  "message": "Authenticated user profile retrieved",
  "data": {
    "user": {
      "_id": "66f3a1...",
      "name": "Student Name",
      "email": "student@university.edu",
      "role": "student"
    }
  }
}
```
* **Possible Errors**: `401 Unauthorized` (missing/invalid token).

---

### `POST /api/auth/logout`
* **Auth**: Public / Private
* **Success (200)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. User Profile (`/api/users`)

### `GET /api/users/me`
* **Auth**: Private
* **Success (200)**: Returns user profile details.

### `PUT /api/users/me`
* **Auth**: Private
* **Request Body**:
```json
{
  "name": "Updated Name",
  "academicYear": "Year 3",
  "monthlyAllowanceBaseline": 700,
  "monthlySavingsGoal": 150,
  "bio": "Computer Science Student",
  "phone": "+60123456789"
}
```
* **Success (200)**: Returns updated user profile.

### `PUT /api/users/me/password`
* **Auth**: Private
* **Request Body**:
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```
* **Success (200)**: Password updated.

---

## 3. Categories (`/api/categories`)

### `GET /api/categories`
* **Auth**: Private
* **Query Parameters**: `type` (`income` or `expense`)
* **Success (200)**:
```json
{
  "success": true,
  "message": "Categories retrieved",
  "data": {
    "categories": [
      {
        "_id": "66f3a...",
        "name": "Food",
        "type": "expense",
        "isDefault": true,
        "icon": "utensils",
        "color": "#F97316"
      }
    ]
  }
}
```

### `POST /api/categories`
* **Auth**: Private
* **Request Body**:
```json
{
  "name": "Gaming & Hobbies",
  "type": "expense",
  "icon": "gamepad",
  "color": "#8B5CF6"
}
```
* **Success (201)**: Returns created category.

---

## 4. Transactions (`/api/transactions`)

### `GET /api/transactions`
* **Auth**: Private
* **Query Parameters**:
  * `type`: `income` or `expense`
  * `category`: Category ID
  * `startDate`: `YYYY-MM-DD`
  * `endDate`: `YYYY-MM-DD`
  * `search`: Keyword string
  * `page`: Integer (default `1`)
  * `limit`: Integer (default `10`, max `100`)
* **Success (200)**:
```json
{
  "success": true,
  "message": "Transactions retrieved",
  "data": {
    "transactions": [
      {
        "_id": "66f3a...",
        "title": "Cafeteria Lunch",
        "amount": 15,
        "type": "expense",
        "category": {
          "_id": "66f3a...",
          "name": "Food"
        },
        "date": "2026-09-25T08:00:00.000Z"
      }
    ]
  },
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### `POST /api/transactions`
* **Auth**: Private
* **Request Body**:
```json
{
  "title": "Campus Books",
  "amount": 85.50,
  "type": "expense",
  "category": "66f3a...", // Must match category type!
  "date": "2026-09-25",
  "description": "Lab workbook",
  "notes": "Required for CS201"
}
```
* **Success (201)**: Returns created transaction.

### `GET /api/transactions/summary`
* **Auth**: Private
* **Query Parameters**: `month` (`YYYY-MM`) or `startDate` & `endDate`
* **Success (200)**:
```json
{
  "success": true,
  "message": "Transaction summary calculated",
  "data": {
    "totalIncome": 800,
    "totalExpense": 450,
    "netBalance": 350,
    "transactionCount": 18
  }
}
```

### `GET /api/transactions/:id`
* **Auth**: Private
* **Success (200)**: Returns single transaction detail.

### `PUT /api/transactions/:id`
* **Auth**: Private
* **Request Body**: Updated fields.
* **Success (200)**: Returns updated transaction.

### `DELETE /api/transactions/:id`
* **Auth**: Private
* **Success (200)**: Deletes transaction.

---

## 5. CSV Import (`/api/import`)

### `POST /api/import/csv`
* **Auth**: Private
* **Request Body**:
```json
{
  "csvContent": "Date,Title,Amount,Type,Category,Description\n2026-09-20,Part-time Salary,400,income,Part-time Job,Tutoring\n2026-09-21,Grocery,60,expense,Food,Supermarket"
}
```
* **Success (200)**:
```json
{
  "success": true,
  "message": "CSV processing complete",
  "data": {
    "totalRows": 2,
    "successCount": 2,
    "failedCount": 0,
    "importedTransactions": [ ... ],
    "errors": []
  }
}
```

---

## 6. Budgets (`/api/budgets`)

### `GET /api/budgets`
* **Auth**: Private
* **Success (200)**:
```json
{
  "success": true,
  "message": "Budgets retrieved",
  "data": {
    "budgets": [
      {
        "_id": "66f3a...",
        "category": {
          "_id": "66f3a...",
          "name": "Food"
        },
        "limit": 300,
        "period": "monthly",
        "startDate": "2026-09-01T00:00:00.000Z",
        "endDate": "2026-09-30T23:59:59.999Z",
        "spent": 210,
        "remaining": 90,
        "percentageUsed": 70,
        "alertTriggered": false
      }
    ]
  }
}
```

### `POST /api/budgets`
* **Auth**: Private
* **Request Body**:
```json
{
  "category": "66f3a...",
  "limit": 300,
  "period": "monthly", // "weekly", "monthly", "yearly"
  "startDate": "2026-09-01",
  "endDate": "2026-09-30",
  "alertThreshold": 80
}
```
* **Success (201)**: Returns created budget.

---

## 7. Goals (`/api/goals`)

### `GET /api/goals`
* **Auth**: Private
* **Success (200)**: Returns user goals with progress stats (`percentageCompleted`, `remainingAmount`).

### `POST /api/goals`
* **Auth**: Private
* **Request Body**:
```json
{
  "name": "Emergency Fund",
  "targetAmount": 1000,
  "currentAmount": 200,
  "deadline": "2026-12-31"
}
```
* **Success (201)**: Returns created goal.

### `PATCH /api/goals/:id/deposit`
* **Auth**: Private
* **Request Body**:
```json
{
  "amount": 50
}
```
* **Success (200)**: Deposits amount into goal and updates status to `completed` if target reached.

---

## 8. Reports & Analytics (`/api/reports`)

### `GET /api/reports/dashboard`
* **Auth**: Private
* **Success (200)**: Comprehensive dashboard metrics (income, expenses, balance, recent transactions, top spending categories, budget usage).

### `GET /api/reports/category-breakdown`
* **Auth**: Private
* **Query Parameters**: `month` (`YYYY-MM`) or `type` (`expense`/`income`)
* **Success (200)**: Category breakdown with amounts & percentages.

### `GET /api/reports/trends`
* **Auth**: Private
* **Query Parameters**: `months` (integer, default `6`)
* **Success (200)**: Multi-month trend arrays for income vs expense visualization.

---

## 9. Saving Tips & Insights (`/api/tips`, `/api/insights`)

### `GET /api/tips` / `GET /api/insights/tips`
* **Auth**: Private
* **Success (200)**:
```json
{
  "success": true,
  "message": "Saving tips generated",
  "data": {
    "tips": [
      {
        "type": "budget_warning",
        "severity": "warning",
        "title": "Budget Nearing Limit (85%) for Food",
        "body": "You have used 85% of your Food budget...",
        "rule": "budget_warning_gte_80pct",
        "metadata": { ... }
      }
    ],
    "disclaimer": "These tips are generated based on transparent financial rules..."
  }
}
```

### `GET /api/insights`
* **Auth**: Private
* **Query Parameters**: `month` (`YYYY-MM`)
* **Success (200)**: Returns persisted insights array.

### `POST /api/insights/generate`
* **Auth**: Private
* **Success (200)**: Generates & saves insights for current month.

---

## 10. Admin Endpoints (`/api/admin`)

*Required Role: `admin`*

* `GET /api/admin/dashboard` — Platform overview
* `GET /api/admin/users?page=1&limit=20&search=john&role=student` — User management listing
* `GET /api/admin/users/:id` — View user profile
* `PATCH /api/admin/users/:id/role` — Body: `{ "role": "admin" }`
* `PATCH /api/admin/users/:id/status` — Body: `{ "isActive": false }`
* `DELETE /api/admin/users/:id` — Delete user and purge data
* `GET /api/admin/statistics?months=6` — Platform aggregate stats
