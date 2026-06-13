// Feature: hr-module-stabilization, Property 9: Consumer-contract conformance for staff and schedule projections
import { describe, it, expect } from "vitest";
import fc from "fast-check";

import {
  AvailableStaff,
  ScheduledShift,
  WorkShiftLike,
  mapToAvailableStaff,
  mapToScheduledShift,
} from "./consumer-contracts";
import { Employee } from "../entities/employee.entity";

/**
 * Property 9: Consumer-contract conformance for staff and schedule projections
 *
 * Validates: Requirements 1.6, 6.6, 7.8
 *
 * For any set of persisted employees, work schedules, and work shifts within a
 * Tenant_Scope, the scheduling and roster endpoints return collections that
 * conform to the `ScheduledShift[]` and `AvailableStaff[]` contracts consumed
 * by the Retail `ShiftControl` page (required fields present, correct field
 * names and value formats).
 *
 * This exercises the real projection mappers that those endpoints use:
 *   roster      -> mapToAvailableStaff(employee)   -> AvailableStaff
 *   scheduling  -> mapToScheduledShift(shift, emp) -> ScheduledShift
 *
 * The test asserts the projections ALWAYS conform regardless of the (possibly
 * messy / partial) persisted source records:
 *   AvailableStaff  : exactly { id, name, role }, all strings.
 *   ScheduledShift  : exactly { id, employeeId, name, role, startTime, endTime,
 *                     dayOfWeek, status } with
 *                       - startTime/endTime matching /^\d{2}:\d{2}$/
 *                       - dayOfWeek an integer 0..6
 *                       - status in {'draft','published'}
 *                       - employeeId mapped from the source `employee_id`
 *                       - id mapped from the source `id`
 */

const TIME_RE = /^\d{2}:\d{2}$/;

const AVAILABLE_STAFF_KEYS = ["id", "name", "role"].sort();
const SCHEDULED_SHIFT_KEYS = [
  "id",
  "employeeId",
  "name",
  "role",
  "startTime",
  "endTime",
  "dayOfWeek",
  "status",
].sort();

const idArb = fc.uuid();
// Names/roles may be empty, whitespace, or arbitrary unicode in persisted data.
const looseStringArb = fc.string({ maxLength: 24 });
const optionalStringArb = fc.option(looseStringArb, { nil: undefined });

// A time value can arrive as a real Date, an ISO string, or even a garbage /
// unparseable string (the mapper must still emit a well-formed "HH:mm").
const timeValueArb = fc.oneof(
  fc.date({
    min: new Date("2000-01-01T00:00:00.000Z"),
    max: new Date("2035-12-31T23:59:59.000Z"),
    noInvalidDate: true,
  }),
  fc
    .date({
      min: new Date("2000-01-01T00:00:00.000Z"),
      max: new Date("2035-12-31T23:59:59.000Z"),
      noInvalidDate: true,
    })
    .map((d) => d.toISOString()),
  fc.string({ maxLength: 12 }), // includes unparseable garbage -> "00:00"
);

/**
 * Builds a partial `Employee` from generated fragments. Real persisted rows can
 * have any combination of `full_name`, `first_name`/`last_name`, `role_title`,
 * and `position` set or empty, so the generator covers all those shapes.
 */
const employeeArb: fc.Arbitrary<Employee> = fc
  .record({
    id: idArb,
    full_name: optionalStringArb,
    first_name: optionalStringArb,
    last_name: optionalStringArb,
    role_title: optionalStringArb,
    position: optionalStringArb,
  })
  .map((parts) => {
    const e = new Employee();
    e.id = parts.id;
    if (parts.full_name !== undefined) e.full_name = parts.full_name;
    if (parts.first_name !== undefined) e.first_name = parts.first_name;
    if (parts.last_name !== undefined) e.last_name = parts.last_name;
    if (parts.role_title !== undefined) e.role_title = parts.role_title;
    if (parts.position !== undefined) e.position = parts.position;
    return e;
  });

