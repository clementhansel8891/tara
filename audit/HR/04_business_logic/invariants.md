# HR Invariants

## 1. Multi-Tenant Integrity
- **Invariant**: No HR operation shall occur without a validated `tenantId`.
- **Enforcement**: Handled via `TenantGuard` at API level and mandatory `tenantId` arguments in all `HRService` and `IHRRepository` methods.

## 2. Employment Status
- **Invariant**: Employees must have a valid status (`active`, `probation`, `suspended`, `terminated`).
- **Enforcement**: Partial. DTOs validate incoming strings, but the state machine transitions (e.g., can a `terminated` employee be `suspended`?) are not strictly enforced in the service layer.

## 3. Payroll Consistency
- **Invariant**: Payroll cannot be executed for a period that has already been `CLOSED`.
- **Enforcement**: Dependent on `HRCase` status in `HRController`. However, the `ExecutePayrollCommandHandler` does not explicitly check the case status before running calculations.

## 4. Compensation Data
- **Invariant**: An employee's `baseSalary` must be present for payroll inclusion.
- **Enforcement**: `ExecutePayrollCommandHandler` uses a fallback to `0` (line 330: `Number(...) || 0`), which prevents crashes but may result in "Empty" payroll lines without alerting the admin.

## 5. Reporting Line
- **Invariant**: An employee cannot be their own manager.
- **Enforcement**: **NOT FOUND**. The `createEmployee` and `updateEmployee` logic does not currently validate `managerId != employeeId`.
