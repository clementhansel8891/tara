# Admin Workspace — User Manual

> **Department:** Administration  
> **Workspace:** Admin Workspace — Centralized Departmental Requests with Routing and Audit  
> **URL Base:** `/core/admin`

---

## Role Access

| Role | Create/Intake | Assign | Track |
|------|:---:|:---:|:---:|
| Owner / Company Admin | ✅ | ✅ | ✅ |
| Department Head | ✅ | 👁 | ✅ |
| Any Staff Member | ✅ Submit | ❌ | 👁 Own |

---

## What is the Admin Workspace?

The **Admin Workspace** is the cross-department request hub. It is the central routing system for requests that:

- Require administrative sign-off or processing
- Involve multiple departments
- Do not clearly belong to a single department's own FlowGate
- Require a documented audit trail accessible by management

**Common uses include:**
- Office supply requisitions
- Facility and maintenance requests
- Visitor access requests
- Petty cash claims
- General management approvals
- Document notarization or authentication requests
- Inter-department coordination items

---

## Sidebar Navigation

```
Admin Workspace
├── REQUESTS
│   └── Create/Intake     (/core/admin/requests)
├── ASSIGNMENT
│   └── Assign            (/core/admin/assign)
└── TRACKING
    └── Track             (/core/admin/track)
```

---

## 1. Create / Intake (`/core/admin/requests`)

**Purpose:** Submit a new administrative request. Any team member can use this to raise an administrative need or escalation.

### 1.1 Submitting a New Request

1. Navigate to **Admin Workspace → Create/Intake**.
2. Click **New Request**.
3. Fill in the **Request Form**:

| Field | Description |
|-------|-------------|
| **Request Title** | A short, descriptive name (e.g., "Office Chair Replacement — Marketing Dept") |
| **Request Type** | Category of the request (see list below) |
| **Priority** | Normal, Urgent, or Emergency |
| **Requester Department** | Your department (auto-filled from your session) |
| **Target Department** | Who should handle this request (Admin, HR, IT, Finance, etc.) |
| **Description** | Full explanation of what is needed and why |
| **Due Date** | When you need the request resolved by (if applicable) |
| **Supporting Documents** | Attach any receipts, quotations, or reference documents |

4. Click **Submit Request**.
5. A confirmation appears: *"Request [#ID] submitted successfully."*
6. You can track the status under **Tracking**.

### 1.2 Request Types

| Type | Use Case |
|------|---------|
| **Facility & Maintenance** | Broken equipment, HVAC issues, electrical repairs, cleaning |
| **Office Supplies** | Stationery, consumables, small items under expense threshold |
| **Petty Cash Claim** | Reimbursement for out-of-pocket expenses with receipts |
| **Visitor Access** | Register a visitor for building access credentials |
| **Document Request** | Request for certified copies, notarization, or letter issuance |
| **IT Support Request** | Hardware, software, or account issues (also handled in IT Command) |
| **HR Administrative** | Items that don't fit HR's direct workflow (e.g., letter requests) |
| **Inter-Department Coordination** | Joint activities requiring multiple department sign-offs |
| **General Approval** | Any management approval that doesn't fit the above categories |

### 1.3 Attaching Supporting Documents
1. In the Request Form, scroll to **Supporting Documents**.
2. Click **Upload File** — accepts PDF, Word, Excel, JPG, PNG.
3. Add a **Document Title** for each file.
4. Repeat for additional files.
5. All attached files are stored and accessible by assignees.

### 1.4 Submitting a Petty Cash Claim
For reimbursement of cash expenses:
1. Select **Request Type: Petty Cash Claim**.
2. Enter the **Claim Amount**.
3. Attach the **Original Receipt** as a photo/scan.
4. Add the **Purchase Description** and **Business Justification**.
5. Enter the **Purchase Date**.
6. Submit. The request routes to your Department Head for approval, then to Finance for reimbursement.

---

## 2. Assign (`/core/admin/assign`)

**Purpose:** Admin staff and managers route incoming requests to the right team member for resolution.

> **Access:** This section is restricted to Admin staff, Department Heads, and Management. Regular staff can only view, not assign.

### 2.1 Viewing Unassigned Requests
1. Navigate to **Admin Workspace → Assign**.
2. The **Unassigned Queue** shows all requests pending assignment.
3. Requests are sorted by:
   - **Priority** (Emergency first, then Urgent, then Normal)
   - **Submission Date** (oldest first within same priority)

### 2.2 Assigning a Request to a Team Member
1. Click any unassigned request to open its detail.
2. Review the full description and any attached documents.
3. Click **Assign Request**.
4. In the assignment dialog:
   - Select the **Assignee** (team member who will handle it) from the dropdown.
   - Set an **Expected Resolution Date**.
   - Add optional **Assignment Notes** (instructions for the assignee).
5. Click **Confirm Assignment**.
6. The assignee receives a notification.
7. The request status changes from **Unassigned** to **Assigned**.

### 2.3 Re-assigning a Request
If the original assignee cannot handle the request:
1. Open the assigned request.
2. Click **Re-assign**.
3. Select the new assignee.
4. Enter the **Reason for Re-assignment**.
5. Click **Confirm Re-assignment**.
6. Both the original assignee and new assignee are notified.

### 2.4 Bulk Assignment
For assigning multiple requests at once:
1. In the Assign page, use checkboxes to select multiple requests.
2. Click **Bulk Assign**.
3. Select the assignee and expected resolution date.
4. Click **Assign All Selected**.

