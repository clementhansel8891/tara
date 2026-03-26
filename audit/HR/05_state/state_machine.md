# HR State Machine

## 1. Employee Lifecycle
The primary state machine for human capital records.

```mermaid
stateDiagram-v2
    [*] --> probation: Create (Hire)
    probation --> active: Automatic/Manual Confirmation
    probation --> terminated: Failure to pass
    active --> suspended: Disciplinary/Admin Action
    suspended --> active: Reinstatement
    active --> terminated: Resignation/Termination
    terminated --> active: Re-hire workflow
```

## 2. Payroll Run Status
Tracks the state of a financial payout batch.

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Initialize Batch
    DRAFT --> PENDING: Submit for Approval
    PENDING --> DRAFT: Reject/Return to Edit
    PENDING --> APPROVED: Final Managerial Check
    APPROVED --> [*]: Disbursed/Archived
```

## 3. Leave Request Status
```mermaid
stateDiagram-v2
    [*] --> PENDING: Created by Employee
    PENDING --> APPROVED: Manager Approval
    PENDING --> REJECTED: Manager Rejection
    APPROVED --> CANCELLED: Retract before date
    REJECTED --> [*]
```
