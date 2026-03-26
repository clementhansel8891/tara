# Business Logic: Calculated Metrics

## 1. Financial Reporting Logic

| Metric | Calculation Basis | Audit Note |
| --- | --- | --- |
| **Trial Balance** | `Sum(Debits) - Sum(Credits)` | Must equal $0$ at the report level (`isBalanced` flag). Uses `Decimal(19, 4)` for precision. |
| **Profit & Loss** | `Revenue - Expense` | Derived from account categories. Handled dynamically for open periods and via snapshots for closed periods. |
| **Retained Earnings**| `Hist Revenue - Hist Expense` | Uses a dual-mode: **Dynamic** (Sum all time) vs **Closed** (Static GL account). |
| **Account Balance** | `Opening + Movement = Closing`| Updates are atomically locked (`updateAccountBalanceLocked`) to prevent lost updates. |

## 2. AI Intelligence Metrics
- **Cashflow Horizon**: Projects expected receipts (AR) and payments (AP) over `N` days. Uses scenario multipliers (`revMult`, `expMult`) for risk modeling.
- **Predictive Insights**: Combines historical trend data with the `ForecastService` to identify "Minimum Safe Cash" violations before they occur.

## 3. Integrity Guarantees
- **Stable Serialization**: Reports are serialized with sorted keys before hashing to ensure same-data = same-hash (`stableSerialize`).
- **Integrity Hash**: Every report response includes an `integrityHash`. Any tampering with the result payload downstream can be detected by re-hashing the data.
