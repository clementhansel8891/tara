# Zenvix Platform README (Fully Locked, Complete)

## 1. Overview & Vision

**Zenvix** is a **Business Operating System (Business OS)**: modular, multi-tenant, human-centric, AI-assisted, and audit-first.

**Strategic Pillars:**

- **Human-Centric:** Step-by-step wizards mirror real-world workflows.
- **Tenant/Industry Native:** Hierarchy: Company (L1) → Industry Module (L2) → Location (L3).
- **Audit-First:** Immutable, versioned, and traceable actions.
- **Hybrid LAN-First:** Edge-computing ensures local operations continue during cloud outages.
- **AI-Ready:** Predictive routing, anomaly detection, and decision support.

---

## 2. Organizational & Hardware Hierarchy

| Level | Entity           | Responsibilities                                                         |
| ----- | ---------------- | ------------------------------------------------------------------------ |
| L1    | Company (Tenant) | Master Ledger, Global HR, Top-level Security, Subscription Billing       |
| L2    | Industry Module  | Specialized logic extensions activated per Tenant                        |
| L3    | Location         | Physical/logical sites for Employees, Inventory, Devices; LAN edge nodes |

---

## 3. Departmental Workspaces (Core Logic)

### 3.1 Finance Workspace

**Purpose:** Accounting, intercompany transactions, payment reconciliation.

**Workflow Steps & Wizards:**

| Step | Screen                     | Input             | Validation       | Trigger | Approval                  | Logs                           |
| ---- | -------------------------- | ----------------- | ---------------- | ------- | ------------------------- | ------------------------------ |
| 1    | Dashboard → Ledger         | Journal details   | Required fields  | Submit  | Counterparty Finance      | Auto-consolidation + audit log |
| 2    | Dashboard → Reconciliation | Invoice selection | Match amounts    | Submit  | Finance verifies          | Audit log updated              |
| 3    | Dashboard → Budgeting      | Budget request    | Amount threshold | Submit  | HOD/CFO if over threshold | Auto-log                       |

**UI/UX:** Multi-step wizards for journals, reconciliation, and budget requests. Notifications appear for approvals/escalations. Logs panel is visible in real-time.

**Integration:** Procurement invoices, HR payroll, Payment module.

---

### 3.2 Procurement Workspace

**Purpose:** Supplier onboarding, PRs, contracts.

**Workflow Steps & Wizards:**

| Step | Screen                | Input            | Validation        | Trigger | Approval                         | Logs                     |
| ---- | --------------------- | ---------------- | ----------------- | ------- | -------------------------------- | ------------------------ |
| 1    | Dashboard → Suppliers | Supplier info    | Required          | Submit  | Legal → Finance                  | Activation + audit log   |
| 2    | Dashboard → Contracts | Contract details | Attach legal docs | Submit  | Legal → HOD → Supplier + Finance | Logs updated             |
| 3    | Dashboard → PR        | PR details       | Mandatory         | Submit  | Procurement → Finance            | Payment triggered + logs |

**UI/UX:** Wizards for onboarding, contracts, PRs. Approve/Reject/Escalate buttons at every step. Automatic notifications to HOD/Legal/Finance.

**Integration:** Finance, Legal, IT.

---

### 3.3 HR Workspace

**Purpose:** Employee lifecycle, attendance, exit, issue resolution.

**Wizard Steps:**

| Step | Screen                           | Input                 | Validation | Trigger | Approval                       | Logs                                            |
| ---- | -------------------------------- | --------------------- | ---------- | ------- | ------------------------------ | ----------------------------------------------- |
| 1    | Dashboard → Employee → Hire      | Employee info         | Required   | Submit  | HOD                            | IT auto-trigger account creation, payroll setup |
| 2    | Dashboard → Employee → Terminate | Reason, justification | Required   | Submit  | HR + HOD                       | Exit message, document download, audit log      |
| 3    | Dashboard → Issues → Submit      | Issue details         | Required   | Submit  | HR assignment → HOD escalation | Resolution logged                               |

**UI/UX:** Step-by-step wizards for onboarding, exit, issue escalation. Notifications sent automatically at each step. Logs maintained.

**Integration:** IT, Finance, Audit.

---

### 3.4 IT Workspace

**Purpose:** Accounts, devices, network nodes.

**Wizard Steps:**

| Step | Screen                    | Input               | Validation | Trigger           | Approval               | Logs                       |
| ---- | ------------------------- | ------------------- | ---------- | ----------------- | ---------------------- | -------------------------- |
| 1    | Dashboard → Accounts      | Employee/User ID    | Required   | Create/Deactivate | Triggered by HR        | Audit log                  |
| 2    | Dashboard → Devices       | Device_ID, Location | Required   | Assign            | Load balancing applied | Notify Payment module, log |
| 3    | Dashboard → System Health | None                | N/A        | Monitor           | Alert escalation       | Logs                       |

**UI/UX:** Wizards for account provisioning, device mapping, LAN health monitoring. Notifications for failures/escalations.

