import { describe, it, expect, beforeEach, vi } from "vitest";
import { HttpException } from "@nestjs/common";
import { HrLeaveService } from "./hr-leave.service";
import {
  BadRequestException,
  NotFoundException,
} from "./utils/hr-prisma.errors";

/**
 * Task 8.4 — Phase 4 example/edge regression tests for {@link HrLeaveService}.
 *
 * These cover the concrete lifecycle-guard regressions called out in the design
 * ("Example and edge-case unit tests") and Requirement 9.4: acting on a leave
 * request that is NOT in the `pending` state must be rejected with a client
 * error (400) BEFORE any write/transaction is attempted, and a missing /
 * cross-tenant request must surface as a not-found (404).
 *
 * The service loads the target request tenant-scoped via
 * `hrRepository.getLeaveRequestById` (the `assertPending` guard) before opening
 * the `$transaction`. We mock the Prisma/repository boundary so these are fast,
 * deterministic unit tests that assert the exact HttpException type AND its HTTP
 * status code, and prove that no write path runs on the rejection branches.
 */

const TENANT = "tnt-test";
const REQUEST_ID = "req-1";
const REVIEWER = "usr-reviewer";

interface BuiltService {
  service: HrLeaveService;
  prisma: any;
  hrRepository: any;
  auditService: any;
  notificationService: any;
}

function buildService(
  getLeaveRequestByIdImpl: () => Promise<any>,
): BuiltService {
  // Pass-through transaction: runs the callback with a stub tx client. On the
  // rejection branches under test the guard throws BEFORE this is ever called,
  // which the tests assert explicitly.
  const prisma = {
    $transaction: vi.fn(async (cb: any) => cb({})),
  };
  const hrRepository = {
    getLeaveRequestById: vi.fn(getLeaveRequestByIdImpl),
    approveLeaveRequest: vi.fn(),
    rejectLeaveRequest: vi.fn(),
  } as any;
  const auditService = { log: vi.fn() } as any; // no-op
  const notificationService = {
    send: vi.fn(),
    notify: vi.fn(),
  } as any; // no-op

  const service = new HrLeaveService(
    prisma as any,
    hrRepository,
    auditService,
    notificationService,
  );
  return { service, prisma, hrRepository, auditService, notificationService };
}

/** A persisted leave request in an arbitrary state, used to seed the guard read. */
function leaveRecord(status: string) {
  return {
    id: REQUEST_ID,
    tenant_id: TENANT,
    employee_id: "emp-1",
    leave_type: "annual",
    start_date: new Date("2024-01-01"),
    end_date: new Date("2024-01-03"),
    total_days: 3,
    reason: "vacation",
    status,
    requested_at: new Date("2024-01-01"),
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
  };
}

describe("HrLeaveService — Phase 4 lifecycle-guard edge cases (Requirement 9.4)", () => {
  describe("approveLeaveRequest: non-pending request -> 400 (not a write/500)", () => {
    let ctx: BuiltService;

    beforeEach(() => {
      // The target request is already APPROVED, so approve is not a valid edge.
      ctx = buildService(async () => leaveRecord("approved"));
    });

    it("throws BadRequestException (HTTP 400) and runs no write/transaction path", async () => {
      await expect(
        ctx.service.approveLeaveRequest(TENANT, REQUEST_ID, REVIEWER),
      ).rejects.toBeInstanceOf(BadRequestException);

      // Assert the exact HTTP status is a client error (400).
      let status: number | undefined;
      try {
        await ctx.service.approveLeaveRequest(TENANT, REQUEST_ID, REVIEWER);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        status = (e as HttpException).getStatus();
      }
      expect(status).toBe(400);

      // The guard read was tenant-scoped, and NO write path executed: the
      // transaction was never opened and the repository write never ran.
      expect(ctx.hrRepository.getLeaveRequestById).toHaveBeenCalledWith(
        TENANT,
        REQUEST_ID,
      );
      expect(ctx.prisma.$transaction).not.toHaveBeenCalled();
      expect(ctx.hrRepository.approveLeaveRequest).not.toHaveBeenCalled();
    });
  });

  describe("rejectLeaveRequest: non-pending request -> 400 (not a write/500)", () => {
    let ctx: BuiltService;

    beforeEach(() => {
      // The target request is already REJECTED, so reject is not a valid edge.
      ctx = buildService(async () => leaveRecord("rejected"));
    });

    it("throws BadRequestException (HTTP 400) and runs no write/transaction path", async () => {
      await expect(
        ctx.service.rejectLeaveRequest(
          TENANT,
          REQUEST_ID,
          REVIEWER,
          "duplicate",
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      let status: number | undefined;
      try {
        await ctx.service.rejectLeaveRequest(
          TENANT,
          REQUEST_ID,
          REVIEWER,
          "duplicate",
        );
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        status = (e as HttpException).getStatus();
      }
      expect(status).toBe(400);

      expect(ctx.hrRepository.getLeaveRequestById).toHaveBeenCalledWith(
        TENANT,
        REQUEST_ID,
      );
      expect(ctx.prisma.$transaction).not.toHaveBeenCalled();
      expect(ctx.hrRepository.rejectLeaveRequest).not.toHaveBeenCalled();
    });
  });

  describe("approveLeaveRequest: missing / cross-tenant request -> 404", () => {
    let ctx: BuiltService;

    beforeEach(() => {
      // Tenant-scoped read returns null => not found within the caller's scope.
      ctx = buildService(async () => null);
    });

    it("throws NotFoundException (HTTP 404) and runs no write/transaction path", async () => {
      await expect(
        ctx.service.approveLeaveRequest(TENANT, REQUEST_ID, REVIEWER),
      ).rejects.toBeInstanceOf(NotFoundException);

      let status: number | undefined;
      try {
        await ctx.service.approveLeaveRequest(TENANT, REQUEST_ID, REVIEWER);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        status = (e as HttpException).getStatus();
      }
      expect(status).toBe(404);

      expect(ctx.prisma.$transaction).not.toHaveBeenCalled();
      expect(ctx.hrRepository.approveLeaveRequest).not.toHaveBeenCalled();
    });
  });

  describe("approveLeaveRequest: pending request -> approves (happy path)", () => {
    let ctx: BuiltService;

    beforeEach(() => {
      ctx = buildService(async () => leaveRecord("pending"));
    });

    it("resolves to the approved record and runs the write inside a transaction", async () => {
      const approved = { ...leaveRecord("approved"), reviewed_by: REVIEWER };
      ctx.hrRepository.approveLeaveRequest.mockResolvedValue(approved);

      const result = await ctx.service.approveLeaveRequest(
        TENANT,
        REQUEST_ID,
        REVIEWER,
        "ok",
      );

      expect(result.status).toBe("approved");
      // The pending guard passed, so the transactional write path executed.
      expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(ctx.hrRepository.approveLeaveRequest).toHaveBeenCalledWith(
        TENANT,
        REQUEST_ID,
        REVIEWER,
        "ok",
        expect.anything(),
      );
      // The audit log was written within the same transaction.
      expect(ctx.auditService.log).toHaveBeenCalledTimes(1);
    });
  });
});
