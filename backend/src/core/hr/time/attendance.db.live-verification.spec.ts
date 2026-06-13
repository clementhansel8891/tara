import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "../../../persistence/prisma.service";
import { HRDbRepository } from "../repositories/hr.db.repository";
import { TimeAndAttendanceService } from "./time.service";

/**
 * Task 6.6 — Live-DB verification test for Phase 3 (Time & Attendance).
 *
 * Goal (Requirements 12.1, 12.2, 13.4): exercise the Phase 3 attendance write
 * paths (`clock_in` -> `clock_out` on {@link TimeAndAttendanceService}) against
 * the REAL database using the live test tenant `tnt-3rlhko`, asserting the writes
 * succeed with **no missing column, invalid foreign key, or hardcoded
 * identifier** — the exact defect classes Requirement 12.2 says must be corrected
 * before a phase is complete.
 *
 * Connectivity model (identical to the Phase 1 & 2 live-DB verification tests):
 * - The connection string is read from the environment (`DATABASE_URL`), exactly
 *   as the running app does via `PrismaService` -> `PrismaClient`.
 * - The live production tenant `tnt-3rlhko` lives in the VPS production database.
 *   When this test runs in an environment whose `DATABASE_URL` does not point at
 *   a database containing that tenant (e.g. a local dev DB, or no DB at all), the
 *   suite SKIPS gracefully with a clear message rather than fabricating a pass.
 * - When the live DB IS reachable and the tenant exists, the suite runs for real
 *   and cleans up every attendance record it creates, scoped strictly to
 *   `tnt-3rlhko`.
 *
 * The attendance write path is driven through the canonical
 * {@link TimeAndAttendanceService} with the real {@link HRDbRepository} and a
 * real {@link PrismaService}. The EventBus is a no-op stub so the verification is
 * isolated to the attendance-record SQL (create on clock-in / update on
 * clock-out) and does not pollute the live `domain_events` outbox.
 *
 * This is an integration/smoke test, not a property test.
 */

const LIVE_TENANT = "tnt-3rlhko";

interface ProbeResult {
  available: boolean;
  reason?: string;
  employee_id?: string;
  location_id?: string;
}

/**
 * Probe whether the live test tenant is reachable in the currently-configured
 * database, and that it has at least one active employee with a primary
 * `location_id` and NO currently-open attendance record (so a fresh clock-in
 * does not trip the single-open-record guard). Returns availability plus the
 * employee + location to drive the write path.
 */
