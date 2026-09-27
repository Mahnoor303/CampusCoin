---
trigger: always_on
---

# CAMPUSCOIN BACKEND — MASTER DEVELOPMENT INSTRUCTION

You are working on the backend of a university project called **CampusCoin**, a student personal finance management web application.

## 1. YOUR ROLE

You are responsible ONLY for the **backend**.

The frontend is being developed separately by another developer using React.

Your backend must expose clean, documented REST APIs that the frontend developer can consume.

Use:

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT authentication
* REST API architecture

Do NOT build or redesign the frontend.

---

# 2. SOURCE OF TRUTH

The uploaded CampusCoin SRS is the primary source of truth.

Do not add unnecessary features just because they are common in finance applications.

The backend should support the requirements described in the SRS.

Important SRS requirements include:

* User registration/login
* User profile
* Authentication/session management
* Income and expense tracking
* Expense/income categories
* Transaction CRUD
* Recurring transactions
* Budgets
* Budget alerts
* Savings goals
* Reports and analytics
* Saving tips
* Rule-based insights
* Optional AI-ready architecture
* CSV import
* Admin functionality
* Secure user data isolation
* Accessibility-related frontend support through clean API responses
* Good performance and scalability

The system must NOT implement:

* Real bank account integration
* Real payment processing
* Actual monetary transactions
* Real financial transfers

This is a tracking/advisory application only.

---

# 3. CRITICAL DEVELOPMENT RULES

Before changing anything:

1. Inspect the existing project.
2. Understand the current folder structure.
3. Reuse existing code where appropriate.
4. Do NOT blindly overwrite working files.
5. Do NOT create duplicate models, routes, controllers, middleware, or utilities.
6. Preserve working authentication and existing project structure if already implemented.
7. If something is already implemented correctly, improve it only if necessary.
8. Keep the backend modular and maintainable.

Never assume a file exists.

Inspect first.

---

# 4. BACKEND ARCHITECTURE

Use a clean structure similar to:

backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   └── server.js
├── tests/
├── .env
├── .env.example
├── package.json
└── README.md

Adapt this structure to the existing project instead of forcing it if the current structure is already good.

---

# 5. DATABASE MODELS

Use MongoDB with Mongoose.

Core models should include:

### User

Fields should support:

* name
* email
* password hash
* role
* profile information
* timestamps

Roles:

* student/user
* admin

### Category

Support:

* name
* type: income or expense
* user ownership where appropriate
* system/default categories
* timestamps

Default income categories:

* Allowance
* Part-time Job
* Scholarship
* Gift
* Other

Default expense categories:

* Food
* Transport
* Hostel/Rent
* Academics
* Subscriptions
* Entertainment
* Miscellaneous

### Transaction

Support:

* user
* type: income or expense
* amount
* category
* title/description
* date
* notes
* recurring information if applicable
* timestamps

### Budget

Support:

* user
* category
* amount/limit
* period
* start date
* end date
* alert threshold
* timestamps

### Goal

Support:

* user
* name
* target amount
* current amount
* deadline
* status
* notes
* timestamps

### Insight

Support generated financial insights/tips where required.

Design schemas with indexes where useful.

---

# 6. SECURITY

Security is extremely important.

Implement:

* password hashing
* JWT authentication
* protected routes
* role-based authorization
* input validation
* ownership checks
* safe error handling
* environment variables
* no secrets committed to source code
* appropriate HTTP status codes
* protection against users accessing another user's financial data

A student must NEVER be able to:

* read another student's transactions
* modify another student's transaction
* delete another student's transaction
* read another student's budget
* modify another student's goals
* access admin-only endpoints

Admin access must be explicitly protected.

Never return password hashes in API responses.

---

# 7. API DESIGN

Use RESTful APIs.

Use a consistent response structure where practical, for example:

Success:

{
"success": true,
"message": "...",
"data": {}
}

Error:

{
"success": false,
"message": "...",
"errors": []
}

Use appropriate HTTP status codes.

Examples:

200 — successful request
201 — resource created
400 — validation error
401 — unauthenticated
403 — unauthorized
404 — resource not found
409 — conflict
500 — server error

Keep API naming predictable.

Example:

/api/auth
/api/users
/api/categories
/api/transactions
/api/budgets
/api/goals
/api/reports
/api/insights
/api/tips
/api/import
/api/admin

---

# 8. FRONTEND CONTRACT

The frontend developer will consume your APIs.

Therefore every endpoint must have:

* clear URL
* HTTP method
* authentication requirement
* request body/query parameters
* response structure
* error behavior

