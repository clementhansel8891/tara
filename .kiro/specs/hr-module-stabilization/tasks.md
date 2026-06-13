# Implementation Plan: HR Module Stabilization

## Overview

This plan stabilizes the HR module (NestJS/TypeScript, rooted at `backend/src/core/hr`) by
first introducing a small set of shared correctness primitives — a TenantScope resolver, an
atomic-operation helper, a typed error surface, and field-mapping discipline — then applying
them phase-by-phase across the six HR sub-domains (Employees → Scheduling → Time & Attendance
→ Leave → Payroll/Finance → Recruitment/Performance).

Each task builds on the previous ones and ends with the sub-domain wired end-to-end (including
the Retail `ShiftControl` consumer in Phase 2). Property-based tests use `fast-check` with Jest,
run a minimum of 100 generated cases, and are each tagged
`// Feature: hr-module-stabilization, Property {number}: {property_text}`. Test sub-tasks marked
with `*` are optional and may be skipped for a faster MVP.

## Tasks

- [x] 1. Establish shared correctness primitives
  - [x] 1.1 Implement the TenantScope resolver
    - Create a `TenantScope` value object (`{ tenant_id, company_id?, location_id? }`) and a
      `resolveScope(ctx, requested?)` helper in the HR module
    - Always take `tenant_id` from `TenantContext`; never from headers or body
    - Keep `company_id` and `tenant_id` distinct (no `company_id = tenant_id` fallback); only
      include `company_id`/`location_id` after validating they belong to the caller's `tenant_id`
    - Force non-privileged callers to context scope; allow SUPERADMIN/OWNER/ADMIN to widen scope
      where defined, still validated against `tenant_id`
    - Throw `ForbiddenException` when a requested company/location does not belong to `tenant_id`
    - _Requirements: 2.3, 2.4, 2.5, 3.3_

  - [x] 1.2 Implement the Atomic_Operation helper
    - Create a thin convention around `prisma.$transaction(async (tx) => …)` that threads `tx`
      through repository writes, `AuditService.log(..., tx)`, and `EventBus.publish(..., tx)`
    - Use `SchedulingService` schedule create/approve as the reference template
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 1.3 Implement the typed error surface and Prisma error mapping
    - Replace bare `throw new Error(...)` patterns with NestJS HTTP exceptions
      (`BadRequestException`, `NotFoundException`, `ForbiddenException`, `ConflictException`)
    - Extend `utils/hr-prisma.errors.ts` to map `P2025` → 404, `P2002` → 409, `P2003`/`P2000` → 400,
      and log-then-500 only as a last resort
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 1.4 Establish field-mapping discipline utilities
    - Add explicit DTO-to-column mapping functions (no implicit spread of mismatched-casing
      objects into Prisma); align entity field names with schema columns and map compatibility
      aliases (`job_title`, `position_id`) explicitly
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 1.5 Write property test for effective scope derivation
    - **Property 2: Effective scope derives from verified context, not client input**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 7.2**

  - [x] 1.6 Write property test for multi-write atomicity
    - **Property 5: Multi-write operations are atomic**
    - **Validates: Requirements 4.1, 4.2, 4.4, 7.5, 7.6, 10.2, 10.3, 10.4, 11.2**

- [x] 2. Phase 1 — Employees / Roster
  - [x] 2.1 Migrate `HRController` employee endpoints to verified context + scope
    - Ensure all employee read/write endpoints derive identity from `request.tenantContext` and
      use `resolveScope`; apply composite-key reads (`findFirst({ where: { id, tenant_id } })`)
    - Filter every list/filter query (location/company/department) by the resolved scope
    - _Requirements: 1.2, 2.1, 2.2, 2.6, 4.3, 6.1, 6.2, 6.7_

  - [x] 2.2 Implement employee create/update/deactivate with field mapping
    - Persist all supplied fields via explicit DTO-to-column mapping; soft-deactivate via
      `status` while retaining the record; serialize dates as ISO 8601
    - _Requirements: 1.5, 5.1, 5.2, 5.3, 6.3, 6.4, 6.5_

  - [x] 2.3 Expose roster projection for consumer modules
    - Provide a scoped `GET /hr/employees` projection returning identity, role, and assignment
      data; conform to the `AvailableStaff { id, name, role }` contract
    - _Requirements: 1.6, 6.6_

  - [x] 2.4 Add/audit Role_Gates on employee mutating endpoints
    - Ensure every create/update/deactivate handler declares a `@Roles(...)` gate
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 2.5 Write property test for tenant-scoped reads
    - **Property 1: Tenant-scoped reads never leak other tenants**
    - **Validates: Requirements 2.1, 2.6, 4.3, 6.1, 6.2, 6.7, 7.7, 8.5, 9.5, 10.6, 11.4, 11.5**

  - [x] 2.6 Write property test for round-trip persistence
    - **Property 4: Round-trip persistence of created and updated records**
    - **Validates: Requirements 1.5, 5.1, 5.2, 5.3, 6.3, 6.4, 7.1, 7.3, 8.1, 9.1, 10.1, 11.1, 11.3, 12.4**

  - [x] 2.7 Write live-DB verification test for Phase 1 against `tnt-3rlhko`
    - Exercise employee write paths against the real database; assert no missing column, invalid
      FK, or hardcoded identifier
    - _Requirements: 12.1, 12.2, 13.4_

