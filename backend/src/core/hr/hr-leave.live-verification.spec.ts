import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { HttpException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../persistence/prisma.service";
import { HRDbRepository } from "./repositories/hr.db.repository";
import { HrLeaveService } from "./hr-leave.service";
import { LeaveType } from "./dto/create-leave-request.dto";

/**
 * Task 8.4 — Live-DB verification test for Phase 4 (Leave).
 *
 * Goal (Requirements 9.4, 12.1, 12.2, 13.4): exercise the Phase 4 leave write
 * paths (`createLeaveRequest` -> `approveLeaveRequest` on {@link HrLeaveService},
 * backed by {@link HRDbRepository}) against the REAL database using the live test
 * tenant `tnt-3rlhko`, asserting the writes succeed with **no missing column,
 * invalid foreign key, or hardcoded identifier** — the exact defect classes
 * Requirement 12.2 says must be corrected before a phase is complete, and that
 * the approver identity + review note persist (Requirement 9.2).
 *
 * Connectivity model (identical to the Phase 1/2/3 live-DB verification tests):
 * - The connection string is read from the environment (`DATABASE_URL`), exactly
 *   as the running app does via `PrismaService` -> `PrismaClient`.
 * - The live production tenant `tnt-3rlhko` lives in the VPS production database.
 *   When this test runs in an environment whose `DATABASE_URL` does not point at
 *   a database containing that tenant (e.g. a local dev DB, or no DB at all), the
 *   suite SKIPS gracefully with a clear message rather than fabricating a pass.
 * - When the live DB IS reachable and the tenant exists, the suite runs for real
 *   and cleans up every leave request it creates, scoped strictly to
 *   `tnt-3rlhko`.
 *
 * Note on the `review_notes` column (added by task 8.2's migration): the approve
 * write persists the reviewer note to `review_notes`. If that column is not yet
 * present in the connected database, the write surfaces a clear, actionable
 * message instead of a fabricated pass.
 *
 * The leave write path is driven through the canonical {@link HrLeaveService}
 * with the real {@link HRDbRepository} and a real {@link PrismaService}. The
 * audit and notification collaborators are no-op stubs so the verification is
 * isolated to the `leave_requests` SQL and does not pollute live audit/comms.
 *
 * This is an integration/smoke test, not a property test.
 */

const LIVE_TENANT = "tnt-3rlhko";

interface ProbeResult {
  available: boolean;
  reason?: string;
  employee_id?: string;
  department_id?: string;
}

/**
 * Probe whether the live test tenant is reachable in the currently-configured
 * database, and that it has at least one employee + department so the
 * leave-request foreign keys (`employee_id`, `department_id`) can be satisfied.
 * Returns availability plus the seed FKs to drive the write path.
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
    const employee = await prisma.employees.findFirst({
      where: { tenant_id: LIVE_TENANT },
    });
    const department = await prisma.departments.findFirst({
      where: { tenant_id: LIVE_TENANT, deleted_at: null },
    });
    if (!employee || !department) {
      const missing = !employee ? "employee" : "department";
      return {
        available: false,
        reason: `tenant '${LIVE_TENANT}' has no ${missing} to satisfy leave-request foreign keys`,
      };
    }
    return {
      available: true,
      employee_id: employee.id,
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
    `\n[Phase 4 live-DB verification] SKIPPED — ${probe.reason}.\n` +
      `  This test is structured to run against the live test tenant '${LIVE_TENANT}'.\n` +
      `  Point DATABASE_URL at a database containing that tenant to execute it for real.\n`,
  );
}

const describeLive = probe.available ? describe : describe.skip;

describeLive(
  "Phase 4 live-DB verification — leave write paths (tnt-3rlhko)",
  () => {
    let prisma: PrismaService;
    let service: HrLeaveService;

    // Unique marker so cleanup only ever touches records THIS run created.
    const runId = randomUUID().slice(0, 8);
    const createdRequestIds: string[] = [];

    beforeAll(async () => {
      prisma = new PrismaService();
      await prisma.$connect();
      const repo = new HRDbRepository(prisma);
      // No-op audit + notification: isolates the verification to the
      // `leave_requests` SQL and avoids writing to live audit / comms.
      const auditService = { log: async () => undefined } as any;
      const notificationService = {
        send: async () => undefined,
        notify: async () => undefined,
      } as any;
      service = new HrLeaveService(
        prisma,
        repo,
        auditService,
        notificationService,
      );
    });

    afterAll(async () => {
      // Clean up every leave request THIS run created, scoped to the tenant.
      if (prisma) {
        for (const id of createdRequestIds) {
          await prisma.leave_requests
            .deleteMany({ where: { id, tenant_id: LIVE_TENANT } })
            .catch(() => undefined);
        }
        await prisma.$disconnect().catch(() => undefined);
      }
    });

    it("createLeaveRequest (pending) -> approveLeaveRequest persist against the live DB with no missing-column / invalid-FK / hardcoded-identifier errors", async () => {
      // 1. Submit a leave request — persisted as `pending` within the tenant
      //    scope. tenant_id comes from context, never a hardcoded value.
      let created: any;
      try {
        created = await service.createLeaveRequest(
          LIVE_TENANT,
          {
            employee_id: probe.employee_id!,
            department_id: probe.department_id!,
            leave_type: LeaveType.ANNUAL,
            start_date: "2024-01-01",
            end_date: "2024-01-03",
            total_days: 3,
            reason: `LiveVerify Phase4 ${runId}`,
          },
          "live-verify-user",
        );
      } catch (e) {
        throw new Error(
          `createLeaveRequest failed against the live DB (possible missing column / invalid FK): ${(e as Error).message}`,
        );
      }
      expect(created.id).toBeTruthy();
      createdRequestIds.push(created.id);
      expect(created.tenant_id).toBe(LIVE_TENANT);
      expect(created.employee_id).toBe(probe.employee_id);
      expect(created.status).toBe("pending");

      // 2. Approve the pending request, recording the approver identity and a
      //    review note (the `review_notes` column added by task 8.2's
      //    migration). A missing column here surfaces a clear message below.
      const reviewer = "live-verify-reviewer";
      const note = `approved by live verification ${runId}`;
      let approved: any;
      try {
        approved = await service.approveLeaveRequest(
          LIVE_TENANT,
          created.id,
          reviewer,
          note,
          "live-verify-user",
        );
      } catch (e) {
        const msg = (e as Error).message;
        if (/review_notes/i.test(msg)) {
          throw new Error(
            `approveLeaveRequest failed because the 'review_notes' column is missing — apply task 8.2's migration to the connected database: ${msg}`,
          );
        }
        throw new Error(
          `approveLeaveRequest failed against the live DB (possible missing column / invalid FK): ${msg}`,
        );
      }
      expect(approved.id).toBe(created.id);
      expect(approved.status).toBe("approved");
      // Approver identity + review note persisted (Requirement 9.2).
      expect(approved.reviewed_by).toBe(reviewer);
      expect(approved.review_notes).toBe(note);

      // Round-trip read-back within the same tenant scope confirms persistence
      // of the approved transition and the review note column.
      const persisted = await prisma.leave_requests.findFirst({
        where: { id: created.id, tenant_id: LIVE_TENANT },
      });
      expect(persisted).toBeTruthy();
      expect(String(persisted!.status).toLowerCase()).toBe("approved");
      expect(persisted!.approved_by).toBe(reviewer);
      expect(persisted!.review_notes).toBe(note);
    });

    it("approving a NON-pending request -> client error (400) against the live DB, with no state change (Requirement 9.4)", async () => {
      // 1. Create a fresh pending request and approve it, so it is now in a
      //    non-pending (`approved`) terminal state.
      const created = await service.createLeaveRequest(
        LIVE_TENANT,
        {
          employee_id: probe.employee_id!,
          department_id: probe.department_id!,
          leave_type: LeaveType.ANNUAL,
          start_date: "2024-02-01",
          end_date: "2024-02-02",
          total_days: 2,
          reason: `LiveVerify Phase4 non-pending ${runId}`,
        },
        "live-verify-user",
      );
      createdRequestIds.push(created.id);

      await service.approveLeaveRequest(
        LIVE_TENANT,
        created.id,
        "live-verify-reviewer",
        "first approval",
        "live-verify-user",
      );

      // 2. Acting again on the now-approved request is an invalid edge: the
      //    lifecycle guard must reject with a 4xx client error BEFORE any write.
      let status: number | undefined;
      try {
        await service.approveLeaveRequest(
          LIVE_TENANT,
          created.id,
          "live-verify-reviewer",
          "second approval",
          "live-verify-user",
        );
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        status = (e as HttpException).getStatus();
      }
      expect(status).toBe(400);

      // 3. The record is unchanged by the rejected action: still approved, with
      //    the FIRST reviewer note intact.
      const persisted = await prisma.leave_requests.findFirst({
        where: { id: created.id, tenant_id: LIVE_TENANT },
      });
      expect(persisted).toBeTruthy();
      expect(String(persisted!.status).toLowerCase()).toBe("approved");
      expect(persisted!.review_notes).toBe("first approval");
    });
  },
);
