# Procurement Command — User Manual

> **Department:** Procurement & Strategic Sourcing  
> **Workspace:** Procurement Command — Strategic Sourcing & Supply Chain Integrity Matrix  
> **URL Base:** `/core/procurement`

---

## Role Access

| Role | Insights | Suppliers | Contracts | Requisitions | PO Release | Risk Matrix | Admin |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Owner / Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Procurement Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Procurement Officer | 👁 | ✅ | 👁 | ✅ | ✅ | 👁 | ❌ |
| Dept Requestor | ❌ | ❌ | ❌ | ✅ Submit | ❌ | ❌ | ❌ |
| Finance | 👁 | ❌ | 👁 | 👁 | ✅ Approve | ❌ | ❌ |

---

## Sidebar Navigation

```
Procurement Command
├── INTELLIGENCE
│   ├── Procurement Command   (/core/procurement/insights)
│   └── Risk Matrix           (/core/procurement/risk)
├── SOURCING
│   ├── Supplier Desk         (/core/procurement/suppliers)
│   ├── Contract Vault        (/core/procurement/contracts)
│   └── Portal Inbox          (/core/procurement/portal)
├── FULFILLMENT
│   ├── Requisition Queue     (/core/procurement/prs)
│   └── PO Release Hub        (/core/procurement/po-release)
└── GOVERNANCE
    ├── Workflow              (/core/workflow?scope=Procurement)
    ├── Staff Schedule        (/core/procurement/schedule)
    └── Administration        (/core/procurement/admin)
```

---

## 1. Procurement Command Dashboard (`/core/procurement/insights`)

**Purpose:** Real-time procurement intelligence — spend analytics, vendor performance, and operational KPIs.

### Reading the Dashboard
1. Navigate to **Procurement Command**.
2. The dashboard shows:
   - **Total Spend (Month)** — total value of POs issued this month
   - **Open Purchase Requests** — PRs awaiting approval or PO conversion
   - **Pending PO Receipts** — POs sent to vendors but not yet received by Inventory
   - **Supplier Count** — total active suppliers in the master list
   - **Avg. Lead Time** — average delivery time across all active suppliers
   - **Contract Expiry Alerts** — contracts expiring within 60 days

### Using Quick Links
- **New PR** → opens Requisition Queue
- **Add Supplier** → opens Supplier Desk
- **View Risk** → opens Risk Matrix

---

## 2. Risk Matrix (`/core/procurement/risk`)

**Purpose:** Monitors and scores supplier and supply chain risks — financial stability, compliance, delivery reliability, and geopolitical exposure.

### Reading the Risk Matrix
1. Navigate to **Procurement Command → Risk Matrix**.
2. Suppliers are listed with their **Risk Tier**:
   - 🟢 **LOW** — stable, high-performing suppliers
   - 🟡 **MEDIUM** — some risk factors present — monitor
   - 🔴 **HIGH** — significant risk — consider alternative sourcing
   - ⚫ **CRITICAL** — immediate escalation required

### Risk Scoring Factors
| Factor | Weight | Description |
|--------|--------|-------------|
| Delivery Performance | 30% | On-time delivery rate over last 12 months |
| Financial Stability | 25% | Credit rating and financial health |
| Compliance Status | 20% | Tax, legal, and regulatory compliance |
| Quality Rating | 15% | Defect rate and quality control pass rate |
| Geographic Risk | 10% | Political or logistical stability of supplier's location |

### Acting on a High-Risk Supplier
1. Click the high-risk supplier row.
2. Review the risk breakdown panel.
3. Actions available:
   - **Request Risk Review** → creates a FlowGate escalation to Procurement Manager
   - **Place on Watch List** → adds to monitoring queue for weekly review
   - **Initiate Alternative Sourcing** → opens Supplier Desk to find alternatives
   - **Suspend Supplier** → halts new POs to this supplier pending investigation

---

