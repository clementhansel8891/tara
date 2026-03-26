# Finance API Endpoint Inventory

## 1. Core Ledger & General Finance
| Method | Endpoint | Description | Auth Roles |
|--------|----------|-------------|------------|
| `GET` | `/finance/health` | Startup diagnostics & safety status | ADMIN |
| `GET` | `/finance/coa` | Retrieve Chart of Accounts hierarchy | ALL |
| `POST` | `/finance/coa` | Create new COA category/account | ADMIN, OWNER |
| `PATCH` | `/finance/coa/:id` | Update COA metadata | ADMIN, OWNER |
| `DELETE` | `/finance/coa/:id` | Remove COA (Soft/Hard conditional) | ADMIN, OWNER |
| `POST` | `/finance/fiscal-periods/:id/lock` | Close/Lock a financial period | ADMIN, SUPERADMIN |
| `POST` | `/finance/journals/:id/reverse` | Request immutable reversal of entry | ADMIN, SUPERADMIN |
| `POST` | `/finance/ledger/process-event` | Trigger ledger engine for event ID | ADMIN, OWNER |

## 2. Accounts Receivable (AR)
| Method | Endpoint | Description | Auth Roles |
|--------|----------|-------------|------------|
| `GET` | `/ar/customers` | List company customers | ALL |
| `POST` | `/ar/customers` | Create new AR customer | ADMIN, OWNER |
| `GET` | `/ar/invoices` | List invoices (with filters) | ALL |
| `POST` | `/ar/invoices` | Create draft invoice | ADMIN, OWNER |
| `POST` | `/ar/invoices/:id/issue` | Finalize and post invoice to ledger | ADMIN, OWNER |
| `POST` | `/ar/payments` | Record customer payment | ADMIN, OWNER |
| `POST` | `/ar/payments/allocate` | Map payment to specific invoice(s) | ADMIN, OWNER |
| `GET` | `/ar/reports/aging` | Retrieve AR Aging buckets | ALL |

## 3. Reporting & Intelligence
| Method | Endpoint | Description | Auth Roles |
|--------|----------|-------------|------------|
| `GET` | `/finance/reporting/trends` | Historical trend analysis | ALL |
| `GET` | `/finance/reporting/consolidated` | P&L / Balance Sheet aggregation | ALL |
| `GET` | `/finance/intelligence/cashflow` | AI-driven 30/60/90 day forecast | ALL |
| `GET` | `/finance/intelligence/insights` | Anomaly & optimization detections | ALL |
| `POST` | `/finance/reports/certified/seal/:snapshotId` | Digitally seal a financial report | ADMIN, OWNER |
