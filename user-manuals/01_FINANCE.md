# Finance Command — User Manual

> **Department:** Finance & Treasury  
> **Workspace:** Finance Command — Strategic Capital & Fiscal Intelligence Matrix  
> **URL Base:** `/core/finance`

---

## Role Access

| Role | CFO Dashboard | Ledger / JV | Payables / Receivables | Period Close | Audit Vault |
|------|:---:|:---:|:---:|:---:|:---:|
| Owner / Company Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Finance Manager | ✅ | ✅ | ✅ | ✅ | ✅ |
| Finance Staff | 👁 | 👁 | ✅ | ❌ | 👁 |
| Other Departments | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Sidebar Navigation

```
Finance Command
├── INTELLIGENCE
│   ├── CFO Dashboard         (/core/finance)
│   └── Financial Insights    (/core/finance/insights)
├── OPERATIONS
│   ├── Money Desk            (/core/finance/moneydesk)
│   ├── Treasury Map          (/core/finance/treasury)
│   ├── Ledger Core           (/core/finance/ledger)
│   └── PayFlow Hub           (/core/finance/payflow)
├── TRANSACTIONS
│   ├── Receivables           (/core/finance/receivables)
│   ├── Payables              (/core/finance/payables)
│   ├── Invoice Capture       (/core/finance/invoices)
│   └── JV Desk               (/core/finance/jv)
└── GOVERNANCE
    ├── Period Close          (/core/finance/close)
    ├── Audit Vault           (/core/finance/audit)
    ├── Policy Manager        (/core/finance/policy)
    ├── Staff Schedule        (/core/finance/schedule)
    └── Administration        (/core/finance/admin)
```

---

## 1. CFO Dashboard (`/core/finance`)

**Purpose:** Executive intelligence hub. Real-time KPIs, financial statements, and cashflow analysis for the selected company and fiscal period.

### 1.1 Selecting Company & Period
Before data loads, you must set the Global Filter Bar:
1. Navigate to **Finance Command → CFO Dashboard**.
2. The **Global Financial Filter Bar** appears at the top.
3. Select your **Company** from the first dropdown.
4. Select the **Fiscal Period** (e.g., January 2026) from the second dropdown.
5. The dashboard loads automatically.

### 1.2 Reading the Intelligence Hub
After data loads, you will see:
- **System Health Badge**: `SYSTEM_HEALTHY` / `SYSTEM_DEGRADED` / `SYSTEM_CRITICAL`
- **Correlation ID**: a short audit reference code (e.g., `CORE_CID: a1b2c3d4...`)

**⚠ If a red "Audit Integrity Failure" banner appears:** The General Ledger is out of balance. Contact your Finance Manager or system administrator immediately.

### 1.3 Reading the KPI Cards
Four KPI cards appear at the top:
| Card | Meaning |
|------|---------|
| Total Revenue | Gross income for the selected period |
| Total Expense | Total outflows |
| Net Profit | Revenue minus expenses |
| Total Assets | Balance sheet total assets |

### 1.4 Financial Statements (Tabs)
Below the charts, use the **Tabs** to switch views:

| Tab | What You See |
|-----|-------------|
| **Trial Balance** | All accounts with debit/credit totals |
| **Profit & Loss** | Income statement (revenue minus costs) |
| **Balance Sheet** | Assets, liabilities, and equity snapshot |
| **Cashflow Analysis** | Operating, investing, financing cash flows |

### 1.5 Drill-Down into an Account
1. In any report tab, click any account row.
2. A **Drill-Down Modal** opens showing all individual transactions posted to that account.
3. Click **Close** to return.

### 1.6 Sending the Dashboard Report
1. Click **Send Report** in the Intelligence Hub header.
2. A security-watermarked export is queued.
3. Toast: *"Tactical Transmission Queued."*

---

## 2. Financial Insights (`/core/finance/insights`)

**Purpose:** Trend analysis, anomaly detection, and period-over-period comparison analytics.

### Steps
1. Navigate to **Finance Command → Financial Insights**.
2. Select a **time range** from the filter bar (monthly, quarterly, annual).
3. Use chart toggles to switch between: Revenue, Expenses, Profit Margin, Asset views.
4. Click **Export** → download as PDF or Excel.
5. Click **Share to Exec** → routes insights to CFO inbox via FlowGate.

---

## 3. Money Desk (`/core/finance/moneydesk`)

**Purpose:** Daily cash management across all bank and cash accounts.

### 3.1 Viewing Cash Position
1. Navigate to **Finance Command → Money Desk**.
2. The **Cash Position Summary** shows all accounts with current balances.
3. Click any account row to view its transaction history.
4. Filter by **date range** to narrow results.