## 3. Supplier Desk (`/core/procurement/suppliers`)

**Purpose:** The central supplier master — onboard, manage, and track all vendor relationships.

### 3.1 Adding a Supplier Master
A **Supplier Master** is the global identity of a vendor. Create this first before adding branches.

1. Navigate to **Procurement Command → Supplier Desk**.
2. Click **Add Supplier Master**.
3. A dialog opens with two panels (Info + Form):

**Required Fields:**
| Field | Description |
|-------|-------------|
| Official Supplier Name | Legal registered name (e.g., "PT. Nusantara Tech Hub") |
| Tax ID (NPWP) | Tax registration number (e.g., 01.234.567.8-091.000) |
| Website | Company website URL |
| Person in Charge | Primary contact full name |
| Contact Email | Official billing/procurement email |
| Contact Phone | Direct contact number |
| HQ Address | Registered headquarters address |
| Product Categories | Comma-separated categories (e.g., "Electronics, Machinery") |

4. Click **Create and Route** → saves and triggers automatic compliance vetting.
5. A success alert: *"Supplier Master '[Name]' created and routed for compliance vetting."*

> **Note:** Tax IDs (NPWP/VAT) are verified against official records before the supplier's status changes to APPROVED.

### 3.2 Adding a Supplier Branch
A **Branch** is a regional fulfillment location under a Supplier Master. Branches track local lead times and contacts.

1. Click **Add Branch** in the WorkQueue.
2. Select the **Parent Supplier** from the dropdown.
3. Fill in:
   - **Branch Code** (e.g., JKT-01 for Jakarta branch 1)
   - **Branch Nickname** (e.g., "Surabaya East Hub")
   - **Full Fulfillment Address**
   - **Lead Time (Days)** — standard delivery time from this location
   - **Location City**
   - **Local Contact Name**, **Phone**, and **Email**
4. Click **Confirm Addition**.

### 3.3 Managing Supplier Categories
Categories improve recommendation accuracy when raising PRs.
1. Click **Manage Categories** in the WorkQueue.
2. In the Category Management dialog:
   - **Add New Category**: enter Name and optional Description → click **Create Category**
   - **Delete a Category**: hover over an existing category → click the trash icon
3. Categories are available when creating supplier masters.

### 3.4 Viewing a Supplier Profile
1. Click any supplier row in the **Supplier Master** table.
2. The **Supplier Profile Modal** opens showing:
   - Compliance Status (PENDING / APPROVED / REJECTED)
   - Platform Rating (0–100)
   - Risk Tier (LOW / MEDIUM / HIGH / CRITICAL)
   - Product Categories
   - Contact Profile (Rep, Email, Website)

### 3.5 Viewing a Branch Profile
1. Click any branch row in the **Supplier Branch Profiles** table.
2. The **Branch Detail Modal** opens showing:
   - Branch Code and Nickname
   - Full Fulfillment Address
   - Standard Lead Time
   - Local Quality Rating (0–100)
   - Local Contact details

### 3.6 Using the Recommendation Engine
The Recommendation Engine suggests the best supplier branch for a given category and location:
1. In the **Recommendation Engine** panel, select:
   - **Branch Code** (the requesting location, e.g., JKT for Jakarta)
   - **Category** (product category needed, e.g., "Machinery")
2. The table updates with ranked supplier recommendations showing:
   - Supplier Name, Branch, Score, Risk Tier, Unit Price, Lead Time
3. Click a recommendation to open the full supplier profile.

---

## 4. Contract Vault (`/core/procurement/contracts`)

**Purpose:** Full lifecycle management of supplier contracts — drafting, approvals, renewals, and archiving.

