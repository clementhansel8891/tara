# Sales Command — User Manual

> **Department:** Sales & Revenue  
> **Workspace:** Sales Command — Revenue Growth & Market Acquisition Matrix  
> **URL Base:** `/core/sales`

---

## Role Access

| Role | Dashboard | Leads | Pipeline | Quotes | Customer 360 | Commissions | Admin |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Owner / Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sales Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sales Staff | 👁 | ✅ Own | ✅ Own | ✅ Own | ✅ Own | 👁 Own | ❌ |
| Other Depts | ❌ | ❌ | ❌ | ❌ | 👁 | ❌ | ❌ |

---

## Sidebar Navigation

```
Sales Command
├── INTELLIGENCE
│   ├── Sales Command         (/core/sales/dashboard)
│   └── Revenue Matrix        (/core/sales/overview)
├── PIPELINE
│   ├── Lead Ingestion        (/core/sales/leads)
│   ├── Funnel Matrix         (/core/sales/pipeline)
│   └── Opportunity Vault     (/core/sales/opps)
├── EXECUTION
│   ├── Quote Studio          (/core/sales/quotes)
│   ├── Customer 360          (/core/sales/customers)
│   └── Commission Desk       (/core/sales/commissions)
└── GOVERNANCE
    ├── Workflow              (/core/workflow?scope=Sales)
    ├── Staff Schedule        (/core/sales/schedule)
    └── Administration        (/core/sales/admin)
```

---

## 1. Sales Command Dashboard (`/core/sales/dashboard`)

**Purpose:** Real-time command center for the entire sales operation. Shows live pipeline, lead queue, SLA alerts, and AI-powered next best actions.

### 1.1 Reading the KPI Cards
Four primary KPIs display at the top:
| Card | Meaning |
|------|---------|
| **Active Pipeline** | Total gross nominal value of all open deals |
| **Weighted Forecast** | Pipeline value adjusted by win probability |
| **Open Leads** | Total unqualified demand in the system |
| **SLA Pressure** | Number of leads with SLA deadlines due within 24 hours |

### 1.2 High-Priority Lead Queue
The main table shows leads with high SLA risk:
- **Company Protocol** — lead company name and contact
- **Owner** — assigned sales rep
- **Risk Level** — URGENT / HIGH / MEDIUM / LOW
- **SLA Expiry** — when the SLA deadline expires

Click the **→ arrow** on any row to open the lead detail.

### 1.3 Running an SLA Sweep
1. Click **RUN SLA SWEEP** button above the lead queue.
2. The system re-evaluates all leads against their SLA rules.
3. Dashboard refreshes with updated risk levels.

### 1.4 Using the Search Bar
1. Type a company name, contact name, or owner name in the search bar.
2. The lead queue filters in real time.
3. Clear the search to return to the full queue.

### 1.5 Manual Refresh
1. Click the **Refresh** button (circular arrows, indigo background).
2. All dashboard data re-syncs from the server.
3. Toast: *"Command center synchronized."*

### 1.6 Neural Sales Advisor Panel
On the right side of the dashboard, the **Neural Sales Advisor** shows AI-generated next-best actions:
- Each action card shows **Priority**, **Title**, and **Detail** rationale.
- Click **EXECUTE RECOMMENDATION** on any action card to open the Strategic Expansion Modal for action planning.

### 1.7 Secondary KPI Pulse
Below the Advisor panel:
| Metric | Meaning |
|--------|---------|
| Pending Approvals | Quote/deal approvals awaiting sign-off |
| At-Risk Deals | Deals showing negative signals |
| Open Opportunities | Total active opportunities in Opportunity Vault |

---

## 2. Revenue Matrix (`/core/sales/overview`)

**Purpose:** Historical revenue performance, quota attainment, and period-over-period growth analysis.

### Key Panels
- **Revenue vs. Target Chart** — monthly actuals vs. quota
- **Win Rate Analysis** — % of deals won vs. lost by period
- **Top Performers** — rep-by-rep revenue contribution table
- **Product/Service Mix** — revenue breakdown by product category

### Steps
1. Navigate to **Sales Command → Revenue Matrix**.
2. Select the **Time Period** from the filter bar.
3. Use the **View Toggle** to switch between charts and table views.
4. Click **Export** to download revenue data as CSV or PDF.

---

## 3. Lead Ingestion Desk (`/core/sales/leads`)

**Purpose:** The entry point for all new sales leads. Create, import, qualify, and assign leads.

