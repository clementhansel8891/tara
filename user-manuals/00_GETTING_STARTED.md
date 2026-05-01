# Getting Started — Zenvix Business Flow Suite

> **Audience:** All users, new starters, and administrators  
> **Purpose:** Understand the platform fundamentals before using any department workspace

---

## 1. What is Zenvix Business Flow Suite?

Zenvix Business Flow Suite (BFS) is a **multi-department, multi-tenant enterprise operations platform**. It consolidates Finance, HR, Sales, Inventory, Marketing, Procurement, and IT into a single unified workspace.

Every department operates in its own **command workspace** — with its own sidebar navigation, tools, and data scope — while sharing a common approval engine, audit system, and user identity layer.

---

## 2. Logging In

### Step-by-Step Login
1. Open your browser and navigate to the Zenvix URL provided by your IT administrator.
2. On the **Login** page, enter your work **email address** and **password**.
3. Click **Sign In**.
4. If your account is new or your company has not been set up yet, you will be redirected to the **Onboarding Wizard**.

### First-Time Onboarding (Company Setup)
1. After logging in for the first time, you will be directed to `/auth/onboarding`.
2. Fill in your **Company Name**, **Industry**, **Address**, and **Number of Employees**.
3. Use the **Address Search** field — it auto-suggests and fills the address using map lookup.
4. Click **Complete Setup** to provision your tenant.
5. You will be redirected to the **Core Dashboard** after provisioning.

> **Note:** Only the first registered user (Owner) goes through onboarding. All subsequent users are invited and assigned roles by the administrator.

---

## 3. Understanding the Core Layout

Once logged in, you will see the **Core Layout**, which has three main zones:

```
┌────────────────────────────────────────────────────────────────┐
│  TOP BAR: Zenvix Logo | Global Search | Notifications | User  │
├──────────────┬─────────────────────────────────────────────────┤
│              │                                                  │
│  SIDEBAR     │   MAIN CONTENT AREA                             │
│  (300px)     │   (Active Department Page)                      │
│              │                                                  │
│  Navigation  │                                                  │
│  Sections    │                                                  │
│              │                                                  │
└──────────────┴─────────────────────────────────────────────────┘
```

### Top Bar Elements
| Element | Purpose |
|---------|---------|
| Zenvix Logo | Returns to Core Dashboard |
| Global Search | Search across all departments |
| Notifications Bell | Real-time system alerts |
| User Avatar | Profile, settings, logout |

### Sidebar Navigation
The sidebar lists all departments you have access to. Each department has its own sub-navigation when you click into it.

- **Intelligence** sections — dashboards and analytics views
- **Operations** sections — day-to-day transactional tools
- **Governance** sections — approvals, audit, and administration

---

## 4. Navigating Between Departments

### From the Core Dashboard
1. Click **Core Dashboard** (`/core/dashboard`) from any page via the logo or breadcrumb.
2. Use the **department cards** to jump directly into Finance, HR, Sales, etc.

### From the Sidebar
1. The sidebar shows a section for each department you're licensed for.
2. Click a department name to expand its sub-navigation.
3. Click a sub-item (e.g., **Money Desk**) to go directly to that tool.

### Using the URL Directly
Each department and tool has a fixed URL. For example:
- `/core/finance` — Finance CFO Dashboard
- `/core/hr/people` — HR People Core
- `/core/sales/leads` — Sales Lead Ingestion

---

## 5. Role-Based Access Control (RBAC)

Your access to tools and data is determined by your **role** assigned by your administrator.

| Access Level | What You Can Do |
|---|---|
| **Owner / Company Admin** | Full access to all departments and settings |
| **Department Manager** | Full access to your own department, limited view of others |
| **Staff** | Access only to tools relevant to your role (e.g., self-service HR) |

> **If you see an "Unauthorized" page:** Contact your IT administrator or HR admin to update your role permissions.

---

## 6. The FlowGate — Cross-Department Approval System

**FlowGate** is the central approval engine of Zenvix. Any action that requires sign-off from another person or department is routed through FlowGate.

### How Approvals Work
1. A user initiates an action (e.g., "Request Leave", "Submit Purchase Requisition").
2. The system creates a **workflow request** and routes it to the destination department's inbox.
3. An approver in that department sees it in their **FlowGate** or **Workflow Inbox**.
4. The approver clicks **Approve**, **Reject**, or **Request Modification**.
5. The originating user receives a notification with the outcome.

### Checking Your Workflow Inbox
1. Navigate to **Core → Workflow Inbox** (`/core/workflow`).
2. All pending approvals assigned to you or your department appear here.
3. Filter by **scope** (HR, Finance, Sales, etc.) to narrow results.
4. Click any item to review details and take action.

---

## 7. Notifications

Real-time notifications appear in the **bell icon** in the top bar.

| Notification Type | Trigger |
|---|---|
| Approval Required | A workflow request has been assigned to you |
| Approval Decision | Your request was approved or rejected |
| System Alert | A compliance or data integrity warning |
| Info | General platform updates |

Click a notification to navigate directly to the relevant record.

---

## 8. Audit Trail

Every significant action in Zenvix is **automatically logged** to an immutable audit trail. You cannot delete audit entries.

- Who performed the action
- What was changed (before/after)
- When it happened (timestamp)
- Which department and tenant it belongs to

Audit logs are accessible in each department's **Audit Vault** section.

---

## 9. Common UI Patterns

Every department workspace follows the same UI patterns:

### WorkQueue
A row of action buttons at the top of a record page. Example buttons:
- **New Request** — initiates a FlowGate workflow
- **Edit Profile** — opens an edit panel
- **Escalate** — routes to another department
- **Export** — generates a downloadable report

### FilterBar
A search and filter strip above data tables:
1. Type in the **Search** box to filter by name, code, or ID.
2. Use **dropdown filters** to narrow by status, department, or date range.
3. Click **Reset** to clear all filters.

### DataTableShell
All data tables show:
- **Total count** in the top right
- **Pagination** controls at the bottom
- **Row click** → opens a detail panel or modal

### FeedbackAlert
After any action, a **green success alert** or **red error alert** appears at the top of the page. Click the ✕ to dismiss it.

---

## 10. Logging Out

1. Click your **User Avatar** in the top-right corner.
2. Select **Log Out**.
3. You will be redirected to the Login page.

> **Security tip:** Always log out when using a shared computer.

---

## 11. Getting Help

- Check the relevant **department manual** in this folder.
- Contact your **IT Administrator** for access issues.
- Contact your **HR Admin** for user account issues.
- For system errors, check the browser console or contact your system vendor.

---

*Next: Choose your department manual from the [Master Index](./README.md)*
