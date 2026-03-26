# HR Invalid States

## 1. Impossible States (Logical Failures)
- **Active Terminates**: An employee record marked `status=active` but having a non-null `deletedAt` date.
- **Clocked-in Ghost**: An `AttendanceRecord` in `clocked_in` state belonging to a `terminated` employee.
- **Approved Negative Payroll**: A payroll run marked `APPROVED` containing a `netPay < 0` for any line item.

## 2. Illegal State Combinations
- **Manager-less Employee**: A non-Owner employee record missing a `managerId` and `departmentId`. (The system currently permits null `departmentId` in repositories, which should be restricted for non-CXOs).
- **Orphaned Succession Plan**: A succession plan for a `Position` that has been deleted or is currently being held by a `terminated` employee.

## 3. State Drift Detection
- **Risk**: `Candidate` is `HIRED`, but `Employee` creation failed. Currently, the system does not use a cross-entity database transaction (Prisma `$transaction`) to wrap candidate conversion. This can lead to a `hired` candidate with no corresponding employee record.
