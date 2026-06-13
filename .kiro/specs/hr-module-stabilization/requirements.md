# Requirements Document

## Introduction

The HR module is the backbone of the Zenvix platform. It owns the staff roster (employees),
shift scheduling, workforce planning, time & attendance, leave, recruitment, performance,
and payroll. Other modules depend on HR data, but several HR capabilities are incomplete,
unwired, or carry recurring bug classes, so downstream modules currently rely on hardcoded
or mock data:

- The Retail `ShiftControl` page renders a fabricated scheduling grid (`MOCK_DRAFT_SHIFTS`),
  a hardcoded staff list (`AVAILABLE_STAFF`), and mocked efficiency/attendance/service
  statistics because no working shift-scheduling backend is wired to it.
- The Core `Security` page (already addressed separately) should source workforce/roster
  data from HR.
- Finance payroll consumes HR payroll output.

This feature brings the HR module to production-grade by systematically testing every HR
flow, fixing all bugs, and filling the missing backends that other modules depend on. The
work is organized into independently testable and deployable **phases** by sub-domain. The
system is a live production deployment on a VPS; changes deploy via git push to `main`
followed by a Docker rebuild, and are validated live against the production environment
using `tnt-3rlhko` as the live test tenant.

This document defines WHAT correct, stabilized HR behavior is. Implementation details
(specific files, functions, query rewrites) are deferred to the design phase.

## Glossary

- **HR_System**: The backend HR module (services, controllers, repository, entities, DTOs)
  exposed under the `/hr` route namespace, including scheduling, attendance, leave, payroll,
  recruitment, and performance sub-domains.
- **HR_Endpoint**: Any HTTP endpoint served by an HR controller (`hr.controller.ts`,
  `controllers/hr-scheduling.controller.ts`, `hr-attendance.controller.ts`,
  `hr-leave.controller.ts`, `hr-payroll.controller.ts`, `hr-recruitment.controller.ts`,
  `compliance.controller.ts`, `time/time.controller.ts`, `time/device.controller.ts`).
- **Tenant_Context**: The verified request identity derived from the authenticated JWT and
  the tenant interceptor, exposing `tenant_id`, `company_id`, `location_id`, `user_id`, and
  `role`. It is the authoritative source of caller identity.
- **Tenant_Scope**: The set of `tenant_id`, and where applicable `company_id` and
  `location_id`, used to filter every data-access query so that a caller only reads or
  writes records belonging to their own tenant and permitted scope.
- **Live_Test_Tenant**: The tenant `tnt-3rlhko` used to validate behavior against the live
  production database.
- **Employee_Roster**: The set of employee records owned by a tenant, queryable by other
  modules to obtain real staff data.
- **Work_Schedule**: A persistent scheduling container (`work_schedules`) scoped to a tenant
  and location, holding a set of Work_Shifts and carrying a status (e.g., draft, approved).
- **Work_Shift**: A persistent shift assignment (`work_shifts`) belonging to a Work_Schedule,
  assigning an employee to a time block.
- **Shift_Scheduling_Backend**: The HR scheduling capability (create/update/publish
  Work_Schedules and Work_Shifts) that the Retail `ShiftControl` grid and statistics consume.
- **Attendance_Record**: A time & attendance record produced by clock-in/clock-out and
  device events.
- **Leave_Request**: A request for employee leave with an approval lifecycle.
- **Payroll_Run**: A payroll computation and settlement unit with an approve → disburse →
  settle lifecycle that integrates with Finance.
- **Atomic_Operation**: A multi-write operation executed inside a single database
  transaction so that either all writes commit or none do.
- **Role_Gate**: The role-based access control applied to an HR_Endpoint via the roles guard
  and role decorators.

## Requirements

### Requirement 1: HR Endpoint Reliability

**User Story:** As an operator of the platform, I want every HR endpoint to return correct
data without server errors, so that HR screens and dependent modules display real, accurate
information.

#### Acceptance Criteria

1. WHEN a valid request is made to an HR_Endpoint, THE HR_System SHALL return a successful
   response with a status code below 500.
2. WHEN an HR_Endpoint reads or writes data, THE HR_System SHALL execute the operation
   against the live database without referencing nonexistent columns, invalid foreign keys,
   or hardcoded identifiers.
3. IF an HR_Endpoint receives input that fails validation, THEN THE HR_System SHALL return a
   client-error response (status code 400 through 422) with a descriptive error message.