### 3.1 Creating a New Lead Manually
1. Navigate to **Sales Command → Lead Ingestion**.
2. Click **New Lead**.
3. Fill in:
   - **Company Name**
   - **Contact Name** and **Contact Email**
   - **Phone Number**
   - **Lead Source** (Website, Referral, Cold Call, Social, Event, etc.)
   - **Industry**
   - **Estimated Deal Size**
   - **Priority** (Urgent, High, Medium, Low)
4. Assign an **Owner** (sales rep) from the team dropdown.
5. Set the **SLA Due Date** (when the first contact must be made).
6. Click **Save Lead**.

### 3.2 Importing Leads via CSV
1. Click **Import Leads** in the WorkQueue.
2. Download the **CSV Template** and fill in your lead data.
3. Upload the completed CSV.
4. The system validates the data and shows a preview.
5. Click **Confirm Import**.
6. Imported leads appear in the lead table with status **NEW**.

### 3.3 Qualifying a Lead
1. Open a lead record.
2. Review the lead information.
3. Set the **Qualification Status**:
   - **Qualified** → moves to Pipeline as an Opportunity
   - **Unqualified** → marks the lead as dead with a reason
   - **Nurture** → routes to Marketing's Nurture Hub
4. Click **Save Status**.

### 3.4 Filtering and Sorting Leads
Use the **FilterBar** to filter by:
- **Status**: NEW, ASSIGNED, CONTACTED, QUALIFIED, DISQUALIFIED
- **Owner**: specific sales rep
- **Priority**: Urgent, High, Medium, Low
- **Date range**: when the lead was created

---

## 4. Funnel Matrix — Pipeline Board (`/core/sales/pipeline`)

**Purpose:** Visual pipeline management showing all deals across stages.

### 4.1 Reading the Pipeline Board
The board displays deals organized in columns by stage:
| Stage | Description |
|-------|-------------|
| **Prospect** | Initial contact made |
| **Qualified** | Lead is verified as viable |
| **Proposal** | Quote/proposal sent |
| **Negotiation** | Terms being discussed |
| **Closed Won** | Deal signed |
| **Closed Lost** | Deal did not proceed |

### 4.2 Moving a Deal Between Stages
1. Open a deal card in the pipeline.
2. Click **Move to Next Stage** or select a specific stage from the dropdown.
3. Add a **Stage Change Note** (required for compliance logging).
4. Click **Confirm Move**.

### 4.3 Filtering the Pipeline
- Filter by **Owner**, **Deal Size**, **Close Date**, or **Product/Service**.
- Use the **Stage toggle** to collapse or expand specific columns.

### 4.4 Adding a Note to a Deal
1. Open a deal card.
2. Scroll to the **Activity Stream** section.
3. Type your note and press **Post**.
4. The note is timestamped and attributed to your user.

---

## 5. Opportunity Vault (`/core/sales/opps`)

**Purpose:** Detailed management of individual sales opportunities — activities, stakeholders, documents, and forecasting.

### 5.1 Creating a New Opportunity
1. Navigate to **Sales Command → Opportunity Vault**.
2. Click **New Opportunity**.
3. Fill in:
   - **Opportunity Name** (e.g., "PT. Indofood — ERP Implementation Q3")
   - **Account / Customer**
   - **Lead Source** (if converted from a lead, this is auto-filled)
   - **Estimated Value**
   - **Win Probability %**
   - **Expected Close Date**
   - **Sales Stage**
4. Assign a **Primary Owner** and optionally add **Supporting Reps**.
5. Click **Save Opportunity**.

### 5.2 Logging an Activity
Every interaction with a prospect should be logged:
1. Open the opportunity record.
2. In the **Activity Log** panel, click **Log Activity**.
3. Select type: **Call**, **Email**, **Meeting**, **Demo**, **Proposal Sent**.
4. Enter **Date**, **Duration**, **Summary**, and **Outcome**.
5. Click **Save Activity**.

### 5.3 Attaching a Document
1. Open the opportunity.
2. In the **Documents** panel, click **Attach File**.
3. Upload the document (proposal PDF, NDA, etc.).
4. The document is linked to this opportunity permanently.

### 5.4 Forecasting
The **Forecast Widget** on the opportunity record shows:
- Weighted value = Estimated Value × Win Probability
- This feeds into the Sales Command Dashboard's Weighted Forecast KPI

---

## 6. Quote Studio (`/core/sales/quotes`)

**Purpose:** Create, send, and manage sales quotations.

### 6.1 Creating a Quote
1. Navigate to **Sales Command → Quote Studio**.
2. Click **New Quote**.
3. Fill in:
   - **Linked Opportunity** (auto-fills customer info)
   - **Quote Number** (auto-generated or manual)
   - **Quote Date** and **Valid Until** date
   - **Currency** and **Payment Terms**
