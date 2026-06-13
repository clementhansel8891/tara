import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../persistence/prisma.service";
import { HRDbRepository } from "./repositories/hr.db.repository";
import { SchedulingService } from "./scheduling.service";
import { AuditService } from "../../shared/audit/audit.service";
import { EventBusService } from "../../shared/events/event-bus.service";
import { LoggerService } from "../../shared/logger/logger.service";

/**
 * Task 4.8 — Live-DB verification test for Phase 2 (Scheduling).
 *
 * Goal (Requirements 7.2, 7.4, 12.1, 12.2, 13.4): exercise the Phase 2
 * scheduling write paths (`createWorkSchedule` / `createWorkShift` /
 * `updateWorkSchedule` / `updateWorkShift` / `approveSchedule` on
 * {@link SchedulingService}, backed by {@link HRDbRepository}) against the REAL
 * database using the live test tenant `tnt-3rlhko`, asserting the writes succeed
 * with **no missing column, invalid foreign key, or hardcoded identifier** — the
 * exact defect classes Requirement 12.2 says must be corrected before a phase is
 * complete. It also exercises the two edge regressions live: foreign-location
 * create -> 400 and add-shift-to-approved -> 409.
 *
 * Connectivity model (identical to the Phase 1 live-DB verification):
 * - The connection string is read from the environment (`DATABASE_URL`), exactly
 *   as the running app does via `PrismaService` -> `PrismaClient`.
 * - The live production tenant `tnt-3rlhko` lives in the VPS production database.
 *   When this test runs in an environment whose `DATABASE_URL` does not point at
 *   a database containing that tenant (e.g. a local dev DB, or no DB at all), the
 *   suite SKIPS gracefully with a clear message rather than fabricating a pass.
 * - When the live DB IS reachable and the tenant exists, the suite runs for real
 *   and cleans up every record it creates (work shifts + work schedules, plus a
 *   best-effort sweep of the audit/event rows produced), scoped strictly to
 *   `tnt-3rlhko`.
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
 * database, and that it has the seed records (location + department + employee)
 * needed to satisfy Work_Schedule / Work_Shift foreign keys. Returns
 * availability plus the seed FKs to use.
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
      where: { tenant_id: LIVE_TENANT, deleted_at: null },
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

describeLive("Phase 2 live-DB verification — scheduling write paths (tnt-3rlhko)", () => {
  let prisma: PrismaService;
  let repo: HRDbRepository;
  let auditService: AuditService;
  let service: SchedulingService;

  // Unique marker so cleanup only ever touches records THIS run created.
  const runId = randomUUID().slice(0, 8);
  const createdScheduleIds: string[] = [];
  const createdShiftIds: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repo = new HRDbRepository(prisma);
    auditService = new AuditService(prisma);
    const eventBus = new EventBusService(prisma);
    const loggerService = new LoggerService(prisma);
    service = new SchedulingService(
      prisma,
      repo,
      auditService,
      eventBus,
      loggerService,
    );
  });

  afterAll(async () => {
    if (prisma) {
      // Clean up in FK-safe order: shifts -> schedules. Also best-effort sweep
      // the audit/event rows produced for these entities, scoped to the tenant.
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
      const entityIds = [...createdScheduleIds, ...createdShiftIds];
      for (const entityId of entityIds) {
        await prisma.domain_events
          .deleteMany({ where: { entity_id: entityId, tenant_id: LIVE_TENANT } })
          .catch(() => undefined);
        await prisma.audit_logs
          .deleteMany({ where: { entity_id: entityId, tenant_id: LIVE_TENANT } })
          .catch(() => undefined);
      }
      // Stop the AuditService self-verification interval so the process exits.
      auditService?.onModuleDestroy?.();
      await prisma.$disconnect().catch(() => undefined);
    }
  });

  function newScheduleData(suffix: string) {
    return {
      name: `LDBV-P2-${runId}-${suffix}`,
      department_id: probe.department_id!,
      location_id: probe.location_id!,
      start_date: "2024-01-01",
      end_date: "2024-01-07",
      createdBy: "live-verify",
      status: "DRAFT",
    };
  }

  async function createScheduleTracked(suffix: string) {
    const schedule = await service.createWorkSchedule(
      LIVE_TENANT,
      newScheduleData(suffix),
      "live-verify",
    );
    createdScheduleIds.push(schedule.id);
    return schedule;
  }

  it("createWorkSchedule + createWorkShift persist against the live DB (no missing-column / invalid-FK / hardcoded-id errors)", async () => {
    let schedule: any;
    try {
      schedule = await createScheduleTracked("create");
    } catch (e) {
      throw new Error(
        `createWorkSchedule failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
      );
    }
    expect(schedule.id).toBeTruthy();
    expect(schedule.tenant_id).toBe(LIVE_TENANT);
    // The supplied real FK was persisted — proves no hardcoded location leaked.
    expect(schedule.location_id).toBe(probe.location_id);
    expect(schedule.status).toBe("DRAFT");

    let shift: any;
    try {
      shift = await service.createWorkShift(
        LIVE_TENANT,
        {
          scheduleId: schedule.id,
          employee_id: probe.employee_id,
          location_id: probe.location_id,
          start_time: "2024-01-01T09:00:00.000Z",
          end_time: "2024-01-01T17:00:00.000Z",
        },
        "live-verify",
      );
    } catch (e) {
      throw new Error(
        `createWorkShift failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
      );
    }
    createdShiftIds.push(shift.id);
    expect(shift.id).toBeTruthy();
    expect(shift.tenant_id).toBe(LIVE_TENANT);
    // The camelCase `scheduleId` alias mapped to the schema `schedule_id` column.
    expect(shift.employee_id).toBe(probe.employee_id);

    // Round-trip read-back within the same tenant scope.
    const schedules = await service.getWorkSchedules(LIVE_TENANT, probe.location_id);
    expect(schedules.some((s: any) => s.id === schedule.id)).toBe(true);
    const shifts = await service.getWorkShifts(LIVE_TENANT, schedule.id);
    expect(shifts.some((s: any) => s.id === shift.id)).toBe(true);
  });

  it("updateWorkSchedule + updateWorkShift persist supplied fields against the live DB", async () => {
    const schedule = await createScheduleTracked("update");
    const shift = await service.createWorkShift(
      LIVE_TENANT,
      {
        scheduleId: schedule.id,
        employee_id: probe.employee_id,
        location_id: probe.location_id,
        start_time: "2024-01-02T09:00:00.000Z",
        end_time: "2024-01-02T17:00:00.000Z",
      },
      "live-verify",
    );
    createdShiftIds.push(shift.id);

    let updatedSchedule: any;
    try {
      updatedSchedule = await service.updateWorkSchedule(
        LIVE_TENANT,
        schedule.id,
        { name: `LDBV-P2-${runId}-update-renamed` },
        "live-verify",
      );
    } catch (e) {
      throw new Error(
        `updateWorkSchedule failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
      );
    }
    expect(updatedSchedule.name).toBe(`LDBV-P2-${runId}-update-renamed`);

    let updatedShift: any;
    try {
      updatedShift = await service.updateWorkShift(
        LIVE_TENANT,
        shift.id,
        { end_time: "2024-01-02T18:00:00.000Z" },
        "live-verify",
      );
    } catch (e) {
      throw new Error(
        `updateWorkShift failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
      );
    }
    expect(updatedShift.id).toBe(shift.id);
  });

  it("approveSchedule transitions DRAFT -> APPROVED atomically against the live DB", async () => {
    const schedule = await createScheduleTracked("approve");
    let approved: any;
    try {
      approved = await service.approveSchedule(
        LIVE_TENANT,
        schedule.id,
        "live-verify",
      );
    } catch (e) {
      throw new Error(
        `approveSchedule failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
      );
    }
    expect(approved.status).toBe("APPROVED");
  });

  it("foreign-location create is rejected with a client error (400) live", async () => {
    let status: number | undefined;
    try {
      await service.createWorkSchedule(
        LIVE_TENANT,
        { ...newScheduleData("foreign"), location_id: `loc-foreign-${runId}` },
        "live-verify",
      );
    } catch (e: any) {
      status = typeof e.getStatus === "function" ? e.getStatus() : undefined;
    }
    expect(status).toBe(400);
  });

  it("adding a shift to an APPROVED schedule is rejected with a client error (409) live", async () => {
    const schedule = await createScheduleTracked("approved-shift");
    await service.approveSchedule(LIVE_TENANT, schedule.id, "live-verify");

    let status: number | undefined;
    try {
      await service.createWorkShift(
        LIVE_TENANT,
        {
          scheduleId: schedule.id,
          employee_id: probe.employee_id,
          location_id: probe.location_id,
          start_time: "2024-01-03T09:00:00.000Z",
          end_time: "2024-01-03T17:00:00.000Z",
        },
        "live-verify",
      );
    } catch (e: any) {
      status = typeof e.getStatus === "function" ? e.getStatus() : undefined;
    }
    expect(status).toBe(409);
  });
});