async function probeLiveTenant(): Promise<ProbeResult> {
  if (!process.env.DATABASE_URL) {
    return { available: false, reason: "DATABASE_URL is not set" };
  }
  const prisma = new PrismaService();
  try {
    await prisma.$connect();
    const tenant = await prisma.tenants.findUnique({ where: { id: LIVE_TENANT } });
    if (!tenant) {
      return {
        available: false,
        reason: `tenant '${LIVE_TENANT}' not found in the connected database (DATABASE_URL points at a database without the live test tenant)`,
      };
    }

    // Find an active, in-scope employee with a primary location that currently
    // has no open attendance record (check_out_time === null).
    const employees = await prisma.employees.findMany({
      where: {
        tenant_id: LIVE_TENANT,
        status: "active",
        deleted_at: null,
        location_id: { not: null },
      },
      take: 25,
    });
    if (employees.length === 0) {
      return {
        available: false,
        reason: `tenant '${LIVE_TENANT}' has no active employee with a primary location to drive clock-in/out`,
      };
    }

    for (const emp of employees) {
      const open = await prisma.hr_attendance_records.findFirst({
        where: {
          tenant_id: LIVE_TENANT,
          employee_id: emp.id,
          check_out_time: null,
          deleted_at: null,
        },
      });
      if (!open) {
        return {
          available: true,
          employee_id: emp.id,
          location_id: emp.location_id as string,
        };
      }
    }

    return {
      available: false,
      reason: `every probed employee in '${LIVE_TENANT}' already has an open attendance record; cannot safely exercise a fresh clock-in`,
    };
  } catch (e) {
    return {
      available: false,
      reason: `database connection failed: ${(e as Error).message.split("\n")[0]}`,
    };
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

// Resolve connectivity once, before the suite is registered, so we can report a
// true SKIP (not a false PASS) when the live DB / tenant is unavailable.
const probe = await probeLiveTenant();

if (!probe.available) {
  // eslint-disable-next-line no-console
  console.warn(
    `\n[Phase 3 live-DB verification] SKIPPED — ${probe.reason}.\n` +
      `  This test is structured to run against the live test tenant '${LIVE_TENANT}'.\n` +
      `  Point DATABASE_URL at a database containing that tenant to execute it for real.\n`,
  );
}

const describeLive = probe.available ? describe : describe.skip;

describeLive(
  "Phase 3 live-DB verification — attendance write paths (tnt-3rlhko)",
  () => {
    let prisma: PrismaService;
    let service: TimeAndAttendanceService;

    const createdRecordIds: string[] = [];

    beforeAll(async () => {
      prisma = new PrismaService();
      await prisma.$connect();
      const repo = new HRDbRepository(prisma);
      // No-op event bus: isolates the verification to the attendance-record SQL
      // and avoids writing to the live domain_events outbox.
      const eventBus = { publish: async () => undefined } as any;
      service = new TimeAndAttendanceService(eventBus, repo, prisma);
    });

    afterAll(async () => {
      // Clean up every attendance record THIS run created, scoped to the tenant.
      if (prisma) {
        for (const id of createdRecordIds) {
          await prisma.hr_attendance_records
            .deleteMany({ where: { id, tenant_id: LIVE_TENANT } })
            .catch(() => undefined);
        }
        await prisma.$disconnect().catch(() => undefined);
      }
    });

    it("clock_in -> clock_out persist against the live DB with no missing-column / invalid-FK / hardcoded-identifier errors", async () => {
      // 1. Clock in at the employee's PRIMARY location (unscheduled path), which
      //    requires a reason. tenant comes from context, never a hardcoded value.
      let record: any;
      try {
        record = await service.clock_in(
          LIVE_TENANT,
          probe.employee_id!,
          probe.location_id!,
          { source: "WEB", reason: "Phase 3 live-DB verification" },
        );
      } catch (e) {
        throw new Error(
          `clock_in failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
        );
      }
      expect(record.id).toBeTruthy();
      createdRecordIds.push(record.id);
      // The supplied real tenant/employee/location FKs were persisted — proves no
      // hardcoded identifier leaked into the write path.
      expect(record.tenant_id).toBe(LIVE_TENANT);
      expect(record.employee_id).toBe(probe.employee_id);
      expect(record.location_id).toBe(probe.location_id);
      // An open session was created (no check-out yet).
      expect(record.check_out_time).toBeFalsy();

      // 2. Clock out updates the matching open record with a check-out time.
      let closed: any;
      try {
        closed = await service.clock_out(LIVE_TENANT, probe.employee_id!, {
          source: "WEB",
        });
      } catch (e) {
        throw new Error(
          `clock_out failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
        );
      }
      expect(closed.id).toBe(record.id);
      expect(closed.tenant_id).toBe(LIVE_TENANT);
      // The session is now closed: check_out_time is set and duration computed.
      expect(closed.check_out_time).toBeTruthy();
      expect(typeof closed.work_duration_minutes).toBe("number");

      // Round-trip read-back within the same tenant scope confirms persistence of
      // the closed session.
      const persisted = await prisma.hr_attendance_records.findFirst({
        where: { id: record.id, tenant_id: LIVE_TENANT },
      });
      expect(persisted).toBeTruthy();
      expect(persisted!.check_out_time).toBeTruthy();
    });
  },
);
