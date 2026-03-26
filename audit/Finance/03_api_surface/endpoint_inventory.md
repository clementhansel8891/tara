# Finance Endpoint Inventory

## 1. Core Finance Controller (`/finance`)

| Method | Path | Responsibility |
| --- | --- | --- |
| `GET` | `/coa` | List Chart of Accounts. |
| `POST` | `/coa` | Create/Update Account. |
| `GET` | `/fiscal-periods` | List fiscal periods. |
| `POST` | `/fiscal-periods` | Create/Update Period. |
| `POST` | `/post-ledger` | Process a ledger posting request. |
| `POST` | `/reverse-journal` | Reverse an existing journal entry. |
| `GET` | `/balances/:accountId` | Get current balance for an account. |

## 2. Accounts Receivable (`/ar`)

| Method | Path | Responsibility |
| --- | --- | --- |
| `GET` | `/customers` | List AR customers. |
| `POST` | `/invoices` | Create a new invoice. |
| `POST` | `/invoices/:id/issue` | Transition invoice to ISSUED state. |
| `POST` | `/payments` | Record a customer payment. |
| `POST` | `/payments/allocate`| Map payment to specific invoice(s). |

## 3. Financial Intelligence (`/finance/intelligence`)

| Method | Path | Responsibility |
| --- | --- | --- |
| `GET` | `/cashflow` | Multi-scenario cashflow forecasting. |
| `GET` | `/insights` | AI-generated financial insights. |
| `GET` | `/forecast` | Future P&L/Balance Sheet projections. |

## 4. Audit & Compliance (`/finance/compliance` & `/certified`)

| Method | Path | Responsibility |
| --- | --- | --- |
| `POST` | `/seal/:snapshotId` | Hard-close a period with cryptographic hash. |
| `GET` | `/audit/integrity` | Verify DB ledger matches Merkle tree. |
| `GET` | `/verify/:id` | Public verification of a certified report. |

## 5. Dashboard & Reports (`/finance/dashboard` & `/reporting`)

| Method | Path | Responsibility |
| --- | --- | --- |
| `GET` | `/summary` | Aggregated KPIs for the CFO dashboard. |
| `POST` | `/export` | Generate signed PDF/Excel exports. |
| `POST` | `/repair-chain` | (ADMIN) Rebuild broken audit chains. |
