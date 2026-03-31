# CLAUDE_CODE_INSTRUCTIONS.md
# Complete Integration Guide for OFDS Frontend ↔ Flask Backend

> **Context:** This file instructs Claude Code on how to audit, fix, and complete
> the API integration between the existing React CRA frontend (`frontend/`) and
> the Flask REST backend (`backend/`). Do NOT use the `ofds-frontend/` directory —
> that was a separate Vite/TypeScript prototype. All work happens in `frontend/`.

---

## 1. PROJECT OVERVIEW

**What is OFDS?** Operations Fund Distribution System — manages investment batches,
fund allocations (Axiom, Atium), epoch-based valuations with hash-chained ledgers,
pro-rata profit distribution, and compliance audit trails.

**Stack:**
- **Backend:** Flask, SQLAlchemy, PostgreSQL, Flask-JWT-Extended (running on `http://localhost:5000`)
- **Frontend:** React 19 (CRA), React-Bootstrap, React Hook Form, Yup, Axios, Lucide icons (running on `http://localhost:3000`)
- **Auth:** JWT tokens in localStorage (`access_token`, `refresh_token`, `user_role`)
- **Roles:** `user`, `admin`, `super_admin` — all access all views except audit logs (super_admin only)

---

## 2. DIRECTORY STRUCTURE (frontend/)

```
frontend/src/
├── App.js                      # Router + ProtectedRoute + all route definitions
├── index.js                    # React entry point
├── pages/
│   ├── Login.js                # ✅ Working — calls POST /login
│   ├── Register.js             # ✅ Working — calls POST /users
│   ├── Dashboard.js            # ✅ Mostly working — calls GET /batches
│   ├── BatchDetails.js         # ⚠️ Partially working — needs audit
│   ├── AdminPerformanceTrigger.js  # ⚠️ Needs endpoint verification
│   ├── FundManager.js          # ⚠️ Needs endpoint verification
│   ├── InvestorRegistry.js     # ⚠️ Needs endpoint verification
│   ├── Reports.js              # ⚠️ Needs endpoint verification
│   ├── GlobalReports.js        # ⚠️ Needs endpoint verification
│   └── WithdrawalManager.js    # ⚠️ Needs endpoint verification
├── components/
│   ├── AuthLayout.js           # Auth page wrapper
│   ├── Topbar.js               # Navigation header
│   ├── AddBatchModal.js        # Create batch (manual + Excel)
│   ├── EditBatchModal.js       # Edit batch
│   └── FullNameInput.js        # Reusable name field
├── services/
│   ├── authService.js          # ✅ Working — login, register, logout, token mgmt
│   ├── batchService.js         # ✅ Working — CRUD batches, Excel upload
│   ├── valuationService.js     # ⚠️ Some endpoints may be mismatched
│   ├── reportService.js        # ⚠️ Needs verification
│   └── adminService.js         # ⚠️ Some endpoints may not exist on backend
├── utils/
│   └── validationSchemas.js    # Yup schemas
└── styles/
    └── globals.css             # Theme colors (#00005b)
```

---

## 3. BACKEND API ENDPOINTS (Source of Truth)

All endpoints are at `http://localhost:5000/api/v1`. All protected routes need
`Authorization: Bearer <access_token>`.

### 3.1 Auth & Users
```
POST   /users                         # Register (name, email, password, user_role) — PUBLIC
POST   /login                         # Login → {value: {access_token, refresh_token, user_role}} — PUBLIC
GET    /users                         # List all users
GET    /users/:id                     # Get user by ID
PUT    /admin/:id                     # Promote to admin
PUT    /super_admin/:id               # Promote to super_admin (no JWT required on backend currently!)
GET    /employees                     # List admin/super_admin users
```

### 3.2 Batches
```
GET    /batches                       # List all → {status, message, count, data: [...]}
POST   /batches                       # Create → {batch_name, date_deployed?, certificate_number?}
GET    /batches/:id                   # Detail with investments
PATCH  /batches/:id                   # Stage transitions (is_transferred, date_deployed, deployment_confirmed, is_active, stage)
DELETE /batches/:id                   # Delete batch
POST   /batches/upload-excel          # Multipart Excel upload
GET    /batches/:id/summary           # Summary + investments + pro-rata
GET    /batches/:id/funds             # Funds within batch
```

### 3.3 Investments
```
POST   /investments                   # Add investment (batch_id, investor_name, investor_email, etc.)
```

### 3.4 Funds (Core Funds)
```
GET    /funds                         # List all → {status, data: [{id, fund_name, is_active}]}
POST   /funds                         # Create → {fund_name: "name"} ← NOTE: backend expects fund_name, not "name"
```