### 3.2 Reconciling a Bank Transaction
1. In the **Bank Reconciliation Queue**, find an unmatched transaction.
2. Click the row to open the reconciliation panel.
3. Select the matching internal ledger entry from the dropdown.
4. Click **Match & Reconcile**.

### 3.3 Recording a Manual Cash Transaction
1. Click **New Transaction** in the WorkQueue.
2. Select the **Account** (bank or petty cash).
3. Enter: **Amount**, **Date**, **Description**, **Account Code**.
4. Click **Post Transaction**.

---

## 4. Treasury Map (`/core/finance/treasury`)

**Purpose:** Liquidity position, cashflow forecasting, and fund allocation visualization.

### Reading the Liquidity Heatmap
- 🟢 Green = Healthy balance
- 🟡 Yellow = Approaching threshold
- 🔴 Red = Below minimum threshold

### Viewing the Cashflow Forecast
1. Navigate to **Finance Command → Treasury Map**.
2. In the **Cashflow Forecast** panel, select **30 / 60 / 90 Days** toggle.
3. Chart shows projected inflows (from Receivables) and outflows (from Payables).
4. Click **Export Forecast** → download as Excel.

---

## 5. Ledger Core (`/core/finance/ledger`)

**Purpose:** Chart of accounts management and general ledger.

### 5.1 Viewing the Chart of Accounts
1. Navigate to **Finance Command → Ledger Core**.
2. Accounts are organized in groups:
   - `100x` = Assets | `200x` = Liabilities | `300x` = Equity | `400x` = Revenue | `500x+` = Expenses
3. Click any account row to see its balance history and posted entries.
4. Use the search bar to find by name or code.

### 5.2 Adding a New Account
1. Click **New Account**.
2. Fill in: **Account Code**, **Account Name**, **Account Type**, **Parent Account** (optional).
3. Click **Save Account**.

---

## 6. PayFlow Hub (`/core/finance/payflow`)

**Purpose:** Batch payment runs — schedule, prepare, and execute outgoing vendor payments.

### Creating a Payment Run
1. Navigate to **Finance Command → PayFlow Hub**.
2. Click **New Payment Run**.
3. Select: **Payment Date**, **Bank Account**, **Currency**.
4. System populates eligible vendor invoices due for payment.
5. Check invoices to include. Click **Preview Run** to review totals.
6. Click **Submit for Approval** → routes to Finance Manager via FlowGate.
7. After approval, click **Execute Payment** to post and send to bank.

### Payment Status Meanings
| Status | Meaning |
|--------|---------|
| Pending | Awaiting approval |
| Approved | Cleared for execution |
| Executed | Payment sent |
| Failed | Bank error — investigate |

---

## 7. Receivables Desk (`/core/finance/receivables`)

**Purpose:** Accounts Receivable — manage outstanding customer invoices.

### 7.1 Reviewing AR Aging
1. Navigate to **Finance Command → Receivables**.
2. The **AR Aging Summary** cards show totals in buckets: 0–30, 31–60, 61–90, 90+ days.
3. Click any aging bucket to filter the invoice table.
4. Click an invoice row → see invoice details, payment history, and customer contact.

### 7.2 Recording a Customer Payment
1. Find the paid invoice in the table.
2. Click the invoice row → open detail panel.
3. Click **Record Payment**.
4. Enter: **Payment Date**, **Amount Received**, **Payment Method**.
5. Click **Apply Payment**.

### 7.3 Escalating an Overdue Invoice
1. Open an overdue invoice (90+ days).
2. Click **Escalate to FlowGate**.
3. Select destination: **Sales** (relationship management) or **Legal** (collections).
4. Add a note and click **Submit**.

---

## 8. Payables Desk (`/core/finance/payables`)

**Purpose:** Accounts Payable — manage all vendor invoices your company owes.

### 8.1 Entering a Vendor Invoice
1. Navigate to **Finance Command → Payables**.
2. Click **New Invoice**.
3. Fill in: **Vendor Name**, **Invoice Number**, **Invoice Date**, **Due Date**, **Line Items** (description, quantity, price, account code).
4. Click **Save Invoice** → saves as draft.
5. Click **Submit for Approval** → routes to Finance Manager via FlowGate.

### 8.2 Approving an Invoice (Finance Manager)
1. Go to **Workflow Inbox** or **Payables → Approval Queue**.
2. Open the pending invoice.
3. Review all line items.
4. Click **Approve** (releases for payment) or **Reject** with reason.

---

## 9. Invoice Capture (`/core/finance/invoices`)

**Purpose:** OCR-based digitization of paper and PDF invoices.

