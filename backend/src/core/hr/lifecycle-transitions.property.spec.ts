// Feature: hr-module-stabilization, Property 6: Lifecycle transitions succeed only from valid states
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { HttpException } from "@nestjs/common";
import { TimeAndAttendanceService } from "./time/time.service";
import { SchedulingService } from "./scheduling.service";

/**
 * Property 6: Lifecycle transitions succeed only from valid states
 * Validates: Requirements 7.4, 8.2, 8.3, 8.4, 9.2, 9.3, 9.4, 10.5
 *
 * For any stateful HR entity and any requested transition, the transition
 * succeeds and persists the new state (recording the actor where applicable) if
 * and only if it is a valid edge from the entity's current state; otherwise it
 * is rejected with a client-error (4xx) response and the state is left unchanged.
 *
 * ── Scope of this property test (per design Requirement 12.3 "implement once,
 *    parameterised; place in the earliest phase where the property applies") ──
 *
 *   • PRIMARY — Attendance lifecycle (Phase 3, implemented now):
 *     `TimeAndAttendanceService.clock_in` / `clock_out`. The attendance state
 *     machine is { NO_OPEN --(IN)--> OPEN --(OUT)--> NO_OPEN }. Valid edges:
 *       - IN  is valid only from NO_OPEN (no open record exists)
 *       - OUT is valid only from OPEN    (an open record exists)
 *     Invalid edges (IN from OPEN, OUT from NO_OPEN) must be rejected with a 4xx
 *     `BadRequestException` and leave the open-record set unchanged
 *     (Requirements 8.2, 8.3, 8.4).
 *
 *   • SECONDARY — Work_Schedule lifecycle guard (Phase 2, implemented now):
 *     `SchedulingService.createWorkShift` — adding a shift is a valid edge only
 *     when the owning schedule is NOT finalised (APPROVED). Adding a shift to an
 *     APPROVED schedule is an invalid edge → rejected with a 4xx
 *     (`ConflictException`) and no shift is persisted (Requirement 7.4).
 *
 *   • DEFERRED — Leave (9.2/9.3/9.4) and Payroll (10.5) lifecycles are built in
 *     Phases 4–5. Their valid/invalid edges are validated by the Phase 4/5
 *     example tests (tasks 8.4 / 10.6). This single parameterised property is
 *     placed in Phase 3 to catch lifecycle errors as early as the property first
 *     applies; the attendance machine is the central, currently-implemented
 *     target exercised here with randomised transition sequences.
 *
 * Strategy (design Testing Strategy): drive the services through a mockable
 * prisma/repository boundary (no live DB). `$transaction` runs the callback
 * against an in-memory `tx`; the attendance store mimics the `where` filters the
 * service relies on (open record = `check_out_time: null`).
 */

/* -------------------------------------------------------------------------- */
/* Attendance fake prisma / repository boundary                               */
/* -------------------------------------------------------------------------- */

type AttRecord = {
  id: string;
  tenant_id: string;
  employee_id: string;
  location_id: string;
  check_in_time: Date | null;
  check_out_time: Date | null;
  created_at: Date;
  deleted_at: Date | null;
  work_shift_id?: string | null;
  metadata?: Record<string, unknown>;
  [k: string]: unknown;
};

/** In-memory attendance store standing in for the live `attendance` table. */
class AttendanceStore {
  records: AttRecord[] = [];

  /** Number of currently OPEN (un-clocked-out, not deleted) records. */
  openCount(tenant_id: string, employee_id: string): number {
    return this.records.filter(
      (r) =>
        r.tenant_id === tenant_id &&
        r.employee_id === employee_id &&
        r.check_out_time == null &&
        r.deleted_at == null,
    ).length;
  }

  /** Total persisted records — used to assert "state unchanged" on rejection. */
  total(): number {
    return this.records.length;
  }
}

