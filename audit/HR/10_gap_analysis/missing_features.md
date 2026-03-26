# HR Missing Features

## 1. Automated Offboarding
- **Gap**: No "Offboarding Workflow" engine.
- **Risk**: Terminated employees may retain access to 3rd party tools or physical assets if the manual checklist is forgotten.

## 2. Advanced Leave Accrual Logic
- **Gap**: Currently, leave requests are flat. There is no automated policy engine to calculate "Accrued" vs "Used" balance based on seniority or contract type.
- **Risk**: Over-utilization of leave and financial liability at termination.

## 3. Disciplinary Tracking (Incident Log)
- **Gap**: The `HRCase` system is used for payroll, but there is no dedicated "Disciplinary Case" management with attachment support and restricted access.

## 4. Multi-Level Approvals
- **Gap**: Most workflows (Leave, Raise) are 1-step manager approval. No support for parallel or sequential multi-manager approval chains.

## 5. Employee Self-Service (ESS) Profile
- **Gap**: No endpoint for an employee to update their own contact details (Address, Emergency Contact) with an approval workflow.
