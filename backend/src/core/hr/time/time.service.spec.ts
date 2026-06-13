import { describe, it, expect, beforeEach, vi } from "vitest";
import { HttpException } from "@nestjs/common";
import { TimeAndAttendanceService } from "./time.service";

/**
 * Task 6.6 — Phase 3 example/edge regression tests for
 * {@link TimeAndAttendanceService}.
 *
 * These cover the two concrete client-error regressions called out for Phase 3
 * (Time & Attendance) and Requirements 8.3 / 8.4:
 *
 *   1. Double clock-in -> 400 (Requirement 8.3): when an employee already has an
 *      OPEN attendance record (a row whose `check_out_time` is null), a second
 *      clock-in must be rejected with a client error (400 BadRequestException),
 *      NOT create a duplicate open session.
 *
 *   2. Clock-out with no open record -> 400 (Requirement 8.4): when no open
 *      attendance record exists for the employee, clock-out must be rejected with
 *      a client error (400 BadRequestException).
 *
 * The Prisma/repository boundary is mocked so these are fast, deterministic unit
 * tests that assert the exact HttpException type AND its HTTP status code (400).
 * On both rejection paths the guard fires before any other collaborator is
 * touched, so the event bus / repository are inert no-op stubs.
 */

const TENANT = "tnt-test";
const EMPLOYEE = "emp-1";
const LOCATION = "loc-1";

/**
 * Build the service with a mocked `$transaction` that runs the callback against
 * a stub `tx` client whose `hr_attendance_records.findFirst` returns the supplied
 * row. `getEmployeeById` is provided but is never reached on the rejection paths
 * under test.
 */
function buildService(openRecord: unknown) {
  const tx = {
    hr_attendance_records: {
      findFirst: vi.fn().mockResolvedValue(openRecord),
      create: vi.fn(),
      update: vi.fn(),
    },
    hr_work_shifts: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  };

  const prisma = {
    // Pass-through transaction: invokes the service body with the stub tx client.
    $transaction: vi.fn(async (cb: any) => cb(tx)),
  } as any;

  const hrRepository = {
    getEmployeeById: vi.fn().mockResolvedValue({
      id: EMPLOYEE,
      location_id: LOCATION,
      department_id: "dep-1",
    }),
  } as any;

  // Event bus is never reached on the rejection paths; no-op publish.
  const eventBus = { publish: vi.fn() } as any;

  const service = new TimeAndAttendanceService(eventBus, hrRepository, prisma);
  return { service, prisma, hrRepository, eventBus, tx };
}

describe("TimeAndAttendanceService — Phase 3 regression edge cases", () => {
  describe("clock_in: double clock-in -> 400 (Requirement 8.3)", () => {
    let ctx: ReturnType<typeof buildService>;

    beforeEach(() => {
      // An OPEN attendance record already exists (check_out_time === null).
      ctx = buildService({
        id: "att-open",
        tenant_id: TENANT,
        employee_id: EMPLOYEE,
        check_out_time: null,
        deleted_at: null,
      });
    });

    it("throws BadRequestException (HTTP 400) when an open attendance record already exists", async () => {
      await expect(
        ctx.service.clock_in(TENANT, EMPLOYEE, LOCATION),
      ).rejects.toBeInstanceOf(HttpException);

      // Assert the exact HTTP status code is a client error (400), proving the
      // double clock-in is rejected rather than creating a duplicate session.
      let status: number | undefined;
      try {
        await ctx.service.clock_in(TENANT, EMPLOYEE, LOCATION);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        status = (e as HttpException).getStatus();
      }
      expect(status).toBe(400);

      // The single-open-record guard was evaluated scoped to tenant + employee,
      // and no new record was created.
      expect(ctx.tx.hr_attendance_records.findFirst).toHaveBeenCalledWith({
        where: {
          tenant_id: TENANT,
          employee_id: EMPLOYEE,
          check_out_time: null,
          deleted_at: null,
        },
      });
      expect(ctx.tx.hr_attendance_records.create).not.toHaveBeenCalled();
    });
  });

  describe("clock_out: no open record -> 400 (Requirement 8.4)", () => {
    let ctx: ReturnType<typeof buildService>;

    beforeEach(() => {
      // No open attendance record exists for the employee.
      ctx = buildService(null);
    });

    it("throws BadRequestException (HTTP 400) when there is no open attendance record", async () => {
      await expect(
        ctx.service.clock_out(TENANT, EMPLOYEE),
      ).rejects.toBeInstanceOf(HttpException);

      let status: number | undefined;
      try {
        await ctx.service.clock_out(TENANT, EMPLOYEE);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        status = (e as HttpException).getStatus();
      }
      expect(status).toBe(400);

      // The open-session lookup was scoped to tenant + employee and no update
      // was attempted because nothing was open.
      expect(ctx.tx.hr_attendance_records.findFirst).toHaveBeenCalledWith({
        where: {
          tenant_id: TENANT,
          employee_id: EMPLOYEE,
          check_out_time: null,
          deleted_at: null,
        },
        orderBy: { created_at: "desc" },
      });
      expect(ctx.tx.hr_attendance_records.update).not.toHaveBeenCalled();
    });
  });
});