4. IF a requested HR resource does not exist within the caller's Tenant_Scope, THEN THE
   HR_System SHALL return a not-found response with a descriptive error message.
5. WHEN an HR_Endpoint serializes a date value in a response, THE HR_System SHALL render the
   value in ISO 8601 format.
6. WHEN an HR_Endpoint returns a collection, THE HR_System SHALL return a response whose
   shape matches the contract consumed by the calling client.

### Requirement 2: Tenant Isolation

**User Story:** As a tenant administrator, I want my HR data to be isolated from other
tenants, so that no caller can read or modify records outside their own tenant and permitted
scope.

#### Acceptance Criteria

1. WHEN an HR_Endpoint reads HR data, THE HR_System SHALL filter the query by the `tenant_id`
   from the Tenant_Context.
2. WHEN an HR_Endpoint writes HR data, THE HR_System SHALL persist the record with the
   `tenant_id` from the Tenant_Context.
3. THE HR_System SHALL derive `tenant_id`, `company_id`, and `location_id` for scoping from
   the verified Tenant_Context rather than from client-supplied request headers or request
   body fields.
4. THE HR_System SHALL treat `tenant_id` and `company_id` as distinct identifiers and SHALL
   NOT substitute one for the other when constructing a Tenant_Scope.
5. WHERE an HR_Endpoint applies a location or company filter, THE HR_System SHALL include in
   the Tenant_Scope only `location_id` and `company_id` values that belong to the caller's
   `tenant_id`.
6. IF a non-privileged caller requests records outside the caller's Tenant_Scope, THEN THE
   HR_System SHALL restrict the result to records within the caller's Tenant_Scope.

### Requirement 3: Role-Based Access Control

**User Story:** As a security administrator, I want HR actions gated by role, so that only
authorized users can perform privileged HR operations.

#### Acceptance Criteria

1. WHEN a caller invokes an HR_Endpoint that requires a specific role, THE HR_System SHALL
   verify the caller's role from the Tenant_Context against the endpoint's Role_Gate.
2. IF a caller lacks a role permitted by the endpoint's Role_Gate, THEN THE HR_System SHALL
   reject the request with a forbidden response (status code 403).
3. WHERE a caller holds a privileged role (SUPERADMIN, OWNER, or ADMIN), THE HR_System SHALL
   permit the cross-location and cross-company visibility defined for that role.
4. THE HR_System SHALL apply a Role_Gate to every HR_Endpoint that creates, updates, or
   deletes HR data.

### Requirement 4: Transactional Integrity of Multi-Write Operations

**User Story:** As a data steward, I want multi-step HR operations to be atomic, so that a
partial failure never leaves HR data in an inconsistent state.

#### Acceptance Criteria

1. WHEN an HR operation performs more than one database write, THE HR_System SHALL execute
   all writes within a single Atomic_Operation.
2. IF any write within an Atomic_Operation fails, THEN THE HR_System SHALL roll back all
   writes performed within that Atomic_Operation.
3. WHEN an HR operation reads a record by a composite key, THE HR_System SHALL use a query
   form that supports composite-key lookups rather than a unique-by-single-key lookup.
4. WHEN an HR operation emits an audit log or domain event alongside a data write, THE
   HR_System SHALL include the audit log and event within the same Atomic_Operation as the
   write.

### Requirement 5: Field Naming Consistency

**User Story:** As a developer integrating with HR, I want field names to be consistent
between the database schema, DTOs, and code, so that reads and writes do not silently drop
or misplace data.

#### Acceptance Criteria

1. WHEN an HR_Endpoint maps between a DTO and a database record, THE HR_System SHALL bind
   each value to the database column whose defined name matches the schema.
2. IF an inbound DTO field uses a different casing convention than the database column, THEN
   THE HR_System SHALL translate the field to the schema-defined column name before
   persisting.
3. THE HR_System SHALL persist every value supplied in a valid create or update request to
   its corresponding database column without dropping the value due to a name mismatch.

### Requirement 6: Employee Roster (Phase 1)

**User Story:** As a consumer module (Retail scheduling, Core Security), I want a fully
functional, queryable employee roster, so that I can display and operate on real staff data
instead of mock lists.

#### Acceptance Criteria

1. WHEN a caller requests the employee list within a Tenant_Scope, THE HR_System SHALL
   return the Employee_Roster for that Tenant_Scope.