---

### 3.5 Settings Workspace

**Purpose:** Tenant rules, module configuration, white-labeling.

**Wizard Steps:**

| Step | Screen                       | Input                      | Validation         | Trigger | Approval             | Logs      |
| ---- | ---------------------------- | -------------------------- | ------------------ | ------- | -------------------- | --------- |
| 1    | Dashboard → Global Rules     | Thresholds                 | Numeric validation | Save    | Approval if critical | Logs      |
| 2    | Dashboard → Industry Modules | Select/Activate            | Required           | Submit  | Tenant Manager       | Logs      |
| 3    | Dashboard → White-labeling   | Branding, currency, locale | Required           | Save    | Approval if critical | Audit log |

**UI/UX:** Multi-step configuration wizards, validation on each step, real-time audit logs.

---

### 3.6 Sales Workspace

**Purpose:** Leads, opportunities, sales orders.

**Wizard Steps:**

| Step | Screen                             | Input            | Validation | Trigger | Approval                | Logs      |
| ---- | ---------------------------------- | ---------------- | ---------- | ------- | ----------------------- | --------- |
| 1    | Dashboard → Leads → Create         | Lead info        | Required   | Submit  | HOD if large            | Audit log |
| 2    | Dashboard → Opportunities → Create | Opportunity info | Required   | Submit  | HOD if large            | Logs      |
| 3    | Dashboard → Sales Orders → Create  | Order details    | Required   | Submit  | HOD → Finance invoicing | Logs      |

**UI/UX:** Wizards with multi-step approvals, auto notifications, audit logs.

---

### 3.7 Marketing Workspace

**Purpose:** Campaigns, lead generation, analytics.

**Wizard Steps:**

| Step | Screen                         | Input                    | Validation | Trigger          | Approval                   | Logs |
| ---- | ------------------------------ | ------------------------ | ---------- | ---------------- | -------------------------- | ---- |
| 1    | Dashboard → Campaigns → Create | Campaign info            | Required   | Submit           | HOD                        | Logs |
| 2    | Dashboard → Campaign Execution | Target audience, content | Required   | Execute          | Automatic → Leads to Sales | Logs |
| 3    | Dashboard → Analytics          | None                     | N/A        | View performance | N/A                        | Logs |

---

### 3.8 Admin Workspace

**Purpose:** Centralized departmental requests.

**Wizard Steps:**

| Step | Screen                        | Input           | Validation | Trigger | Approval                | Logs      |
| ---- | ----------------------------- | --------------- | ---------- | ------- | ----------------------- | --------- |
| 1    | Dashboard → Requests → Create | Request details | Required   | Submit  | HOD                     | Logs      |
| 2    | Dashboard → Requests → Assign | Assign dept     | Required   | Submit  | Escalate if no response | Audit log |
| 3    | Dashboard → Requests → Track  | Status          | N/A        | Update  | N/A                     | Logs      |

---

## 4. Supporting Modules

### Payment

- Multi-bank integration, device routing, automated disputes.

**Wizard Steps:**

| Step | Screen                            | Input               | Validation | Trigger | Approval                      | Logs      |
| ---- | --------------------------------- | ------------------- | ---------- | ------- | ----------------------------- | --------- |
| 1    | Dashboard → Transactions → Create | Transaction details | Required   | Submit  | Device mapping → Bank routing | Audit log |
| 2    | Dashboard → Dispute → Review      | Dispute info        | Required   | Submit  | Auto-approval / Escalation    | Logs      |

### Security

- Role-based, context-aware RBAC. Wizards enforce permission assignments, role mapping, and access audits.

### Logs

- Global event store, searchable, filtered by module, user, date.

### Explorer

- Spotlight search across modules, real-time insights, query logs.

### Version Control

- JSON-diffing for all mutations; rollback requires HOD/Admin approval.

### Import/Export

- CSV/JSON/Excel support, field mapping, audit logging.

---

## 5. Technical Infrastructure

- Frontend: Next.js PWA + Dexie.js
- Backend: Node.js (NestJS) + Redis Pub/Sub
- DB: PostgreSQL (RLS) + SQLite/PGLite local sync
- Networking: MQTT/WebSocket hardware comms
- Contextual routing: Device → Location → Company; User → Permissions → Access_Level

---

## 6. Implementation Principles

- Strict multi-tenancy (WHERE company_id = ?)
- Wizard-first UX
- Soft-deletes, immutable audit logs
- Offline LAN-first operation
- IndexedDB session persistence

---

## 7. Directory Structure

```Text

zenvix/
├── core/
│ ├── finance/
│ ├── procurement/
│ ├── hr/
│ ├── it/
│ ├── settings/
│ ├── sales/
│ ├── marketing/
│ └── admin/
├── industries/
├── support/
│ ├── payment/
│ ├── sync-engine/
│ ├── security/
│ ├── version-control/
│ └── explorer/
└── gateway/
```