### 3.5 Performance
```
POST   /batches/:id/performance       # Create (gross_profit, transaction_costs, date_closed)
GET    /batches/:id/performance       # Get all, or ?fund_name= for specific
POST   /batches/:id/calculate-pro-rata # Trigger pro-rata (?fund_name=)
```

### 3.6 Valuation
```
POST   /valuation/epoch               # Commit epoch (fund_id, start_date, end_date, performance_rate, head_office_total)
POST   /valuation/dry-run             # POST dry-run (same body as epoch)
GET    /valuation/epoch/dry-run       # GET dry-run (query params: fund_id, start_date, end_date, performance_rate, head_office_total)
GET    /valuation/funds               # List active core funds
```

### 3.7 Investors
```
GET    /investors/:clientCode/statement  # Investor statement (?fund_id=)
GET    /investors/:clientCode            # Investor profile
PATCH  /investors/:clientCode            # Update investor
GET    /investors                        # List all investors (registry)
```

### 3.8 Withdrawals
```
POST   /withdrawals                   # Create (internal_client_code, fund_id, amount, status)
GET    /withdrawals                   # List (?status=Pending|Approved|Rejected)
POST   /withdrawals/upload            # Bulk Excel upload
PATCH  /withdrawals/:id               # Update (status change)
```

### 3.9 Reports
```
GET    /reports                       # List committed valuation runs (?fund_id=, ?limit=)
GET    /reports/:id                   # Detail (investor breakdown, reconciliation diff)
GET    /reports/:id/pdf               # Download PDF
GET    /reports/portfolio             # Global portfolio AUM (?as_of=)
GET    /reports/portfolio/multi-batch # Excel download (?batch_ids=, ?fund_name=)
GET    /reports/batch/:id/summary     # Single batch summary Excel
GET    /reports/batch/:id/reconciliation # JSON reconciliation
```

### 3.10 Audit Logs
```
⚠️ GET /audit-logs does NOT exist yet on backend. AuditLog model exists but has no route.
```

---

## 4. KNOWN ISSUES TO FIX

### 4.1 adminService.js — createCoreFund sends wrong payload
```javascript
// CURRENT (WRONG):
export async function createCoreFund(fund_name) {
  const res = await adminAxios.post('/funds', { name: fund_name, status: 'Active' });
  return res.data;
}

// CORRECT (backend expects fund_name):
export async function createCoreFund(fund_name) {
  const res = await adminAxios.post('/funds', { fund_name: fund_name });
  return res.data;
}
```

### 4.2 adminService.js — updateCoreFund and deactivateCoreFund
Backend may not have `PATCH /funds/:id` or `DELETE /funds/:id` routes.
Check `backend/app/Batch/fund_routes.py` for available endpoints.
If missing, disable the UI buttons or implement the routes.

### 4.3 valuationService.js — commitEpochValuation calls wrong endpoint
```javascript
// CURRENT (may not exist):
const response = await valuationAxios.post('/valuation/confirm', { ... });

// CORRECT endpoint is:
POST /valuation/epoch
// with body: { fund_id, start_date, end_date, performance_rate, head_office_total }
```
Also: the dry-run sends `fund_name` and `performance_rate_percent`, but the backend
`POST /valuation/dry-run` expects `fund_id` (integer) and `performance_rate` (decimal fraction
or percent — backend auto-detects). Verify the field names match.

### 4.4 valuationService.js — dryRunEpochValuation field mismatch
```javascript
// CURRENT:
fund_name: String(fundName),
performance_rate_percent: Number(performanceRatePercent),

// Backend POST /valuation/dry-run expects:
fund_id: Number(fundId),          // integer, not fund_name
performance_rate: Number(rate),    // accepts both 0.05 and 5
```
The AdminPerformanceTrigger UI uses a fund name dropdown — you need to send
the fund's ID, not its name. Either change the dropdown to store fund.id as
the value, or add a lookup in the service.

### 4.5 reportService.js — verify endpoints exist
Check that `generateBatchSummaryReport` hits `GET /reports/batch/:id/summary`
and that `generateMultiBatchPortfolioReport` hits `GET /reports/portfolio/multi-batch`.
These endpoints return Excel files (binary) — the frontend should trigger a download,
not try to parse JSON.

### 4.6 CORS
Flask needs `flask-cors` configured. In `backend/main.py` or wherever the app is created:
```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})
```

### 4.7 Response shape consistency
Flask responses follow this pattern:
```json
{
  "status": 200,
  "message": "Success",
  "data": { ... }  // or [...] for lists
}
```
Some frontend pages access `result.data` directly instead of `result.data.data`.
The Dashboard already handles this with `result.data?.data || result.data || []`.
Apply the same pattern everywhere.

