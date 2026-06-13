// Feature: hr-module-stabilization, Property 7: At most one open attendance record per employee
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { HttpException, BadRequestException } from "@nestjs/common";
import { TimeAndAttendanceService } from "./time.service";

/**
 * Property 7: At most one open attendance record per employee
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 *
 * For any sequence of clock-in / clock-out operations for an employee within a
 * Tenant_Scope, the employee never has more than one OPEN (un-clocked-out)
 * attendance record at any point in time.
 *
 * The invariant lives in `TimeAndAttendanceService.clock_in` / `clock_out`
 * (backend/src/core/hr/time/time.service.ts):
 *   - clock_in rejects with BadRequestException when an open record
 *     (check_out_time === null) already exists for the employee in scope.
 *   - clock_out rejects with BadRequestException when there is no open record.
 *
 * Per the design Testing Strategy we exercise the service against an in-memory
 * fake of the prisma boundary (no real DB, no mocks of the logic-under-test):
 * a random sequence of IN/OUT operations is applied through the real service;
 * invalid operations surface the expected client (4xx) errors; after EACH
 * operation we assert the count of open records for the employee is <= 1.
 */

/* -------------------------------------------------------------------------- */
/* In-memory fake of the prisma boundary clock_in / clock_out touch           */
/* -------------------------------------------------------------------------- */

interface FakeAttendanceRecord {
  id: string;
  tenant_id: string;
  employee_id: string;
  location_id: string;
  check_in_time: Date;
  check_out_time: Date | null;
  created_at: Date;
  deleted_at: Date | null;
  work_shift_id?: string | null;
  metadata?: unknown;
  [key: string]: unknown;
}

/**
 * Fake PrismaService exposing only what clock_in / clock_out read & write:
 *   - hr_attendance_records.findFirst (honours tenant_id / employee_id /
 *     check_out_time:null / deleted_at:null and orderBy created_at desc)
 *   - hr_attendance_records.create / update
 *   - hr_work_shifts.findFirst -> null (no scheduled shift => UNSCHEDULED path)
 *   - hr_work_shifts.findUnique -> null (no shift => no overtime calc on out)
 *   - $transaction passes the same fake through as `tx`.
 */
function makeFakePrisma() {
  const attendance: FakeAttendanceRecord[] = [];
  let counter = 0;

  const matchesWhere = (r: FakeAttendanceRecord, w: any): boolean =>
    (w.tenant_id === undefined || r.tenant_id === w.tenant_id) &&
    (w.employee_id === undefined || r.employee_id === w.employee_id) &&
    (w.check_out_time === undefined || r.check_out_time === w.check_out_time) &&
    (w.deleted_at === undefined || r.deleted_at === w.deleted_at) &&
    (w.id === undefined || r.id === w.id);

  const prisma: any = {
    hr_attendance_records: {
      findFirst: async (args: any) => {
        const where = args?.where ?? {};
        const matches = attendance.filter((r) => matchesWhere(r, where));
        if (args?.orderBy?.created_at === "desc") {
          matches.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        }
        return matches[0] ?? null;
      },
      create: async ({ data }: any) => {
        const rec: FakeAttendanceRecord = {
          ...data,
          // Force a unique id so update-by-id is unambiguous even when the
          // service derives ids from Date.now() within the same millisecond.
          id: `att-${counter}`,
          created_at: new Date(Date.now() + counter),
          check_out_time: data.check_out_time ?? null,
          deleted_at: data.deleted_at ?? null,
        };
        counter += 1;
        attendance.push(rec);
        return rec;
      },
      update: async ({ where, data }: any) => {
        const rec = attendance.find((r) => r.id === where.id);
        if (!rec) throw new Error(`record ${where.id} not found`);
        Object.assign(rec, data);
        return rec;
      },
    },
    hr_work_shifts: {
      findFirst: async () => null,
      findUnique: async () => null,
    },
    async $transaction<T>(cb: (tx: any) => Promise<T>): Promise<T> {
      return cb(prisma);
    },
  };

  return { prisma, attendance };
}

/** Fake HR repository: only getEmployeeById is touched by clock_in. */
function makeFakeRepo(employees: Record<string, { id: string; location_id: string; department_id: string }>) {
  return {
    getEmployeeById: async (_tenant_id: string, employee_id: string) =>
      employees[employee_id] ?? null,
  } as any;
}

const noopEventBus = { publish: async () => ({ ok: true }) } as any;

function makeService(
  employees: Record<string, { id: string; location_id: string; department_id: string }>,
) {
  const { prisma, attendance } = makeFakePrisma();
  // Constructor order: (eventBus, hrRepository, prisma)
  const service = new TimeAndAttendanceService(
    noopEventBus,
    makeFakeRepo(employees),
    prisma,
  );
  return { service, attendance };
}