Document all APIs in README or API documentation.

Do not make frontend assumptions inside backend logic.

---

# 9. VALIDATION

Validate all incoming data.

Validate:

* email
* password
* names
* amounts
* dates
* transaction type
* category IDs
* budget values
* goal values
* CSV data

Reject invalid data cleanly.

Do not trust client-side validation.

Backend validation is mandatory.

---

# 10. TRANSACTION RULES

Transactions are the core of CampusCoin.

Support:

* create
* read
* update
* delete
* filtering
* searching
* pagination
* date ranges
* income/expense filtering
* category filtering
* recurring transactions

Do not allow invalid negative/zero monetary values unless the business logic explicitly requires them.

Make sure transaction ownership is always enforced.

---

# 11. DASHBOARD / REPORTING

The backend must provide aggregated data needed by the frontend.

Support calculations such as:

* total income
* total expenses
* current balance
* expenses by category
* income by source
* monthly totals
* spending trends
* budget usage
* goal progress

Use MongoDB aggregation where appropriate.

Do not send thousands of raw transactions to the frontend just to calculate simple totals.

---

# 12. CSV IMPORT

Implement CSV transaction import.

Validate every imported row.

Handle:

* valid rows
* invalid rows
* missing fields
* invalid amounts
* invalid dates
* invalid categories

Return useful import results such as:

* total rows
* successful rows
* failed rows
* errors

Do not allow imported records to bypass authentication or ownership rules.

---

# 13. SAVING TIPS / INSIGHTS

Implement rule-based financial tips/insights.

Examples:

* unusually high spending
* category spending increase
* budget nearing limit
* repeated unnecessary spending
* progress toward savings goal

These are advisory only.

Do not present AI/rule-based insights as professional financial advice.

Keep AI functionality optional and isolated so it can be added later without restructuring the backend.

---

# 14. ADMIN

Implement backend support for admin functionality.

Admin APIs may include:

* user statistics
* user listing
* category management
* transaction oversight where appropriate
* system statistics

Every admin endpoint must use admin authorization middleware.

Do not expose administrative endpoints to normal students.

---

# 15. ERROR HANDLING

Create centralized error handling.

Avoid exposing:

* stack traces
* database internals
* passwords
* JWT secrets
* sensitive implementation details

Use useful messages for the frontend.

---

# 16. LOGGING

Add reasonable server-side logging for:

* startup
* database connection
* API errors
* important backend failures

Do not log:

* passwords
* JWT secrets
* sensitive financial information unnecessarily

---

# 17. TESTING

For every major backend module, test:

* successful request
* invalid request
* unauthenticated request
* unauthorized request
* ownership violation
* not-found case
* edge cases

At minimum, test:

Authentication
Users
Categories
Transactions
Budgets
Goals
Reports
CSV import
Admin authorization

---

# 18. API DOCUMENTATION

Maintain a backend README containing:

* project setup
* environment variables
* installation
* database setup
* development command
* production command
* API base URL
* authentication flow
* endpoint list
* request examples
* response examples
* test instructions

Also provide a clear API endpoint summary for the frontend developer.

---

# 19. ENVIRONMENT VARIABLES

Use .env for secrets/configuration.

Example:

PORT=
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
NODE_ENV=

Never hardcode secrets.

Provide .env.example without real credentials.

---

# 20. DEVELOPMENT WORKFLOW

After every major implementation:

1. Run the backend.
2. Check database connection.
3. Test affected endpoints.
4. Run automated tests.
5. Fix errors.
6. Check for duplicate code.
7. Check security.
8. Check API consistency.
9. Update documentation.

Do NOT continue while major errors remain.

---

# 21. IMPORTANT: DO NOT OVERENGINEER

This is a university project.

Keep the backend:

* clean
* understandable
* secure
* maintainable
* practical
* easy to explain during viva

Do not introduce unnecessary microservices, message queues, complicated infrastructure, or enterprise-level architecture.

A clean modular Express + MongoDB backend is sufficient.

---

# 22. FINAL REQUIREMENT

At the end of all backend development, the backend should be usable by a separate React frontend developer without needing to inspect backend implementation details.

The frontend developer should only need the API documentation and environment configuration.

Every major feature must be accessible through a documented REST API.

Always explain what you changed after completing a task.

Always report:

* files created
* files modified
* APIs added
* database changes
* tests performed
* remaining issues

DO NOT claim something is complete unless you actually implemented and tested it.

Start by inspecting the existing project before making changes.