- [x] 3. Checkpoint - Phase 1
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Phase 2 — Scheduling
  - [x] 4.1 Migrate `HrSchedulingController` to verified context + scope
    - Replace `@Headers("x-tenant-id")` with `@Req() request: RequestWithTenant`; source
      `user_id` from `request.tenantContext.user_id`; pass resolved `TenantScope` into the service
    - Add/audit `@Roles(...)` gates on every mutating schedule/shift endpoint
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.4_

  - [x] 4.2 Fix scheduling service bug classes and field drift
    - Replace `new Error(...)` with `BadRequestException`/`ConflictException`; align
      `data.scheduleId` → `schedule_id` with schema; return 400 for foreign-location create
      instead of 500; reject adding a shift to an `APPROVED` schedule with 409/400
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 7.2, 7.4_

  - [x] 4.3 Implement persistent schedule/shift create, update, and publish
    - Persist Work_Schedule and Work_Shift creates/updates within an Atomic_Operation; implement
      the approve/publish transition atomically with audit + events
    - _Requirements: 4.1, 4.2, 7.1, 7.3, 7.5, 7.6_

  - [x] 4.4 Implement scoped schedule/shift reads and consumer projections
    - Return persisted Work_Schedules/Work_Shifts for the scope; provide the `ScheduledShift[]`
      projection (`employeeId`, `name`, `role`, `startTime`, `endTime`, `dayOfWeek`, `status`)
    - _Requirements: 7.7, 7.8, 1.6_

  - [x] 4.5 Wire Retail `ShiftControl` to the real backend
    - Replace `MOCK_DRAFT_SHIFTS`, `AVAILABLE_STAFF`, and mocked efficiency/attendance/service
      stats with live data from the scheduling and roster endpoints
    - _Requirements: 7.8_

  - [x] 4.6 Write property test for consumer-contract conformance
    - **Property 9: Consumer-contract conformance for staff and schedule projections**
    - **Validates: Requirements 1.6, 6.6, 7.8**

  - [x] 4.7 Write property test for valid requests never producing server errors
    - **Property 8: Valid requests never produce server errors**
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.6, 6.6, 7.8**

  - [x] 4.8 Write example/edge tests and live-DB verification for Phase 2
    - Foreign-location create → 400 regression; add-shift-to-approved → 409/400; run write paths
      against `tnt-3rlhko`
    - _Requirements: 7.2, 7.4, 12.1, 12.2, 13.4_

- [x] 5. Checkpoint - Phase 2
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Phase 3 — Time & Attendance
  - [x] 6.1 Migrate attendance and time/device controllers to verified context + scope
    - Replace header-sourced tenant identity in `HrAttendanceController` and `time/*` controllers;
      add/audit `@Roles(...)` gates; consolidate duplicated clock-in/out logic into one service path
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.4_

  - [x] 6.2 Implement clock-in/clock-out with single-open-record invariant
    - Create an Attendance_Record on clock-in and update the matching open record on clock-out;
      reject double clock-in and clock-out-with-no-open-record with 400
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 6.3 Implement device-event recording and scoped attendance reads
    - Record device-submitted events against the corresponding employee within the device's scope;
      return attendance filtered by employee/date range within the scope
    - _Requirements: 8.5, 8.6_

  - [x] 6.4 Write property test for at-most-one open attendance record
    - **Property 7: At most one open attendance record per employee**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [x] 6.5 Write property test for lifecycle transitions from valid states
    - **Property 6: Lifecycle transitions succeed only from valid states**
    - **Validates: Requirements 7.4, 8.2, 8.3, 8.4, 9.2, 9.3, 9.4, 10.5**

  - [x] 6.6 Write example/edge tests and live-DB verification for Phase 3
    - Double clock-in → 400; clock-out with no open record → 400; run write paths against
      `tnt-3rlhko`
    - _Requirements: 8.3, 8.4, 12.1, 12.2, 13.4_