### 2.5 Escalating a Request
If a request requires management attention before assignment:
1. Open the request.
2. Click **Escalate**.
3. Select the escalation target (e.g., Department Head, Company Admin).
4. Add escalation notes.
5. Click **Submit Escalation** → creates a FlowGate approval route.

---

## 3. Track (`/core/admin/track`)

**Purpose:** Monitor the status of all requests — submitted, assigned, in progress, and resolved.

### 3.1 Viewing Your Submitted Requests
1. Navigate to **Admin Workspace → Track**.
2. The **My Requests** panel shows all requests you personally submitted.
3. Each request shows its current status:

| Status | Meaning |
|--------|---------|
| **Submitted** | Request received, not yet assigned |
| **Assigned** | Assigned to a team member — awaiting work |
| **In Progress** | Assignee is actively working on it |
| **Pending Information** | Assignee needs more info from you |
| **Escalated** | Routed to management for higher-level approval |
| **Resolved** | Completed — check resolution notes |
| **Closed** | Archived |
| **Rejected** | Request was declined — see rejection reason |

### 3.2 Filtering the Request List
Use the **FilterBar** at the top of the Track page:
- **Status Filter**: Show only Submitted, In Progress, Resolved, etc.
- **Date Range**: Requests submitted within a specific period
- **Request Type**: Filter by Facility, Petty Cash, IT, etc.
- **Priority**: Show only Urgent or Emergency requests

### 3.3 Viewing Request Details
1. Click any request row to open the detail panel.
2. You can see:
   - Full description and all attached documents
   - Assignee name and expected resolution date
   - **Activity Log** — every action taken on this request with timestamps
   - **Comments** — messages between you and the assignee

### 3.4 Adding a Comment to a Request
If the assignee sends a "Pending Information" status and needs clarification:
1. Open the request detail.
2. Scroll to the **Comments** section.
3. Type your response or additional information.
4. Click **Post Comment**.
5. The assignee is notified.

### 3.5 Confirming a Resolution
When a request is marked Resolved:
1. You receive a notification.
2. Open the request.
3. Review the resolution notes from the assignee.
4. If satisfied: Click **Confirm Resolution** → closes the request.
5. If not satisfied: Click **Reopen Request** with a reason why it's not complete.

### 3.6 Viewing All Department Requests (Manager View)
Department Heads and Admins can see requests across their team:
1. In the Track page, use the **Scope Toggle** to switch from "My Requests" to "Department Requests".
2. All requests from your department are listed.
3. Filter and sort as needed.

---

## 4. Audit Trail

Every action in the Admin Workspace is automatically logged:
- Who submitted the request
- Who assigned it and when
- All comments added
- Status changes with timestamps
- Who resolved it and how

To view the full audit trail for any request:
1. Open the request detail.
2. Scroll to the **Activity Log** section.
3. All events are listed in chronological order.

Admins and managers can also view the global audit trail:
1. Navigate to **Admin Workspace → Administration** (if you have admin access).
2. All request audit events across the entire company are visible.
3. Filter by date, user, or request type.
4. Export as CSV for compliance reporting.

---

## Common Workflows

### Workflow 1: Requesting Office Supplies
1. **You (Staff)**: Submit a request via **Create/Intake** → Type: Office Supplies, list items needed, attach any vendor quote.
2. **Admin**: Sees request in **Assign** → assigns to Office Admin.
3. **Office Admin**: Purchases items, marks request as Resolved with receipt attached.
4. **You**: Receive notification → confirm resolution in **Track**.

### Workflow 2: Petty Cash Reimbursement
1. **You**: Submit via **Create/Intake** → Type: Petty Cash Claim, enter amount, attach receipt photo.
2. **Dept Head**: Approves via FlowGate notification.
3. **Finance Staff**: Processes reimbursement via PayFlow Hub → marks resolved.
4. **You**: Receive reimbursement → confirm in Track.

### Workflow 3: IT Support Request via Admin
1. **You**: Submit via **Create/Intake** → Type: IT Support Request, describe the problem.
2. **Admin**: Routes to IT department via **Assign**.
3. **IT Staff**: Resolves the issue in IT Command, marks request as Resolved.
4. **You**: Confirm resolution.

### Workflow 4: Facility Maintenance
1. **You**: Submit → Type: Facility & Maintenance, describe the issue with photo attachment.
2. **Facilities Manager**: Assigns to maintenance technician.
3. **Technician**: Completes repair → marks as Resolved with completion note.
4. **You**: Confirm resolution.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Request not appearing after submission | Refresh the Track page — may take a moment to sync |
| Cannot find the assignee in the dropdown | The user may not be active — contact IT to check their account status |
| Request stuck in "Assigned" for too long | Use the **Escalate** button to flag it for management attention |
| Attached file won't upload | Check file size (max 10MB) and file type |
| Received "Pending Information" but don't know what's needed | Open the request → read the assignee's comment in the Comments section |
| Request was rejected unfairly | Add a comment explaining your case → or contact your Department Head |

---

## Best Practices

- ✅ **Be specific in your request title** — "Broken Chair Arm — Finance Room 3" is better than "Chair issue".
- ✅ **Always attach supporting documents** — receipts, photos, or quotes speed up resolution.
- ✅ **Set a realistic Due Date** — Emergency priority should only be used for genuine emergencies.
- ✅ **Check Track regularly** — respond promptly when an assignee marks you as "Pending Information".
- ✅ **Confirm resolutions promptly** — resolved requests left unconfirmed for 7 days are auto-closed.
- ✅ **Use the Admin Workspace for administrative items** — operational requests (e.g., leave applications, PR submissions) belong in their respective department workspaces.

---

*Return to [Master Index](./README.md)*