const workShiftArb: fc.Arbitrary<WorkShiftLike> = fc.record({
  id: idArb,
  employee_id: idArb,
  start_time: timeValueArb,
  end_time: timeValueArb,
  status: fc.option(
    fc.constantFrom(
      "draft",
      "DRAFT",
      "approved",
      "APPROVED",
      "published",
      "PUBLISHED",
      "pending",
      "",
      "weird-status",
    ),
    { nil: undefined },
  ),
  schedule_status: fc.option(
    fc.constantFrom("DRAFT", "APPROVED", "PUBLISHED", "", "unknown"),
    { nil: undefined },
  ),
});

function assertAvailableStaffConforms(staff: AvailableStaff) {
  // Exactly the contract keys, nothing more, nothing less.
  expect(Object.keys(staff).sort()).toEqual(AVAILABLE_STAFF_KEYS);
  // Correct value types.
  expect(typeof staff.id).toBe("string");
  expect(typeof staff.name).toBe("string");
  expect(typeof staff.role).toBe("string");
}

function assertScheduledShiftConforms(shift: ScheduledShift) {
  // Exactly the contract keys, nothing more, nothing less.
  expect(Object.keys(shift).sort()).toEqual(SCHEDULED_SHIFT_KEYS);
  // Correct value types.
  expect(typeof shift.id).toBe("string");
  expect(typeof shift.employeeId).toBe("string");
  expect(typeof shift.name).toBe("string");
  expect(typeof shift.role).toBe("string");
  // Time-of-day format "HH:mm".
  expect(shift.startTime).toMatch(TIME_RE);
  expect(shift.endTime).toMatch(TIME_RE);
  // dayOfWeek is an integer in [0, 6].
  expect(Number.isInteger(shift.dayOfWeek)).toBe(true);
  expect(shift.dayOfWeek).toBeGreaterThanOrEqual(0);
  expect(shift.dayOfWeek).toBeLessThanOrEqual(6);
  // status is the binary publication state.
  expect(["draft", "published"]).toContain(shift.status);
}

describe("Property 9: Consumer-contract conformance for staff and schedule projections", () => {
  it("mapToAvailableStaff always produces a conforming AvailableStaff for any employee collection", () => {
    fc.assert(
      fc.property(fc.array(employeeArb, { maxLength: 20 }), (employees) => {
        const roster = employees.map(mapToAvailableStaff);

        roster.forEach((staff, i) => {
          assertAvailableStaffConforms(staff);
          // id is projected directly from the source employee id.
          expect(staff.id).toBe(employees[i].id);
        });
      }),
      { numRuns: 200 },
    );
  });

  it("mapToScheduledShift always produces a conforming ScheduledShift (with or without a joined employee)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            shift: workShiftArb,
            employee: fc.option(employeeArb, { nil: undefined }),
          }),
          { maxLength: 20 },
        ),
        (rows) => {
          const schedule = rows.map(({ shift, employee }) =>
            mapToScheduledShift(shift, employee),
          );

          schedule.forEach((projected, i) => {
            const { shift } = rows[i];
            assertScheduledShiftConforms(projected);
            // id / employeeId map from the source row's id / employee_id.
            expect(projected.id).toBe(shift.id);
            expect(projected.employeeId).toBe(shift.employee_id);
          });
        },
      ),
      { numRuns: 200 },
    );
  });

  it("derives published status only for APPROVED/PUBLISHED source statuses (otherwise draft)", () => {
    fc.assert(
      fc.property(workShiftArb, employeeArb, (shift, employee) => {
        const projected = mapToScheduledShift(shift, employee);
        const raw = (shift.status ?? shift.schedule_status ?? "")
          .trim()
          .toUpperCase();
        const expected =
          raw === "APPROVED" || raw === "PUBLISHED" ? "published" : "draft";
        expect(projected.status).toBe(expected);
      }),
      { numRuns: 200 },
    );
  });
});