2. WHEN a caller requests employees filtered by location, company, or department, THE
   HR_System SHALL return only employees matching the supplied filter within the caller's
   Tenant_Scope.
3. WHEN a caller creates an employee with a valid payload, THE HR_System SHALL persist the
   employee within the caller's Tenant_Scope and return the created employee.
4. WHEN a caller updates an existing employee with a valid payload, THE HR_System SHALL
   persist every supplied field and return the updated employee.
5. WHEN a caller deactivates an employee, THE HR_System SHALL mark the employee inactive
   while retaining the record for historical reference.
6. WHEN another module requests staff data for a Tenant_Scope, THE HR_System SHALL expose
   employee identity, role, and assignment data sufficient to populate that module's staff
   views.
7. WHEN a caller requests an employee that exists in another tenant, THE HR_System SHALL
   return a not-found response.

### Requirement 7: Shift Scheduling Backend (Phase 2)

**User Story:** As a retail manager, I want a real, persistent shift-scheduling backend, so
that the `ShiftControl` grid and its statistics reflect real schedules instead of
`MOCK_DRAFT_SHIFTS`, `AVAILABLE_STAFF`, and mocked metrics.

#### Acceptance Criteria

1. WHEN a caller creates a Work_Schedule for a location within the caller's Tenant_Scope,
   THE HR_System SHALL persist the Work_Schedule and return it.
2. IF a caller creates a Work_Schedule for a location that does not belong to the caller's
   `tenant_id`, THEN THE HR_System SHALL reject the request with a client-error response.
3. WHEN a caller adds a Work_Shift to a Work_Schedule, THE HR_System SHALL persist the
   Work_Shift associated with that Work_Schedule and the assigned employee.
4. IF a caller adds a Work_Shift to a Work_Schedule whose status is approved, THEN THE
   HR_System SHALL reject the request with a client-error response.
5. WHEN a caller updates a Work_Schedule or Work_Shift with a valid payload, THE HR_System
   SHALL persist the changes within an Atomic_Operation and return the updated record.
6. WHEN a caller publishes (approves) a Work_Schedule, THE HR_System SHALL transition the
   Work_Schedule to its published state and persist the transition within an
   Atomic_Operation.
7. WHEN a caller requests schedules or shifts within a Tenant_Scope, THE HR_System SHALL
   return the persisted Work_Schedules and Work_Shifts for that Tenant_Scope.
8. THE Shift_Scheduling_Backend SHALL return staff, schedule, and shift data in a shape that
   allows the Retail `ShiftControl` page to populate its grid and statistics from real data.

### Requirement 8: Time & Attendance (Phase 3)

**User Story:** As an HR manager, I want time and attendance tracking to work end-to-end, so
that clock-ins, clock-outs, and device events produce accurate attendance records.

#### Acceptance Criteria

1. WHEN an employee clocks in, THE HR_System SHALL create an Attendance_Record within the
   caller's Tenant_Scope and return the record.
2. WHEN an employee clocks out, THE HR_System SHALL update the matching open Attendance_Record
   with the clock-out time and return the record.
3. IF an employee attempts to clock in while already clocked in, THEN THE HR_System SHALL
   reject the request with a client-error response.
4. IF an employee attempts to clock out without an open Attendance_Record, THEN THE
   HR_System SHALL reject the request with a client-error response.
5. WHEN a caller requests attendance records filtered by employee or date range within a
   Tenant_Scope, THE HR_System SHALL return the matching Attendance_Records.
6. WHEN a time device submits an attendance event, THE HR_System SHALL record the event
   against the corresponding employee within the device's Tenant_Scope.

### Requirement 9: Leave Management (Phase 4)

**User Story:** As an employee and approver, I want leave requests to follow a correct
approval lifecycle, so that leave is tracked and decided accurately.

#### Acceptance Criteria

1. WHEN an employee submits a Leave_Request with a valid payload, THE HR_System SHALL persist
   the Leave_Request within the caller's Tenant_Scope with a pending status.
2. WHEN an authorized approver approves a Leave_Request, THE HR_System SHALL transition the
   Leave_Request to approved and record the approver identity from the Tenant_Context.
3. WHEN an authorized approver rejects a Leave_Request, THE HR_System SHALL transition the
   Leave_Request to rejected and record the supplied rejection note.
