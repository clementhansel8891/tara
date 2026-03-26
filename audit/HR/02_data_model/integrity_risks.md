# HR Integrity Risks

## 1. Missing Unique Constraints on Temporal Data
- **Attendance**: `AttendanceRecord` lacks a unique constraint on `[employeeId, date]`. This permits multiple clock-in records for the same day, leading to double-counting work hours in payroll calculations.
- **Leave Requests**: No constraint preventing overlapping leave requests for the same employee.

## 2. Inconsistent Soft Delete Propagation
- When an `Employee` is soft-deleted (`deletedAt != null`), related entities such as `ScheduleAssignment`, `TrainingAssignment`, and `PerformanceReview` remain "Active" in the database.
- Missing database-level or application-level triggers to cleanup/deactivate assignments upon employee termination.

## 3. Departmental Orphan Risk
- `JobRequisition` has an optional `departmentId` (`departmentId String?`). If a requisition is created without a department, it may bypass budgetary controls linked to department cost centers.

## 4. Multi-Tenant Boundary Escalation
- **Risk**: `Employee.userId` is optional. If an employee is linked to a `User` record that belongs to a different tenant (via misconfiguration in `HRService.createEmployee`), cross-tenant data exposure could occur.
- **Validation Recommendation**: Add a multi-tenant cross-check in `HRMutationInterceptor` to ensure `User.tenantId == Employee.tenantId`.

## 5. Circular Dependency Potentials
- `Employee` manages `Store`, and `Store` employs `Employee`. While not a blocking DB issue, it can cause recursion issues in deep serialization (JSON responses) if not handled by `@Exclude()` or similar logic.