### 4.8 createWithdrawal payload mismatch
```javascript
// Frontend sends:
{ client_id: "CODE", fund_id: 1, amount: 5000, status: "Pending" }

// Backend expects:
{ internal_client_code: "CODE", fund_id: 1, amount: 5000, status: "Pending" }
```
Field is `internal_client_code`, not `client_id`.

---

## 5. STEP-BY-STEP INTEGRATION CHECKLIST

### Phase A: Verify working pages
1. Start Flask backend: `cd backend && python main.py`
2. Start React frontend: `cd frontend && npm start`
3. Test login at http://localhost:3000/login
4. Test registration at http://localhost:3000/register
5. Test dashboard loads batches at http://localhost:3000/dashboard
6. Test batch detail at http://localhost:3000/batch/1

### Phase B: Fix service layer
1. Fix `adminService.js` — `createCoreFund` payload (fund_name not name)
2. Fix `valuationService.js` — `commitEpochValuation` endpoint (/valuation/epoch not /valuation/confirm)
3. Fix `valuationService.js` — `dryRunEpochValuation` fields (fund_id not fund_name)
4. Fix `adminService.js` — `createWithdrawal` payload (internal_client_code not client_id)
5. Verify `reportService.js` endpoints match backend routes
6. Verify `adminService.js` — updateCoreFund and deactivateCoreFund have backend routes

### Phase C: Fix pages
1. **AdminPerformanceTrigger.js** — Fund dropdown should send fund_id (not fund_name) to valuation service
2. **FundManager.js** — Verify create/edit/deactivate operations work against real backend
3. **InvestorRegistry.js** — Verify GET /investors works and response shape is handled
4. **Reports.js** — Verify report list loads from GET /reports and detail from GET /reports/:id
5. **GlobalReports.js** — Verify multi-batch Excel download works (binary response handling)
6. **WithdrawalManager.js** — Fix createWithdrawal payload, verify list/upload work
7. **BatchDetails.js** — Verify stage transitions (PATCH), valuation summary, reconciliation, add investor

### Phase D: Test Excel operations
1. Test batch Excel upload (POST /batches/upload-excel)
2. Test withdrawal Excel upload (POST /withdrawals/upload)
3. Test report Excel downloads (binary blob → trigger browser download)
4. Test PDF download (GET /reports/:id/pdf)

### Phase E: Error handling
1. Ensure all API errors show user-friendly messages (not raw stack traces)
2. Ensure 401 responses clear tokens and redirect to login (already in interceptors)
3. Ensure network errors show "Connection error" not undefined

---

## 6. BACKEND DEPENDENCIES (Cannot fix on frontend)

| # | Issue | Severity |
|---|-------|----------|
| 1 | `GET /api/v1/audit-logs` does not exist | High — super_admin audit page won't work |
| 2 | `POST /api/v1/performance/upload-excel` does not exist | High — performance Excel upload won't work |
| 3 | `PATCH /funds/:id` may not exist | Medium — fund editing won't work |
| 4 | `DELETE /funds/:id` may not exist | Medium — fund deactivation won't work |
| 5 | CORS may not be configured | High — all API calls will fail from browser |

For items 1-4, the frontend should show a graceful "Not available" message.
For item 5, this MUST be fixed on the backend before anything works.

---

## 7. TESTING COMMANDS

```bash
# Start backend
cd backend
python main.py

# Start frontend (separate terminal)
cd frontend
npm start

# Test API directly
curl -X POST http://localhost:5000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ofds.com", "password": "AdminPassword123!"}'

# Test with token
TOKEN="<paste access_token from login response>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/v1/batches
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/v1/funds
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/v1/reports
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/v1/withdrawals
```

---

## 8. SUCCESS CRITERIA

The frontend is "fully functional" when:
- [ ] Login and registration work end-to-end
- [ ] Dashboard loads real batches from Flask
- [ ] Batch detail shows investors, stage stepper works, stage transitions work
- [ ] Creating a batch (manual and Excel upload) works
- [ ] Fund manager lists, creates funds correctly
- [ ] AdminPerformanceTrigger dry-run and commit work with correct field names
- [ ] Reports page lists valuation runs, detail shows investor breakdown
- [ ] GlobalReports page generates multi-batch Excel download
- [ ] WithdrawalManager lists, creates, uploads withdrawals correctly
- [ ] InvestorRegistry lists investors, shows profiles
- [ ] All errors show user-friendly messages
- [ ] 401 responses redirect to login
- [ ] No console errors in normal operation
