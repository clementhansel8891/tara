# HR Concurrency Risks

## 1. Concurrent Salary Adjustments
- **Hazard**: Two HR admins adjust an employee's salary at the same time.
- **Risk**: The system uses a simple `update` without checking the `version` or `updatedAt` of the previous record.
- **Impact**: One adjustment is silently lost.

## 2. Attendance & Shift Overlaps
- **Hazard**: A central scheduler assigns a shift to an employee at the same time the employee manually clocks in via the mobile app.
- **Risk**: Possible creation of conflicting temporal records.
- **Impact**: Inconsistent reports for labor cost analysis.

## 3. Bulk Import Collisions
- **Hazard**: Two admins upload the same CSV file simultaneously.
- **Risk**: `importEmployees` iterates through data and calls `createEmployee` (line 421).
- **Impact**: Duplicate employee records if `employeeCode` is not unique or if the unique check happens after the record creation attempts.
