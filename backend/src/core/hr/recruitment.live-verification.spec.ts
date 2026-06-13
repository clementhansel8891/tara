import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../persistence/prisma.service";
import { HRDbRepository } from "./repositories/hr.db.repository";
import { HrRecruitmentService } from "./hr-recruitment.service";

/**
 * Task 12.6 — Live-DB verification test for Phase 6 (Recruitment / Performance).
 *
 * Goal (Requirements 11.5, 12.1, 12.2, 13.4): exercise the Phase 6 recruitment
 * write paths (`createRequisition` -> `createCandidate` -> `hireCandidate` on
 * {@link HrRecruitmentService}, backed by {@link HRDbRepository}) against the
 * REAL database using the live test tenant `tnt-3rlhko`, asserting the writes
 * succeed with **no missing column, invalid foreign key, or hardcoded
 * identifier** — the exact defect classes Requirement 12.2 says must be
 * corrected before a phase is complete. `hireCandidate` is the atomic
 * employee-creation path (Requirement 11.2): hiring provisions a user, creates
 * the employee within the SAME `tenant_id`, and writes an initial contract — all
 * in one transaction.
 *
 * Connectivity model (identical to the Phase 1/2/3/4/5 live-DB verification
 * tests):
 * - The connection string is read from the environment (`DATABASE_URL`), exactly
 *   as the running app does via `PrismaService` -> `PrismaClient`.
 * - The live production tenant `tnt-3rlhko` lives in the VPS production database.
 *   When this test runs in an environment whose `DATABASE_URL` does not point at
 *   a database containing that tenant (e.g. a local dev DB, or no DB at all), the
 *   suite SKIPS gracefully with a clear message rather than fabricating a pass.
 * - When the live DB IS reachable and the tenant exists, the suite runs for real
 *   and cleans up every record it creates (contract, employee, user_companies,
 *   outbox event, candidate, requisition, user), scoped strictly to `tnt-3rlhko`.
 *
 * This is an integration/smoke test, not a property test.
 */

const LIVE_TENANT = "tnt-3rlhko";

interface ProbeResult {
  available: boolean;
  reason?: string;
  location_id?: string;
  department_id?: string;
}

/**
 * Probe whether the live test tenant is reachable in the currently-configured
 * database, and that it has at least one location + department so the
 * hire-candidate foreign keys (`location_id`, `department_id`) can be satisfied.
 * Returns availability plus the seed FKs to drive the write path.
 */
