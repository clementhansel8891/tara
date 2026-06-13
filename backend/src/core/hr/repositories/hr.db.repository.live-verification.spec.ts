import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../../persistence/prisma.service";
import { HRDbRepository } from "./hr.db.repository";
import type { CreateEmployeeDto } from "../dto/create-employee.dto";

/**
 * Task 2.7 — Live-DB verification test for Phase 1 (Employees / Roster).
 *
 * Goal (Requirements 12.1, 12.2, 13.4): exercise the Phase 1 employee write
 * paths (`createEmployee` / `updateEmployee` / `deactivateEmployee` on
 * {@link HRDbRepository}) against the REAL database using the live test tenant
 * `tnt-3rlhko`, asserting the writes succeed with **no missing column, invalid
 * foreign key, or hardcoded identifier** — the exact defect classes Requirement
 * 12.2 says must be corrected before a phase is complete.
 *
 * Connectivity model:
 * - The connection string is read from the environment (`DATABASE_URL`), exactly
 *   as the running app does via `PrismaService` -> `PrismaClient`.
 * - The live production tenant `tnt-3rlhko` lives in the VPS production database.
 *   When this test runs in an environment whose `DATABASE_URL` does not point at
 *   a database containing that tenant (e.g. a local dev DB, or no DB at all), the
 *   suite SKIPS gracefully with a clear message rather than fabricating a pass.
 * - When the live DB IS reachable and the tenant exists, the suite runs for real
 *   and cleans up every record it creates (employee + the auto-provisioned user
 *   and user_companies association), scoped strictly to `tnt-3rlhko`.
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
}

/**
 * Probe whether the live test tenant is reachable in the currently-configured
 * database, and that it has at least one location + department so employee FKs
 * can be satisfied. Returns availability plus the seed FKs to use.
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
    if (!location || !department) {
      return {
        available: false,
        reason: `tenant '${LIVE_TENANT}' has no ${!location ? "location" : "department"} to satisfy employee foreign keys`,
      };
    }
    return {
      available: true,
      location_id: location.id,
      company_id: location.company_id,
      department_id: department.id,
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
    `\n[Phase 1 live-DB verification] SKIPPED — ${probe.reason}.\n` +
      `  This test is structured to run against the live test tenant '${LIVE_TENANT}'.\n` +
      `  Point DATABASE_URL at a database containing that tenant to execute it for real.\n`,
  );
}

const describeLive = probe.available ? describe : describe.skip;

describeLive("Phase 1 live-DB verification — employee write paths (tnt-3rlhko)", () => {
  let prisma: PrismaService;
  let repo: HRDbRepository;

  // Unique marker so cleanup only ever touches records THIS run created.
  const runId = randomUUID().slice(0, 8);
  const createdEmployeeIds: string[] = [];
  const createdUserIds: string[] = [];

  function newEmployeeDto(suffix: string): CreateEmployeeDto {
    return {
      employee_code: `LDBV-${runId}-${suffix}`,
      first_name: "LiveVerify",
      last_name: `Phase1-${suffix}`,
      email: `livedbverify+${runId}-${suffix}@verify.local`,
      department_id: probe.department_id!,
      location_id: probe.location_id!,
      company_id: probe.company_id ?? undefined,
      role_title: "Verification Engineer",
      employment_type: "full_time" as any,
      hire_date: "2024-01-01",
    } as CreateEmployeeDto;
  }

  async function createTracked(suffix: string) {
    const created = await repo.createEmployee(LIVE_TENANT, newEmployeeDto(suffix));
    createdEmployeeIds.push(created.id);
    if (created.user_id) createdUserIds.push(created.user_id);
    return created;
  }

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    repo = new HRDbRepository(prisma);
  });

  afterAll(async () => {
    // Clean up in FK-safe order: employees -> user_companies -> users.
    if (prisma) {
      for (const id of createdEmployeeIds) {
        await prisma.employees.deleteMany({ where: { id, tenant_id: LIVE_TENANT } }).catch(() => undefined);
      }
      for (const userId of createdUserIds) {
        await prisma.user_companies
          .deleteMany({ where: { user_id: userId, tenant_id: LIVE_TENANT } })
          .catch(() => undefined);
        await prisma.users
          .deleteMany({ where: { id: userId, tenant_id: LIVE_TENANT } })
          .catch(() => undefined);
      }
      await prisma.$disconnect().catch(() => undefined);
    }
  });

  it("createEmployee persists against the live DB with no missing-column / invalid-FK / hardcoded-identifier errors", async () => {
    let created: Awaited<ReturnType<HRDbRepository["createEmployee"]>>;
    try {
      created = await createTracked("create");
    } catch (e) {
      // Surface the precise DB-level defect class (P2022 missing column, P2003
      // invalid FK, etc.) so a failure is actionable per Requirement 12.2.
      throw new Error(
        `createEmployee failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
      );
    }

    expect(created.id).toBeTruthy();
    // tenant comes from context, never a hardcoded value.
    expect(created.tenant_id).toBe(LIVE_TENANT);
    // The supplied real FKs were persisted — proves no hardcoded "loc-default"
    // / company fallback leaked into the write path.
    expect(created.location_id).toBe(probe.location_id);
    if (probe.company_id) expect(created.company_id).toBe(probe.company_id);
    // role_title -> `positions` column mapping survived the round trip.
    expect(created.role_title).toBe("Verification Engineer");

    // Round-trip read-back within the same tenant scope.
    const readBack = await repo.getEmployeeById(LIVE_TENANT, created.id);
    expect(readBack).not.toBeNull();
    expect(readBack!.email).toBe(created.email);
    expect(readBack!.department_id).toBe(probe.department_id);
  });

  it("updateEmployee persists supplied fields against the live DB and reads back", async () => {
    const created = await createTracked("update");

    let updated: Awaited<ReturnType<HRDbRepository["updateEmployee"]>>;
    try {
      updated = await repo.updateEmployee(LIVE_TENANT, created.id, {
        first_name: "LiveVerifyUpdated",
        role_title: "Senior Verification Engineer",
        base_salary: 4242,
      } as any);
    } catch (e) {
      throw new Error(
        `updateEmployee failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
      );
    }

    expect(updated.first_name).toBe("LiveVerifyUpdated");
    expect(updated.role_title).toBe("Senior Verification Engineer");

    const readBack = await repo.getEmployeeById(LIVE_TENANT, created.id);
    expect(readBack!.first_name).toBe("LiveVerifyUpdated");
    expect(readBack!.role_title).toBe("Senior Verification Engineer");
    expect(readBack!.base_salary).toBe(4242);
    // tenant scope unchanged after update.
    expect(readBack!.tenant_id).toBe(LIVE_TENANT);
  });

  it("deactivateEmployee soft-deactivates against the live DB and retains the record", async () => {
    const created = await createTracked("deactivate");

    let deactivated: Awaited<ReturnType<HRDbRepository["deactivateEmployee"]>>;
    try {
      deactivated = await repo.deactivateEmployee(LIVE_TENANT, created.id);
    } catch (e) {
      throw new Error(
        `deactivateEmployee failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
      );
    }

    expect(deactivated.status).toBe("terminated");
    expect(deactivated.termination_date).toBeTruthy();

    // Record is retained (not hard-deleted) and still readable in scope.
    const readBack = await repo.getEmployeeById(LIVE_TENANT, created.id);
    expect(readBack).not.toBeNull();
    expect(readBack!.status).toBe("terminated");
  });
});