4. IF an approver acts on a Leave_Request that is not in a pending state, THEN THE HR_System
   SHALL reject the action with a client-error response.
5. WHEN a caller requests leave requests filtered by status or employee within a
   Tenant_Scope, THE HR_System SHALL return the matching Leave_Requests.

### Requirement 10: Payroll and Finance Integration (Phase 5)

**User Story:** As a payroll administrator, I want payroll computation and settlement to work
correctly and feed Finance, so that employees are paid accurately and the books reconcile.

#### Acceptance Criteria

1. WHEN a caller calculates payroll for an employee and period, THE HR_System SHALL compute
   the payroll using the employee's compensation within the caller's Tenant_Scope and return
   the result.
2. WHEN a caller approves a Payroll_Run, THE HR_System SHALL transition the Payroll_Run to
   approved within an Atomic_Operation.
3. WHEN a caller disburses an approved Payroll_Run, THE HR_System SHALL transition the
   Payroll_Run to disbursed within an Atomic_Operation.
4. WHEN a caller settles a disbursed Payroll_Run, THE HR_System SHALL transition the
   Payroll_Run to settled and produce the corresponding Finance integration records within an
   Atomic_Operation.
5. IF a caller requests a Payroll_Run lifecycle transition that is not valid from the
   Payroll_Run's current state, THEN THE HR_System SHALL reject the request with a
   client-error response.
6. WHEN a caller requests payroll records for an employee within a Tenant_Scope, THE
   HR_System SHALL return the matching payroll records.

### Requirement 11: Recruitment and Performance (Phase 6)

**User Story:** As a recruiter and people manager, I want recruitment and performance flows
to work end-to-end, so that hiring and reviews are tracked accurately.

#### Acceptance Criteria

1. WHEN a caller creates a requisition, candidate, performance cycle, or performance review
   with a valid payload, THE HR_System SHALL persist the record within the caller's
   Tenant_Scope and return it.
2. WHEN a caller hires a candidate, THE HR_System SHALL create the corresponding employee
   within the caller's Tenant_Scope within an Atomic_Operation.
3. WHEN a caller updates a requisition, position, or compensation with a valid payload, THE
   HR_System SHALL persist the changes and return the updated record.
4. WHEN a caller requests requisitions, candidates, performance cycles, or reviews filtered
   within a Tenant_Scope, THE HR_System SHALL return the matching records.
5. IF a caller submits a performance review for a cycle or employee outside the caller's
   Tenant_Scope, THEN THE HR_System SHALL reject the request with a not-found or
   client-error response.

### Requirement 12: Live Database Verification

**User Story:** As a release manager, I want every HR write path validated against a real
database, so that endpoints that were never exercised against live data are proven correct
before release.

#### Acceptance Criteria

1. WHEN an HR write path is delivered in a phase, THE HR_System SHALL have that write path
   exercised against a real database using the Live_Test_Tenant.
2. IF a verification run against the real database surfaces a missing column, invalid foreign
   key, or hardcoded identifier, THEN the defect SHALL be corrected before the phase is
   considered complete.
3. THE HR_System SHALL provide correctness properties for each phase that can be checked by
   automated tests, covering tenant isolation, role gating, atomicity, and round-trip
   persistence of created and updated records.
4. WHEN a created or updated HR record is read back within the same Tenant_Scope, THE
   HR_System SHALL return a record whose persisted fields match the values supplied on
   creation or update (round-trip property).

### Requirement 13: Phased Delivery

**User Story:** As a reviewer, I want the HR stabilization delivered in reviewable phases by
sub-domain, so that each phase is independently testable and deployable.

#### Acceptance Criteria

1. THE implementation plan SHALL group work into phases by HR sub-domain, at minimum:
   Phase 1 Employees/Roster, Phase 2 Scheduling, Phase 3 Time & Attendance, Phase 4 Leave,
   Phase 5 Payroll and Finance integration, and Phase 6 Recruitment/Performance.
2. THE implementation plan SHALL define each phase such that the phase is independently
   testable against the Live_Test_Tenant.
3. THE implementation plan SHALL define each phase such that the phase is independently
   deployable via the git-push-to-main and Docker-rebuild process.
4. WHEN a phase is completed, THE phase SHALL satisfy Requirements 1 through 5 (endpoint
   reliability, tenant isolation, role gating, transactional integrity, and field-naming
   consistency) for the endpoints in that phase's sub-domain.