4. Add **Line Items**:
   - Product/Service Name
   - Quantity
   - Unit Price
   - Discount %
   - Tax rate
5. The system calculates **Subtotal**, **Tax**, and **Grand Total** automatically.
6. Add **Terms & Conditions** in the notes section.
7. Click **Save Quote** → saves as draft.

### 6.2 Submitting a Quote for Approval
1. Open the draft quote.
2. Click **Submit for Approval** → routes to Sales Manager via FlowGate.
3. Once approved, the status changes to **Approved**.

### 6.3 Sending a Quote to the Customer
1. Open an approved quote.
2. Click **Generate PDF** → creates a professional quote document.
3. Click **Send to Customer** → emails the PDF to the customer contact on the opportunity.
4. Quote status changes to **Sent**.

### 6.4 Customer Acceptance
When a customer accepts:
1. Open the sent quote.
2. Click **Mark as Accepted**.
3. Optionally click **Convert to Sales Order** → creates an order in the system.

---

## 7. Customer 360 (`/core/sales/customers`)

**Purpose:** Complete customer profile — history, interactions, open deals, and financial standing.

### Accessing a Customer Profile
1. Navigate to **Sales Command → Customer 360**.
2. Search by company name or contact name.
3. Click the customer row.

### What You See in Customer 360
- **Overview** — company info, primary contact, credit limit, payment terms
- **Open Opportunities** — all active deals with this customer
- **Quote History** — all quotes sent (won, lost, pending)
- **Order History** — past sales orders and fulfillment status
- **Payment History** — AR status and payment patterns
- **Activity Timeline** — all interactions with this customer

### Logging a Customer Interaction
1. In the **Activity Timeline**, click **Log Interaction**.
2. Select type and enter details.
3. Click **Save**.

---

## 8. Commission Desk (`/core/sales/commissions`)

**Purpose:** Define commission rules and track sales rep earnings.

### 8.1 Viewing Commission Calculations
1. Navigate to **Sales Command → Commission Desk**.
2. Select a **Sales Rep** and **Period** from the filters.
3. The table shows:
   - Deals won in the period
   - Applicable commission rate
   - Commission earned per deal
   - Total commission for the period

### 8.2 Configuring Commission Rules (Manager only)
1. Click **Commission Rules** in the WorkQueue.
2. Click **New Rule**.
3. Set:
   - **Product Category** or **All Products**
   - **Commission Rate %** (e.g., 5%)
   - **Threshold** — minimum deal size to qualify
   - **Effective Date**
4. Click **Save Rule**.

### 8.3 Approving Commission Payout
1. At period end, a commission summary is generated automatically.
2. Click **Submit for Payout Approval** → routes to Finance via FlowGate.
3. Finance approves and processes through PayFlow Hub.

---

## 9. Forecast Desk (`/core/sales/forecast`)

**Purpose:** Sales forecasting with scenario modeling and quota management.

### Reading the Forecast
1. Navigate to **Sales Command → Forecast Desk** (from Revenue Matrix or directly).
2. Select **Month** or **Quarter** view.
3. See:
   - **Best Case** — all open deals close
   - **Commit Forecast** — deals marked as committed by reps
   - **Weighted Forecast** — probability-adjusted pipeline value
   - **Quota** — the target set for the period

### Setting Quotas (Manager only)
1. Click **Set Quota** in the WorkQueue.
2. Select the **Period** and **Sales Rep** (or team).
3. Enter the **Revenue Target**.
4. Click **Save Quota**.

---

## 10. Sales Audit Log (`/core/sales/audit`)

**Purpose:** Complete immutable log of all sales actions.

### Viewing the Audit Log
1. Navigate to **Sales Command → Administration → Sales Audit Log**.
2. Filter by: **Date**, **User**, **Action Type**, **Entity** (Lead, Quote, Opportunity, etc.).
3. Click any row for full event detail.
4. Click **Export** to download as CSV.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Lead doesn't appear after import | Check the CSV format matches the template exactly |
| Quote approval not appearing | Verify Sales Manager is assigned to the FlowGate route |
| Commission not calculated | Ensure the deal is marked as Closed Won with a close date |
| SLA Sweep not updating | Refresh the page after running the sweep |
| Customer 360 shows no history | Customer must be linked to an existing account record |

---

## Best Practices

- ✅ Log every customer interaction in the Activity Log — call notes are key audit evidence.
- ✅ Always set an SLA due date when creating a lead.
- ✅ Run the SLA Sweep daily to identify at-risk leads early.
- ✅ Submit quotes for approval before sending — unapproved quotes are a compliance risk.
- ✅ Keep win probability updated weekly so the Weighted Forecast remains accurate.

---

*Return to [Master Index](./README.md)*