function makeAttendancePrisma(store: AttendanceStore) {
  const matchesOpen = (r: AttRecord, where: any) =>
    r.tenant_id === where.tenant_id &&
    r.employee_id === where.employee_id &&
    (where.check_out_time === null ? r.check_out_time == null : true) &&
    (where.deleted_at === null ? r.deleted_at == null : true);

  return {
    hr_attendance_records: {
      findFirst: async ({ where, orderBy }: any) => {
        let matches = store.records.filter((r) => matchesOpen(r, where));
        if (orderBy?.created_at === "desc") matches = matches.slice().reverse();
        return matches[0] ?? null;
      },
      create: async ({ data }: any) => {
        const record: AttRecord = {
          deleted_at: null,
          created_at: new Date(),
          check_out_time: null,
          ...data,
        };
        store.records.push(record);
        return record;
      },
      update: async ({ where, data }: any) => {
        // Target the open record for this id first (the one clock_out closes).
        let idx = store.records.findIndex(
          (r) => r.id === where.id && r.check_out_time == null,
        );
        if (idx < 0) idx = store.records.findIndex((r) => r.id === where.id);
        store.records[idx] = { ...store.records[idx], ...data };
        return store.records[idx];
      },
    },
    // No scheduled shift -> clock_in takes the UNSCHEDULED branch (we supply a
    // reason so it is accepted) and clock_out skips shift math (work_shift_id null).
    hr_work_shifts: {
      findFirst: async () => null,
      findUnique: async () => null,
    },
    async $transaction<T>(cb: (tx: any) => Promise<T>): Promise<T> {
      return cb(this);
    },
  } as any;
}

const EMPLOYEE_LOCATION = "loc-1";

function makeAttendanceRepo() {
  return {
    getEmployeeById: async (_tenant_id: string, employee_id: string) => ({
      id: employee_id,
      location_id: EMPLOYEE_LOCATION,
      department_id: "dep-1",
    }),
  } as any;
}

const noopEventBus = { publish: async () => ({ ok: true }) } as any;

function makeAttendanceService(store: AttendanceStore) {
  return new TimeAndAttendanceService(
    noopEventBus,
    makeAttendanceRepo(),
    makeAttendancePrisma(store),
  );
}

/** Assert a caught value is a 4xx HttpException (a client error, never 5xx). */
function expectClientError(err: unknown) {
  expect(err).toBeInstanceOf(HttpException);
  const status = (err as HttpException).getStatus();
  expect(status).toBeGreaterThanOrEqual(400);
  expect(status).toBeLessThan(500);
}

const idArb = fc
  .string({ minLength: 1, maxLength: 10 })
  .map((s) => `id-${s.replace(/\s/g, "_")}`);

type Transition = "IN" | "OUT";