### 4.1 Creating a New Contract
1. Navigate to **Procurement Command → Contract Vault**.
2. Click **New Contract**.
3. Fill in:
   - **Contract Title** (e.g., "Annual Supply Agreement — PT. XYZ 2026")
   - **Supplier** (linked from Supplier Master)
   - **Contract Type**: Framework Agreement, Supply Agreement, Service Level Agreement (SLA), NDA, etc.
   - **Start Date** and **End Date**
   - **Contract Value** (total or annual value)
   - **Payment Terms** (Net 30, Net 60, Advance, etc.)
   - **Key Terms** (summary of obligations)
4. Upload the **Contract Document** (signed PDF or Word file).
5. Click **Save Contract** → saves as draft.
6. Click **Submit for Approval** → routes to Procurement Manager and Legal via FlowGate.

### 4.2 Contract Expiry Alerts
- Contracts expiring within **60 days** appear with a 🟡 yellow alert.
- Contracts expiring within **30 days** appear with a 🔴 red alert.
- Click **Initiate Renewal** to start the contract renewal workflow.

### 4.3 Renewing a Contract
1. Open an expiring contract.
2. Click **Initiate Renewal**.
3. Update the **New End Date** and any changed terms.
4. Upload the revised contract document.
5. Click **Submit Renewal for Approval**.

### 4.4 Archiving a Contract
1. Open an expired or terminated contract.
2. Click **Archive Contract**.
3. Confirm the archive — the contract is stored in read-only mode.

---

## 5. Portal Inbox (`/core/procurement/portal`)

**Purpose:** Supplier communication portal — incoming quotes, bid submissions, queries, and notifications from suppliers.

### Reading the Portal Inbox
1. Navigate to **Procurement Command → Portal Inbox**.
2. Incoming supplier communications appear in a list:
   - **Quote Submission** — supplier responding to a Request for Quotation (RFQ)
   - **Delivery Notification** — supplier confirming a shipment
   - **Invoice Submission** — supplier sending an invoice for a PO
   - **Query** — supplier asking a question about a PO or contract
3. Click any item to open the communication thread.

### Responding to a Supplier Query
1. Open the query item.
2. Read the supplier's message.
3. Click **Reply**.
4. Type your response.
5. Click **Send** — the supplier receives the reply via their portal access.

### Processing a Quote Submission
1. Open the quote submission.
2. Review the supplier's pricing and terms.
3. Compare to other submitted quotes (if multiple bidders).
4. Click **Accept Quote** → converts to a Purchase Order.
5. Or **Reject Quote** with a reason → supplier is notified.

---

## 6. Requisition Queue — Purchase Request Desk (`/core/procurement/prs`)

**Purpose:** The entry point for all internal purchasing requests. Department staff submit Purchase Requests (PRs) here; Procurement converts approved PRs into Purchase Orders (POs).

### 6.1 Creating a Purchase Request (PR)
Any department staff member can submit a PR:
1. Navigate to **Procurement Command → Requisition Queue**.
2. Click **New Purchase Request**.
3. Fill in:
   - **Requesting Department** (your department)
   - **Required By Date** (when you need the items)
   - **Priority**: Normal, Urgent, Emergency
   - **Justification / Business Reason** (explain why this purchase is needed)
4. Add **Line Items**:
   - Item Description
   - Quantity Required
   - Estimated Unit Price (if known)
   - Preferred Supplier (optional — Procurement may change this)
5. Attach any supporting documents (e.g., vendor quote, specification sheet).
6. Click **Submit PR** → routes to Department Head for first approval, then to Procurement Manager.

### 6.2 Approval Flow for PRs
| Step | Approver | Action |
|------|----------|--------|
| 1 | Department Head | Reviews justification — Approve or Reject |
| 2 | Procurement Manager | Reviews sourcing — Approve, Reject, or Modify |
| 3 (if above threshold) | Finance Manager | Reviews budget — Approve or Reject |

### 6.3 Tracking Your PR Status
1. Navigate to **Requisition Queue**.
2. Filter by **Your Department** or **Submitted by Me**.
3. Status column shows:
   - **Draft** — saved but not submitted
   - **Pending Approval** — waiting for Department Head or Procurement
   - **Approved** — approved and ready to convert to PO
   - **Rejected** — see rejection reason in the comments
   - **Converted to PO** — a Purchase Order has been created