/** Count of currently OPEN records (check_out_time === null) for an employee. */
function openCount(
  attendance: FakeAttendanceRecord[],
  tenant_id: string,
  employee_id: string,
): number {
  return attendance.filter(
    (r) =>
      r.tenant_id === tenant_id &&
      r.employee_id === employee_id &&
      r.check_out_time === null &&
      r.deleted_at === null,
  ).length;
}

/** Assert a caught value is a client (4xx) error, never a bare Error / 500. */
function expectClientError(err: unknown): void {
  expect(err).toBeInstanceOf(BadRequestException);
  const status = (err as HttpException).getStatus();
  expect(status).toBeGreaterThanOrEqual(400);
  expect(status).toBeLessThan(500);
}

const idArb = fc
  .string({ minLength: 1, maxLength: 10 })
  .map((s) => s.replace(/\s/g, "_"));

const opSeqArb = fc.array(fc.constantFrom<"IN" | "OUT">("IN", "OUT"), {
  minLength: 1,
  maxLength: 25,
});

describe("Property 7: At most one open attendance record per employee", () => {
  it("single employee: any IN/OUT sequence keeps open records <= 1", async () => {
    await fc.assert(
      fc.asyncProperty(idArb, idArb, idArb, opSeqArb, async (tenant_raw, emp_raw, loc_raw, ops) => {
        const tenant_id = `tnt-${tenant_raw}`;
        const employee_id = `emp-${emp_raw}`;
        const location_id = `loc-${loc_raw}`;

        const { service, attendance } = makeService({
          [employee_id]: { id: employee_id, location_id, department_id: "dept-1" },
        });

        for (const op of ops) {
          const openBefore = openCount(attendance, tenant_id, employee_id);
          let caught: unknown;
          try {
            if (op === "IN") {
              // location_id === employee.location_id => primary-location path;
              // reason supplied so the UNSCHEDULED branch does not 400 on us.
              await service.clock_in(tenant_id, employee_id, location_id, {
                reason: "test clock-in",
              });
            } else {
              await service.clock_out(tenant_id, employee_id, {});
            }
          } catch (e) {
            caught = e;
          }

          // Invariant under test: never more than one open record.
          const openAfter = openCount(attendance, tenant_id, employee_id);
          expect(openAfter).toBeLessThanOrEqual(1);

          // Lifecycle correctness backing the invariant:
          if (op === "IN") {
            if (openBefore === 1) {
              // Second clock-in must be rejected (8.3) and leave state unchanged.
              expectClientError(caught);
              expect(openAfter).toBe(1);
            } else {
              // First clock-in opens exactly one record (8.1).
              expect(caught).toBeUndefined();
              expect(openAfter).toBe(1);
            }
          } else {
            if (openBefore === 1) {
              // Clock-out closes the single open record (8.2).
              expect(caught).toBeUndefined();
              expect(openAfter).toBe(0);
            } else {
              // Clock-out with no open record is rejected (8.4); state unchanged.
              expectClientError(caught);
              expect(openAfter).toBe(0);
            }
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it("interleaved multiple employees: invariant holds per employee independently", async () => {
    const empArb = fc.constantFrom("emp-a", "emp-b", "emp-c");
    const stepArb = fc.record({
      employee_id: empArb,
      op: fc.constantFrom<"IN" | "OUT">("IN", "OUT"),
    });

    await fc.assert(
      fc.asyncProperty(
        idArb,
        fc.array(stepArb, { minLength: 1, maxLength: 40 }),
        async (tenant_raw, steps) => {
          const tenant_id = `tnt-${tenant_raw}`;
          const employees = {
            "emp-a": { id: "emp-a", location_id: "loc-1", department_id: "d" },
            "emp-b": { id: "emp-b", location_id: "loc-1", department_id: "d" },
            "emp-c": { id: "emp-c", location_id: "loc-1", department_id: "d" },
          };
          const { service, attendance } = makeService(employees);

          for (const { employee_id, op } of steps) {
            const location_id = employees[employee_id as keyof typeof employees].location_id;
            try {
              if (op === "IN") {
                await service.clock_in(tenant_id, employee_id, location_id, {
                  reason: "test clock-in",
                });
              } else {
                await service.clock_out(tenant_id, employee_id, {});
              }
            } catch (e) {
              // Expected rejections (double-in / out-with-no-open) must be 4xx.
              expectClientError(e);
            }

            // Every employee independently honours the single-open invariant.
            for (const id of Object.keys(employees)) {
              expect(openCount(attendance, tenant_id, id)).toBeLessThanOrEqual(1);
            }
          }
        },
      ),
      { numRuns: 150 },
    );
  });
});