async function probeLiveTenant(): Promise<ProbeResult> {
  if (!process.env.DATABASE_URL) {
    return { available: false, reason: "DATABASE_URL is not set" };
  }
  const prisma = new PrismaService();
  try {
    await prisma.$connect();
    const tenant = await prisma.tenants.findUnique({
      where: { id: LIVE_TENANT },
    });
    if (!tenant) {
      return {
        available: false,
        reason: `tenant '${LIVE_TENANT}' not found in the connected database (DATABASE_URL points at a database without the live test tenant)`,
      };
    }
    const location = await prisma.locations.findFirst({
      where: { tenant_id: LIVE_TENANT, deleted_at: null },
      orderBy: { created_at: "asc" },
    });
    const department = await prisma.departments.findFirst({
      where: { tenant_id: LIVE_TENANT, deleted_at: null },
      orderBy: { created_at: "asc" },
    });
    if (!location || !department) {
      const missing = !location ? "location" : "department";
      return {
        available: false,
        reason: `tenant '${LIVE_TENANT}' has no ${missing} to satisfy recruitment/hire foreign keys`,
      };
    }
    return {
      available: true,
      location_id: location.id,
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
    `\n[Phase 6 live-DB verification] SKIPPED — ${probe.reason}.\n` +
      `  This test is structured to run against the live test tenant '${LIVE_TENANT}'.\n` +
      `  Point DATABASE_URL at a database containing that tenant to execute it for real.\n`,
  );
}

const describeLive = probe.available ? describe : describe.skip;

describeLive(
  "Phase 6 live-DB verification — recruitment write paths (tnt-3rlhko)",
  () => {
    let prisma: PrismaService;
    let service: HrRecruitmentService;

    // Unique marker so cleanup only ever touches records THIS run created.
    const runId = randomUUID().slice(0, 8);
    const candidateEmail = `live-verify-cand-${runId}@example.com`;

    const createdRequisitionIds: string[] = [];
    const createdCandidateIds: string[] = [];
    const createdEmployeeIds: string[] = [];

    beforeAll(async () => {
      prisma = new PrismaService();
      await prisma.$connect();
      const repo = new HRDbRepository(prisma);
      // No-op audit: isolates the verification to the recruitment SQL and avoids
      // writing to the live audit trail.
      const auditService = { log: async () => undefined } as any;
      service = new HrRecruitmentService(prisma, repo, auditService);
    });

    afterAll(async () => {
      // Clean up in FK-safe order, scoped strictly to the tenant.
      if (!prisma) return;

      // Contracts + outbox events reference the created employee(s); delete the
      // outbox event by matching the employee_id in its JSON payload so we only
      // ever remove events THIS run created.
      for (const employee_id of createdEmployeeIds) {
        await prisma.contracts
          .deleteMany({ where: { employee_id, tenant_id: LIVE_TENANT } })
          .catch(() => undefined);
        await prisma.sys_outbox_events
          .deleteMany({
            where: {
              tenant_id: LIVE_TENANT,
              type: "hr.employees.created.v1",
              payload: { path: ["employee_id"], equals: employee_id },
            },
          })
          .catch(() => undefined);
      }

      for (const employee_id of createdEmployeeIds) {
        await prisma.employees
          .deleteMany({ where: { id: employee_id, tenant_id: LIVE_TENANT } })
          .catch(() => undefined);
      }
      for (const id of createdCandidateIds) {
        await prisma.candidates
          .deleteMany({ where: { id, tenant_id: LIVE_TENANT } })
          .catch(() => undefined);
      }
      for (const id of createdRequisitionIds) {
        await prisma.job_requisitions
          .deleteMany({ where: { id, tenant_id: LIVE_TENANT } })
          .catch(() => undefined);
      }

      // The hire provisioned a user (+ user_companies) keyed by the unique
      // candidate email; remove both so the run leaves no residue.
      const user = await prisma.users
        .findUnique({
          where: {
            tenant_id_email: {
              tenant_id: LIVE_TENANT,
              email: candidateEmail,
            },
          },
        })
        .catch(() => null);
      if (user) {
        await prisma.user_companies
          .deleteMany({ where: { user_id: user.id, tenant_id: LIVE_TENANT } })
          .catch(() => undefined);
        await prisma.users
          .deleteMany({ where: { id: user.id, tenant_id: LIVE_TENANT } })
          .catch(() => undefined);
      }

      await prisma.$disconnect().catch(() => undefined);
    });

    it("createRequisition -> createCandidate -> hireCandidate persist against the live DB with no missing-column / invalid-FK / hardcoded-identifier errors", async () => {
      // 1. Create a requisition within the real tenant scope.
      let requisition: any;
      try {
        requisition = await service.createRequisition(
          LIVE_TENANT,
          {
            title: `LiveVerify Phase6 ${runId}`,
            department_id: probe.department_id!,
            openings: 1,
          },
          "live-verify-user",
        );
      } catch (e) {
        throw new Error(
          `createRequisition failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
        );
      }
      expect(requisition.id).toBeTruthy();
      createdRequisitionIds.push(requisition.id);

      // 2. Create a candidate against that requisition. Unique email so the hire
      //    provisions a fresh user we can clean up.
      let candidate: any;
      try {
        candidate = await service.createCandidate(
          LIVE_TENANT,
          {
            first_name: "Live",
            last_name: `Verify ${runId}`,
            email: candidateEmail,
            phone: "+10000000000",
            requisitionId: requisition.id,
            source: "direct",
          },
          "live-verify-user",
        );
      } catch (e) {
        throw new Error(
          `createCandidate failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
        );
      }
      expect(candidate.id).toBeTruthy();
      createdCandidateIds.push(candidate.id);

      // 3. Hire the candidate — the atomic employee-creation path. The employee
      //    is created within the SAME tenant_id; location/department FKs resolve
      //    to real tenant records (no "loc-default" / empty-string fallbacks).
      let employee: any;
      try {
        employee = await service.hireCandidate(
          LIVE_TENANT,
          candidate.id,
          {
            location_id: probe.location_id!,
            department_id: probe.department_id!,
            position: "Staff",
            base_salary: 0,
          },
          "live-verify-user",
        );
      } catch (e) {
        throw new Error(
          `hireCandidate failed against the live DB (possible missing column / invalid FK / hardcoded identifier): ${(e as Error).message}`,
        );
      }
      expect(employee.id).toBeTruthy();
      createdEmployeeIds.push(employee.id);
      // tenant comes from context, never a hardcoded value; the employee shares
      // the candidate's tenant.
      expect(employee.tenant_id).toBe(LIVE_TENANT);
      expect(employee.location_id).toBe(probe.location_id);
      expect(employee.department_id).toBe(probe.department_id);

      // Round-trip read-backs within the same tenant scope confirm the atomic
      // hire committed the employee + its initial contract.
      const persistedEmployee = await prisma.employees.findFirst({
        where: { id: employee.id, tenant_id: LIVE_TENANT },
      });
      expect(persistedEmployee).toBeTruthy();
      expect(persistedEmployee!.tenant_id).toBe(LIVE_TENANT);

      const persistedContract = await prisma.contracts.findFirst({
        where: { employee_id: employee.id, tenant_id: LIVE_TENANT },
      });
      expect(persistedContract).toBeTruthy();

      // The candidate transitioned to hired within scope.
      const persistedCandidate = await prisma.candidates.findFirst({
        where: { id: candidate.id, tenant_id: LIVE_TENANT },
      });
      expect(persistedCandidate).toBeTruthy();
      expect(String(persistedCandidate!.status).toLowerCase()).toBe("hired");
    });
  },
);
