import { describe, it, expect, beforeEach, vi } from "vitest";
import { HttpException, NotFoundException } from "@nestjs/common";
import { HRService } from "./hr.service";
import { SubmitReviewDto } from "./dto/submit-review.dto";

/**
 * Task 12.6 — Phase 6 example/edge regression tests for
 * {@link HRService.submitPerformanceReview}.
 *
 * These cover the concrete out-of-scope guard regressions called out in the
 * design ("Example and edge-case unit tests") and Requirement 11.5: a
 * performance review may only be submitted for a performance cycle AND an
 * employee that exist within the caller's tenant scope. Both lookups are
 * composite-key reads bound to `tenant_id`, so a cycle / employee owned by
 * another tenant resolves to `null` and must surface as a not-found (404)
 * client error BEFORE any review is persisted — never as a 500 and never as a
 * cross-tenant write.
 *
 * We mock the Prisma / repository boundary so these are fast, deterministic
 * unit tests that assert the exact HttpException type AND its HTTP status code,
 * and prove that no review-persist write runs on the rejection branches.
 *
 * {@link HRService} has many constructor collaborators; `submitPerformanceReview`
 * only touches `hrRepository` (getPerformanceCycleById / getEmployeeById /
 * submitPerformanceReview), `auditService` (log), and `prisma` ($transaction).
 * The remaining dependencies are passed as minimal `{} as any` stubs.
 */

const TENANT = "tnt-test";
const CYCLE_ID = "cyc-1";
const EMPLOYEE_ID = "emp-1";
const USER_ID = "usr-reviewer";

interface BuiltService {
  service: HRService;
  prisma: any;
  hrRepository: any;
  auditService: any;
}

function buildService(overrides: {
  getPerformanceCycleById?: () => Promise<any>;
  getEmployeeById?: () => Promise<any>;
  submitPerformanceReview?: () => Promise<any>;
}): BuiltService {
  // Pass-through transaction: runs the callback with a stub tx client. The
  // out-of-scope guards run INSIDE this callback and throw before the persist
  // write, which the tests assert by checking the repository write was never
  // called.
  const prisma = {
    $transaction: vi.fn(async (cb: any) => cb({})),
  };

  const hrRepository = {
    getPerformanceCycleById: vi.fn(
      overrides.getPerformanceCycleById ?? (async () => null),
    ),
    getEmployeeById: vi.fn(overrides.getEmployeeById ?? (async () => null)),
    submitPerformanceReview: vi.fn(
      overrides.submitPerformanceReview ?? (async () => reviewRecord()),
    ),
  } as any;

  const auditService = { log: vi.fn() } as any; // no-op

  const service = new HRService(
    hrRepository,
    {} as any, // fileProcessingService
    auditService,
    {} as any, // loggerService
    {} as any, // eventBus
    prisma as any,
    {} as any, // notificationService
    {} as any, // contractGenerator
  );

  return { service, prisma, hrRepository, auditService };
}

function reviewDto(): SubmitReviewDto {
  return {
    cycleId: CYCLE_ID,
    employee_id: EMPLOYEE_ID,
    reviewerId: USER_ID,
    rating: 4,
    comments: "solid quarter",
  };
}

/** A persisted performance review, used to seed the happy-path repo write. */
function reviewRecord() {
  return {
    id: "rev-1",
    tenant_id: TENANT,
    cycle_id: CYCLE_ID,
    employee_id: EMPLOYEE_ID,
    reviewer_id: USER_ID,
    rating: 4,
    comments: "solid quarter",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
  };
}

/** Minimal in-scope cycle / employee records to satisfy the guard reads. */
function cycleRecord() {
  return { id: CYCLE_ID, tenant_id: TENANT, name: "2024 H1" };
}
function employeeRecord() {
  return { id: EMPLOYEE_ID, tenant_id: TENANT, first_name: "Ada" };
}

describe("HRService.submitPerformanceReview — Phase 6 out-of-scope edge cases (Requirement 11.5)", () => {
  describe("out-of-scope cycle: cycle not within tenant scope -> 404 (no persist)", () => {
    let ctx: BuiltService;

    beforeEach(() => {
      // The cycle lookup resolves to null => not found within the caller's scope.
      ctx = buildService({ getPerformanceCycleById: async () => null });
    });

    it("throws NotFoundException (HTTP 404) and persists no review", async () => {
      await expect(
        ctx.service.submitPerformanceReview(TENANT, reviewDto(), USER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);

      let status: number | undefined;
      try {
        await ctx.service.submitPerformanceReview(TENANT, reviewDto(), USER_ID);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        status = (e as HttpException).getStatus();
      }
      expect(status).toBe(404);

      // The cycle guard was tenant-scoped, and NO review-persist write executed.
      // Because the cycle was missing, the employee lookup is never reached.
      expect(ctx.hrRepository.getPerformanceCycleById).toHaveBeenCalledWith(
        TENANT,
        CYCLE_ID,
      );
      expect(ctx.hrRepository.getEmployeeById).not.toHaveBeenCalled();
      expect(ctx.hrRepository.submitPerformanceReview).not.toHaveBeenCalled();
      expect(ctx.auditService.log).not.toHaveBeenCalled();
    });
  });

  describe("out-of-scope employee: cycle in scope but employee not -> 404 (no persist)", () => {
    let ctx: BuiltService;

    beforeEach(() => {
      // Cycle found in scope, but the employee lookup resolves to null.
      ctx = buildService({
        getPerformanceCycleById: async () => cycleRecord(),
        getEmployeeById: async () => null,
      });
    });

    it("throws NotFoundException (HTTP 404) and persists no review", async () => {
      await expect(
        ctx.service.submitPerformanceReview(TENANT, reviewDto(), USER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);

      let status: number | undefined;
      try {
        await ctx.service.submitPerformanceReview(TENANT, reviewDto(), USER_ID);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        status = (e as HttpException).getStatus();
      }
      expect(status).toBe(404);

      // Both guard reads were tenant-scoped; the employee guard rejected the
      // request, so NO review-persist write executed.
      expect(ctx.hrRepository.getEmployeeById).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
      );
      expect(ctx.hrRepository.submitPerformanceReview).not.toHaveBeenCalled();
      expect(ctx.auditService.log).not.toHaveBeenCalled();
    });
  });

  describe("happy path: cycle + employee both in scope -> persists the review", () => {
    let ctx: BuiltService;

    beforeEach(() => {
      ctx = buildService({
        getPerformanceCycleById: async () => cycleRecord(),
        getEmployeeById: async () => employeeRecord(),
        submitPerformanceReview: async () => reviewRecord(),
      });
    });

    it("resolves to the persisted review and writes inside a transaction", async () => {
      const result = await ctx.service.submitPerformanceReview(
        TENANT,
        reviewDto(),
        USER_ID,
      );

      expect(result.id).toBe("rev-1");
      expect(result.employee_id).toBe(EMPLOYEE_ID);

      // Both in-scope guards passed, so the transactional persist path executed.
      expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(ctx.hrRepository.submitPerformanceReview).toHaveBeenCalledWith(
        TENANT,
        reviewDto(),
        expect.anything(),
      );
      // The audit log was written within the same transaction (user_id present).
      expect(ctx.auditService.log).toHaveBeenCalledTimes(1);
    });
  });
});