describe("Property 6: Lifecycle transitions succeed only from valid states", () => {
  it("attendance: IN/OUT succeed iff a valid edge; invalid edges -> 4xx with state unchanged", async () => {
    await fc.assert(
      fc.asyncProperty(
        idArb, // tenant_id
        idArb, // employee_id
        fc.boolean(), // start from an OPEN state? (seed one clock-in)
        fc.array(fc.constantFrom<Transition>("IN", "OUT"), {
          minLength: 1,
          maxLength: 12,
        }),
        async (tenant_id, employee_id, startOpen, sequence) => {
          const store = new AttendanceStore();
          const service = makeAttendanceService(store);

          // Model state: `open` = the employee currently has an open record.
          let open = false;

          // Optionally seed a valid starting OPEN state via a real clock-in so
          // the sequence can begin from either NO_OPEN or OPEN.
          if (startOpen) {
            await service.clock_in(tenant_id, employee_id, EMPLOYEE_LOCATION, {
              reason: "seed",
              source: "WEB",
            });
            open = true;
            expect(store.openCount(tenant_id, employee_id)).toBe(1);
          }

          for (const t of sequence) {
            const isValidEdge = t === "IN" ? !open : open;
            const totalBefore = store.total();
            const openBefore = store.openCount(tenant_id, employee_id);

            if (isValidEdge) {
              // Valid edge: transition succeeds and persists the new state.
              if (t === "IN") {
                const rec = await service.clock_in(
                  tenant_id,
                  employee_id,
                  EMPLOYEE_LOCATION,
                  { reason: "work", source: "WEB" },
                );
                expect(rec).toBeTruthy();
                open = true;
                expect(store.openCount(tenant_id, employee_id)).toBe(1);
              } else {
                const rec = await service.clock_out(tenant_id, employee_id, {});
                expect(rec).toBeTruthy();
                expect((rec as any).check_out_time).toBeTruthy();
                open = false;
                expect(store.openCount(tenant_id, employee_id)).toBe(0);
              }
            } else {
              // Invalid edge: rejected with a 4xx, and the state is unchanged.
              let caught: unknown;
              try {
                if (t === "IN") {
                  await service.clock_in(
                    tenant_id,
                    employee_id,
                    EMPLOYEE_LOCATION,
                    { reason: "work", source: "WEB" },
                  );
                } else {
                  await service.clock_out(tenant_id, employee_id, {});
                }
              } catch (e) {
                caught = e;
              }
              expect(caught).toBeDefined();
              expectClientError(caught);
              // State unchanged: no record added/removed, open-set identical.
              expect(store.total()).toBe(totalBefore);
              expect(store.openCount(tenant_id, employee_id)).toBe(openBefore);
            }

            // Invariant that underpins the machine: never more than one open.
            expect(
              store.openCount(tenant_id, employee_id),
            ).toBeLessThanOrEqual(1);
          }
        },
      ),
      { numRuns: 120 },
    );
  });

  /* ------------------------------------------------------------------------ */
  /* Work_Schedule lifecycle guard (secondary, Phase 2)                       */
  /* ------------------------------------------------------------------------ */

  function makeSchedulingService(
    schedules: Array<{ id: string; status: string }>,
    onCreateShift: () => void,
  ) {
    const fakePrisma = {
      locations: { findFirst: async () => ({ id: "loc", tenant_id: "t" }) },
      async $transaction<T>(cb: (tx: any) => Promise<T>): Promise<T> {
        return cb({ __tx: true });
      },
    } as any;
    const fakeRepo = {
      getWorkSchedules: async () => schedules,
      createWorkShift: async () => {
        onCreateShift();
        return { id: "shift-1" };
      },
    } as any;
    const noopAudit = { log: async () => ({ ok: true }) } as any;
    const noopLogger = { log: () => {}, error: () => {} } as any;
    return new SchedulingService(
      fakePrisma,
      fakeRepo,
      noopAudit,
      noopEventBus,
      noopLogger,
    );
  }

  it("work schedule: adding a shift succeeds iff the schedule is not APPROVED; invalid edge -> 4xx, no shift persisted", async () => {
    await fc.assert(
      fc.asyncProperty(
        idArb, // tenant_id
        idArb, // schedule_id
        idArb, // employee_id
        fc.constantFrom("DRAFT", "APPROVED", "PUBLISHED"),
        async (tenant_id, schedule_id, employee_id, status) => {
          let shiftPersisted = 0;
          const service = makeSchedulingService(
            [{ id: schedule_id, status }],
            () => {
              shiftPersisted += 1;
            },
          );

          const data: any = {
            schedule_id,
            location_id: "loc",
            employee_id,
            start_time: "09:00",
            end_time: "17:00",
          };

          if (status === "APPROVED") {
            // Invalid edge: cannot add a shift to a finalised schedule.
            let caught: unknown;
            try {
              await service.createWorkShift(tenant_id, data, "user-1");
            } catch (e) {
              caught = e;
            }
            expect(caught).toBeDefined();
            expectClientError(caught);
            // State unchanged: the shift write never happened.
            expect(shiftPersisted).toBe(0);
          } else {
            // Valid edge: the shift is persisted.
            const result = await service.createWorkShift(
              tenant_id,
              data,
              "user-1",
            );
            expect(result).toBeTruthy();
            expect(shiftPersisted).toBe(1);
          }
        },
      ),
      { numRuns: 120 },
    );
  });
});