- [x] 7. Checkpoint - Phase 3
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Phase 4 — Leave
  - [x] 8.1 Migrate `HrLeaveController` to verified context + scope
    - Replace header-sourced tenant identity; add/audit `@Roles(...)` gates on submit/approve/reject
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.4_

  - [x] 8.2 Implement leave submit and approval lifecycle
    - Persist a Leave_Request as `pending`; transition to approved/rejected only from `pending`,
      recording approver identity from context and the supplied rejection note; reject non-pending
      actions with a client error
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 8.3 Implement scoped leave reads
    - Return leave requests filtered by status/employee within the scope
    - _Requirements: 9.5_

  - [x] 8.4 Write example/edge tests and live-DB verification for Phase 4
    - Acting on a non-pending request → client error; run write paths against `tnt-3rlhko`
    - _Requirements: 9.4, 12.1, 12.2, 13.4_

- [x] 9. Checkpoint - Phase 4
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Phase 5 — Payroll & Finance
  - [x] 10.1 Migrate `HrPayrollController` to verified context + scope
    - Replace header-sourced tenant identity; add/audit `@Roles(...)` gates on calculate/approve/
      disburse/settle
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.4_

  - [x] 10.2 Implement payroll calculation and remove hardcoded identifiers
    - Compute payroll using the employee's compensation within scope; resolve currency from the
      company record instead of hardcoded `'IDR'`/`'USD'`
    - _Requirements: 1.2, 10.1_

  - [x] 10.3 Implement atomic payroll lifecycle transitions
    - Implement approve (DRAFT→APPROVED), disburse (APPROVED→DISBURSING), and settle
      (DISBURSING→SETTLED) each within an Atomic_Operation; wrap `approvePayrollRun` in
      `$transaction`; reject invalid transitions with a client error
    - _Requirements: 4.1, 4.2, 10.2, 10.3, 10.5_

  - [x] 10.4 Produce Finance integration records on settle
    - Within the settle transaction, produce balanced `finance_journal_entries` + lines
      (debit = credit) and emit the settlement event in the same transaction
    - _Requirements: 4.4, 10.4_

  - [x] 10.5 Implement scoped payroll reads
    - Return payroll records for an employee within the scope
    - _Requirements: 10.6_

  - [x] 10.6 Write example/edge tests and live-DB verification for Phase 5
    - Each payroll transition: valid edge succeeds, invalid edge → 400; settled run produces
      balanced journal lines; run write paths against `tnt-3rlhko`
    - _Requirements: 10.4, 10.5, 12.1, 12.2, 13.4_

- [x] 11. Checkpoint - Phase 5
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Phase 6 — Recruitment / Performance
  - [x] 12.1 Migrate `HrRecruitmentController` to verified context + scope
    - Replace header-sourced tenant identity; add/audit `@Roles(...)` gates on all mutating endpoints
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.4_

  - [x] 12.2 Implement requisition/candidate/cycle/review create and update
    - Persist requisitions, candidates, performance cycles, and reviews within the scope; persist
      updates to requisition/position/compensation; reject reviews for out-of-scope cycle/employee
      with not-found/client error
    - _Requirements: 11.1, 11.3, 11.5_

  - [x] 12.3 Implement atomic candidate hire
    - On hire, create the corresponding employee within the same `tenant_id` inside an
      Atomic_Operation
    - _Requirements: 11.2_

  - [x] 12.4 Implement scoped recruitment/performance reads
    - Return requisitions, candidates, cycles, and reviews filtered within the scope
    - _Requirements: 11.4_

  - [x] 12.5 Write property test for Role_Gate enforcement
    - **Property 3: Mutating endpoints enforce their Role_Gate**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [x] 12.6 Write example/edge tests and live-DB verification for Phase 6
    - Out-of-scope review → not-found/client error; run write paths against `tnt-3rlhko`
    - _Requirements: 11.5, 12.1, 12.2, 13.4_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Checkpoints ensure incremental validation at each phase boundary.
- Property tests (Properties 1–9) validate universal correctness properties using `fast-check`
  with a minimum of 100 generated cases each and the required tagging comment.
- Per design Requirement 12.3, each property is implemented once and parameterized across the
  relevant phases/record types; property sub-tasks are placed in the earliest phase where the
  property first applies to catch errors early.
- Unit and example tests validate concrete regressions and edge cases; live-DB verification runs
  against `tnt-3rlhko` gate each phase's completion.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["1.5", "1.6", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["2.5", "2.6", "2.7", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4"] },
    { "id": 6, "tasks": ["4.5", "4.6", "4.7", "4.8", "6.1"] },
    { "id": 7, "tasks": ["6.2", "6.3"] },
    { "id": 8, "tasks": ["6.4", "6.5", "6.6", "8.1"] },
    { "id": 9, "tasks": ["8.2", "8.3"] },
    { "id": 10, "tasks": ["8.4", "10.1"] },
    { "id": 11, "tasks": ["10.2", "10.3"] },
    { "id": 12, "tasks": ["10.4", "10.5"] },
    { "id": 13, "tasks": ["10.6", "12.1"] },
    { "id": 14, "tasks": ["12.2", "12.3", "12.4"] },
    { "id": 15, "tasks": ["12.5", "12.6"] }
  ]
}
```