### 6.4 Converting an Approved PR to a Purchase Order
Procurement Officer actions after PR approval:
1. Open the approved PR.
2. Click **Convert to PO**.
3. Review the line items and quantities.
4. Select the **Supplier** for each line item (using Recommendation Engine if needed).
5. Set the **Delivery Location** (which warehouse/store to receive at).
6. Confirm the **Expected Delivery Date**.
7. Click **Generate PO** → the PO is created and sent to the PO Release Hub.

---

## 7. PO Release Hub (`/core/procurement/po-release`)

**Purpose:** Final review and release of Purchase Orders to suppliers.

### 7.1 Reviewing a PO Before Release
1. Navigate to **Procurement Command → PO Release Hub**.
2. All approved POs pending release are listed.
3. Click a PO to open the full detail:
   - Supplier and branch details
   - All line items with quantities and prices
   - Delivery address and expected date
   - Payment terms
4. Verify all details are correct.

### 7.2 Releasing a PO to a Supplier
1. Click **Release PO** on an approved PO.
2. A confirmation dialog appears.
3. Click **Confirm Release**.
4. The PO is sent to the supplier via:
   - **Portal Inbox** — if the supplier has portal access
   - **Email** — the contact email on the supplier's branch profile
5. PO status changes to **Released**.

### 7.3 Cancelling a PO
1. Open a released PO (only before the supplier acknowledges).
2. Click **Cancel PO**.
3. Enter the **Cancellation Reason**.
4. Click **Confirm Cancellation**.
5. The supplier is notified and the PR is reverted to **Approved** status for re-processing.

### 7.4 Tracking PO Status
| Status | Meaning |
|--------|---------|
| Draft | PO created but not yet approved |
| Pending Approval | Awaiting Finance sign-off (above threshold) |
| Approved | Ready to release |
| Released | Sent to supplier |
| Acknowledged | Supplier confirmed receipt |
| Partially Received | Some items received by Inventory |
| Fully Received | All items received and GRN posted |
| Closed | Fully settled and archived |

### 7.5 PO Receiving Status
After releasing, monitor the PO in the **PO Release Hub**:
- Click any Released PO to view its **Receiving Progress**.
- When Inventory posts a GRN against this PO, the quantities are reflected here.
- When all quantities are received, click **Mark as Fully Received** → closes the PO.

---

## 8. Workflow — FlowGate (`/core/workflow?scope=Procurement`)

**Purpose:** Procurement's approval inbox — review and action all pending procurement requests.

### Approving a PR or PO
1. Navigate to **Workflow → FlowGate** (scoped to Procurement).
2. All pending requests are listed.
3. Click any item to open the full detail.
4. Review the justification, line items, and supporting documents.
5. Click **Approve**, **Reject**, or **Modify**.
6. Add a comment explaining your decision.
7. The requester is notified instantly.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Supplier not appearing in PR dropdown | The supplier may not be approved yet — check Supplier Desk |
| PR not moving to PO | All approval steps must be completed — check FlowGate |
| Contract not showing expiry alert | Verify the End Date is correctly entered in the contract record |
| PO not received by supplier | Check the supplier's portal inbox or verify their email in Branch Profile |
| Risk score not updating | Risk scores refresh nightly — check the last update timestamp |

---

## Best Practices

- ✅ Always create a Supplier Master before raising a PR with a specific vendor.
- ✅ Use the Recommendation Engine to identify the best supplier-branch combination for each category.
- ✅ Never release a PO without Finance approval for purchases above the threshold.
- ✅ Monitor contract expiry dates monthly — renew at least 45 days before expiry.
- ✅ Review the Risk Matrix weekly — HIGH and CRITICAL tier suppliers require active management.

---

*Return to [Master Index](./README.md)*
