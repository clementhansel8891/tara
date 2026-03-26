# HR Edge Case List

## 1. Concurrency Collision
- **Scenario**: Two managers simultaneously update the `baseSalary` of an employee.
- **Trigger**: `PATCH /employees/:id/compensation`.
- **Result**: "Last-Write-Wins" behavior without versioning/locking. The second manager's update will silently overwrite the first.

## 2. Temporal Overlaps
- **Scenario**: An employee clocks in at Location A then Location B without clocking out of A.
- **Trigger**: `POST /attendance/clock-in`.
- **Result**: The system creates a second open attendance record. If the repository only checks for "today's open record" by location, it may permit infinite overlaps.

## 3. Partially Orphaned Hire
- **Scenario**: `HireEmployeeCommand` is executed but the candidate record is deleted immediately after by another admin.
- **Trigger**: Race condition during conversion.
- **Result**: Employee record is created with `candidateId` pointing to a missing record.

## 4. Multi-Tenant Cross-Leak
- **Scenario**: Data migration script accidentally maps a `departmentId` from Tenant A to an `Employee` from Tenant B.
- **Trigger**: Low-fidelity database mutation.
- **Result**: `HRController` will permit access because the `Employee.tenantId` matches, but the related `Department` entity will belong to another tenant.

## 5. Circular Managerial Chain
- **Scenario**: Manager A is assigned Manager B, who is assigned Manager A.
- **Trigger**: `PUT /employees/:id`.
- **Result**: Recursive loops in org-chart generators or approval-escalation logic.
