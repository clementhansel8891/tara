import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../persistence/prisma.service";
import { HRDbRepository } from "./repositories/hr.db.repository";

/**
 * Task 4.8 — Live-DB verification test for Phase 2 (Scheduling).
 *
 * Goal (Requirements 12.1, 12.2, 13.4): exercise the Phase 2 scheduling write
 * paths (`createWorkSchedule` -> `createWorkShift` -> `approveWorkSchedule` on
 * {@link HRDbRepository}) against the REAL database using the live test tenant
 * `tnt-3rlhko`, asserting the writes succeed with **no missing column, invalid
 * foreign key, or hardcoded identifier** — the exact defect classes Requirement
 * 12.2 says must be corrected before a phase is complete.
 *
 * Connectivity model (identical to the Phase 1 live-DB verification test):
 * - The connection string is read from the environment (`DATABASE_URL`), exactly
 *   as the running app does via `PrismaService` -> `PrismaClient`.
 * - The live production tenant `tnt-3rlhko` lives in the VPS production database.
 *   When this test runs in an environment whose `DATABASE_URL` does not point at
 *   a database containing that tenant (e.g. a local dev DB, or no DB at all), the
 *   suite SKIPS gracefully with a clear message rather than fabricating a pass.
 * - When the live DB IS reachable and the tenant exists, the suite runs for real
 *   and cleans up every record it creates (work shifts + work schedules), scoped
 *   strictly to `tnt-3rlhko`.
 *
 * This is an integration/smoke test, not a property test.
 */

const LIVE_TENANT = "tnt-3rlhko";

interface ProbeResult {
  available: boolean;
  reason?: string;
  location_id?: string;
  company_id?: string | null;
  department_id?: string;
  employee_id?: string;
}

/**
 * Probe whether the live test tenant is reachable in the currently-configured
 * database, and that it has at least one location + department + employee so the
 * schedule/shift foreign keys can be satisfied. Returns availability plus the
 * seed FKs to use.
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
    const location = await prisma.locations.findFirst({
      where: { tenant_id: LIVE_TENANT },
    });
    const department = await prisma.departments.findFirst({
      where: { tenant_id: LIVE_TENANT, deleted_at: null },
    });
    const employee = await prisma.employees.findFirst({
      where: { tenant_id: LIVE_TENANT },
    });
    if (!location || !department || !employee) {
      const missing = !location
        ? "location"
        : !department
          ? "department"
          : "employee";
      return {
        available: false,
        reason: `tenant '${LIVE_TENANT}' has no ${missing} to satisfy scheduling foreign keys`,
      };
    }
    return {
      available: true,
      location_id: location.id,
      company_id: location.company_id,
      department_id: department.id,
      employee_id: employee.id,
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
    `\n[Phase 2 live-DB verification] SKIPPED — ${probe.reason}.\n` +
      `  This test is structured to run against the live test tenant '${LIVE_TENANT}'.\n` +
      `  Point DATABASE_URL at a database containing that tenant to execute it for real.\n`,
  );
}

const describeLive = probe.available ? describe : describe.skip;

describeLive(
  "Phase 2 live-DB verification — scheduling write paths (tnt-3rlhko)",
  () => {
    let prisma: PrismaService;
    let repo: HRDbRepository;

    // Unique marker so cleanup only ever touches records THIS run created.
    const runId = randomUUID().slice(0, 8);
    const createdShiftIds: string[] = [];
    const createdScheduleIds: string[] = [];

    beforeAll(async () => {
      prisma = new PrismaService();
      await prisma.$connect();
      repo = new HRDbRepository(prisma);
    });

    afterAll(async () => {
      // Clean up in FK-safe order: shifts -> schedules, scoped to the tenant.
      if (prisma) {
        for (const id of createdShiftIds) {
          await prisma.hr_work_shifts
            .deleteMany({ where: { id, tenant_id: LIVE_TENANT } })
            .catch(() => undefined);
        }
        for (const id of createdScheduleIds) {
          await prisma.hr_work_schedules
            .deleteMany({ where: { id, tenant_id: LIVE_TENANT } })
            .catch(() => undefined);
        }
        await prisma.$disconnect().catch(() => undefined);
      }
    });

    it("createWorkSchedule -> createWorkShift -> approveWorkSchedule persist against the live DB with no missing-column / invalid-FK / hardcoded-identifier errors", async () => {
      // 1. Create a Work_Schedule for the real tenant scope.
      let schedule: any;
      try {
        schedule = await repo.createWorkSchedule(LIVE_TENANT, {
          department_id: probe.department_id!,
          location_id: probe.location_id!,
          name: `LiveVerify Phase2 ${runId}`,
          start_date: "2024-01-01",
          end_date: "2024-01-07",
          status: "DRAFT",
          createdBy: probe.employee_id!,
        });
      } catch (e) {
        throw new Error(
          `createWorkSchedule failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
        );
      }
      expect(schedule.id).toBeTruthy();
      createdScheduleIds.push(schedule.id);
      // tenant comes from context, never a hardcoded value.
      expect(schedule.tenant_id).toBe(LIVE_TENANT);
      // The supplied real location FK was persisted — proves no hardcoded
      // location fallback leaked into the write path.
      expect(schedule.location_id).toBe(probe.location_id);
      expect(schedule.status).toBe("DRAFT");

      // 2. Create a Work_Shift on the schedule. The service maps the camelCase
      //    `scheduleId` alias -> `schedule_id`; the repository accepts either,
      //    so we pass the schema-aligned shape here.
      let shift: any;
      try {
        shift = await repo.createWorkShift(LIVE_TENANT, {
          schedule_id: schedule.id,
          employee_id: probe.employee_id!,
          location_id: probe.location_id!,
          start_time: "2024-01-01T09:00:00.000Z",
          end_time: "2024-01-01T17:00:00.000Z",
        });
      } catch (e) {
        throw new Error(
          `createWorkShift failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
        );
      }
      expect(shift.id).toBeTruthy();
      createdShiftIds.push(shift.id);
      expect(shift.tenant_id).toBe(LIVE_TENANT);
      expect(shift.scheduleId).toBe(schedule.id);
      expect(shift.employee_id).toBe(probe.employee_id);

      // Round-trip read-back within the same tenant scope confirms persistence.
      const shifts = await repo.getWorkShifts(LIVE_TENANT, schedule.id);
      expect(shifts.some((s: any) => s.id === shift.id)).toBe(true);

      // 3. Approve (publish) the schedule atomically.
      let approved: any;
      try {
        approved = await repo.approveWorkSchedule(
          LIVE_TENANT,
          schedule.id,
          probe.employee_id!,
        );
      } catch (e) {
        throw new Error(
          `approveWorkSchedule failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
        );
      }
      expect(approved.status).toBe("APPROVED");

      // Read-back confirms the approved transition was committed in scope.
      const schedulesAfter = await repo.getWorkSchedules(
        LIVE_TENANT,
        probe.location_id,
      );
      const persisted = schedulesAfter.find((s: any) => s.id === schedule.id);
      expect(persisted).toBeTruthy();
      expect(persisted!.status).toBe("APPROVED");
      expect(persisted!.tenant_id).toBe(LIVE_TENANT);
    });
  },
);