### Steps
1. Navigate to **Finance Command → Invoice Capture**.
2. Click **Upload Invoice** → select PDF, JPEG, or PNG file.
3. System runs **OCR extraction** automatically. Extracted fields appear on the right.
4. Review and correct any misread fields.
5. Select the **Vendor** from the dropdown.
6. Assign **Account Codes** to each line item.
7. Click **Post to Payables**.

### OCR Confidence Indicators
| Color | Meaning |
|-------|---------|
| 🟢 Green | High confidence — minimal review needed |
| 🟡 Yellow | Medium — check key fields |
| 🔴 Red | Low — manually verify all fields |

---

## 10. JV Desk (`/core/finance/jv`)

**Purpose:** Manual journal vouchers for accruals, adjustments, prepayments, and GL corrections.

### Creating a Journal Entry
1. Navigate to **Finance Command → JV Desk**.
2. Click **New Journal Voucher**.
3. Fill in: **JV Date**, **Description/Memo**, **Reference Number** (optional).
4. Add line items: select **Account**, enter **Debit** OR **Credit** (not both per line), add description.
5. System validates: **Total Debits = Total Credits** (must balance).
6. Click **Save as Draft** or **Submit for Approval**.
7. Once approved, click **Post Journal** to commit to GL.

> **⚠ Posted JVs cannot be deleted — only reversed with a counter-entry.**

---

## 11. Period Close Studio (`/core/finance/close`)

**Purpose:** Month-end and year-end closing — lock periods to prevent further changes.

### Period Close Checklist
| Task | Description |
|------|-------------|
| Bank Reconciliation | All accounts reconciled |
| AR Review | Outstanding receivables reviewed |
| AP Review | Vendor invoices accounted for |
| Payroll Posted | Payroll JV entries posted |
| Accruals Posted | Month-end accruals entered |
| Trial Balance Review | TB reviewed and balanced |

### Closing a Period
1. Navigate to **Finance Command → Period Close**.
2. Select the **Period** to close.
3. Ensure all checklist items show ✅.
4. Click **Initiate Close** → system runs final balance check.
5. If balanced, click **Confirm & Lock Period**.
6. Period status changes to **CLOSED**.

---

## 12. Audit Vault (`/core/finance/audit`)

**Purpose:** Immutable log of every financial action for compliance.

### Viewing Logs
1. Navigate to **Finance Command → Audit Vault**.
2. Filter by: **Date range**, **Action Type**, **Actor**, **Account**.
3. Click any row for full event detail (before/after state).
4. Click **Export Log** → download as CSV.

### Key Audit Events
| Event | Trigger |
|-------|---------|
| `INVOICE_CREATED` | New invoice entered |
| `PAYMENT_EXECUTED` | Payment run executed |
| `JOURNAL_POSTED` | JV committed to GL |
| `PERIOD_LOCKED` | Fiscal period closed |

---

## 13. Policy Manager (`/core/finance/policy`)

**Purpose:** Financial policy configuration — approval thresholds, payment terms, and spending limits.

### Setting Approval Thresholds
1. Navigate to **Policy Manager**.
2. In **Approval Thresholds**, click **Edit Policy**.
3. Set amounts per approval level (Staff, Manager, CFO).
4. Click **Save Policy**.

### Managing Payment Terms
1. Click **New Term**.
2. Set: **Term Name** (e.g., Net 30), **Days** (30), **Discount %** (optional).
3. Click **Save**.

---

## 14. Asset Management (`/core/finance/assets`)

**Purpose:** Fixed asset register with automatic depreciation scheduling.

### Registering a New Asset
1. Navigate to **Finance Command → Assets**.
2. Click **New Asset**.
3. Fill in: **Asset Name**, **Category**, **Purchase Date**, **Purchase Price**, **Useful Life** (years), **Depreciation Method**, **Location**.
4. Click **Save Asset** — system auto-schedules monthly depreciation entries.

### Disposing of an Asset
1. Open the asset record.
2. Click **Record Disposal**.
3. Enter: **Disposal Date**, **Proceeds** (or 0 if scrapped), **Reason**.
4. Click **Confirm Disposal** — system posts the disposal JV automatically.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Dashboard shows no data | Select Company and Fiscal Period from the Filter Bar |
| "Audit Integrity Failure" banner | GL is out of balance — escalate immediately |
| Cannot close a period | Complete all checklist items first |
| Invoice OCR failed | Upload a clearer scan or enter manually |
| JV won't post | Confirm Debits = Credits total |

---

## Best Practices

- ✅ Always select correct **Company** and **Period** before entering transactions.
- ✅ Review all OCR invoices before posting.
- ✅ Use FlowGate for all invoices above your authorization threshold.
- ✅ Reconcile bank accounts **weekly** to avoid month-end pressure.
- ✅ Never skip the Period Close checklist.

---

*Return to [Master Index](./README.md)*
