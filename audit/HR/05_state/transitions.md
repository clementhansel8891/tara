# HR Transitions

## Valid Transitions Table

| Entity | Current State | Target State | Triggering CLI/API |
|--------|---------------|--------------|-------------------|
| Employee| `active` | `suspended` | `PATCH /employees/:id/suspend` |
| Employee| `active` | `terminated` | `DELETE /employees/:id` |
| Payroll | `DRAFT` | `PENDING` | `PATCH /payroll-runs/:id/submit` |
| Payroll | `PENDING` | `APPROVED` | `PATCH /payroll-runs/:id/approve` |
| Leave | `PENDING` | `APPROVED` | `PUT /leave-requests/:id/approve` |

## Conditional Transitions
- **Candidate to Employee**: Triggered by `POST /candidates/:id/hire`. Internal logic converts `Candidate.status=HIRED` and creates `Employee.status=probation`.
- **Termination to Re-hire**: Not explicitly handled by a single transition; requires a new `Hire` command for a previously terminated `userId`.

## Event Propagation
Every transition MUST publish an event to the `EventBus` to notify downstream consumers (e.g., IT for account lockout, Finance for final pay).
- **Success Rate**: **HIGH**. All command handlers implement consistent event publishing.
