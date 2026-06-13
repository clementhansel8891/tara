import { describe, it, expect, beforeEach, vi } from "vitest";
import { HttpException } from "@nestjs/common";
import { SchedulingService } from "./scheduling.service";
import {
  BadRequestException,
  ConflictException,
} from "./utils/hr-prisma.errors";

/**
 * Task 4.8 — Phase 2 example/edge regression tests for {@link SchedulingService}.
 *
 * These cover the two concrete bug-class regressions called out in the design
 * ("Example and edge-case unit tests") and Requirements 7.2 / 7.4:
 *
 *   1. Foreign-location create -> 400 (regression for the `new Error` -> 500 bug):
 *      creating a Work_Schedule for a location that does not belong to the
 *      caller's tenant must raise a client error (400 BadRequestException), NOT
 *      surface as a 500.
 *
 *   2. Add-shift-to-approved -> 409: adding a Work_Shift to a schedule whose
 *      status is APPROVED must be rejected with a client error (409
 *      ConflictException).
 *
 * The Prisma/repository boundary is mocked so these are fast, deterministic unit
 * tests that assert the exact HttpException type AND its HTTP status code.
 */

const TENANT = "tnt-test";
const USER = "usr-test";

function buildService(overrides: {
  prisma?: any;
  hrRepository?: any;
} = {}) {
  // Minimal mocked collaborators. The audit/event/logger services are never
  // reached on the rejection paths under test, but are provided so the service
  // constructs cleanly.
  const prisma = overrides.prisma ?? {
    locations: { findFirst: vi.fn() },
    // Pass-through transaction: runs the callback with a stub tx client.
    $transaction: vi.fn(async (cb: any) => cb({})),
  };
  const hrRepository =
    overrides.hrRepository ??
    ({
      getWorkSchedules: vi.fn(),
      createWorkSchedule: vi.fn(),
      createWorkShift: vi.fn(),
    } as any);
  const auditService = { log: vi.fn() } as any;
  const eventBus = { publish: vi.fn() } as any;
  const loggerService = { log: vi.fn() } as any;

  const service = new SchedulingService(
    prisma,
    hrRepository,
    auditService,
    eventBus,
    loggerService,
  );
  return { service, prisma, hrRepository, auditService, eventBus };
}

describe("SchedulingService — Phase 2 regression edge cases", () => {
  describe("createWorkSchedule: foreign-location create -> 400 (not 500)", () => {
    let service: SchedulingService;
    let prisma: any;
    let hrRepository: any;

    beforeEach(() => {
      // Ownership lookup returns null => the location does NOT belong to tenant.
      prisma = {
        locations: { findFirst: vi.fn().mockResolvedValue(null) },
        $transaction: vi.fn(async (cb: any) => cb({})),
      };
      ({ service, hrRepository } = buildService({ prisma }));
    });

    it("throws BadRequestException (HTTP 400) for a location not owned by the tenant", async () => {
      const data = {
        location_id: "loc-foreign",
        department_id: "dep-1",
        name: "Week 1",
        start_date: "2024-01-01",
        end_date: "2024-01-07",
      };

      await expect(
        service.createWorkSchedule(TENANT, data, USER),
      ).rejects.toBeInstanceOf(BadRequestException);

      // Assert the exact HTTP status code is a client error (400), proving the
      // foreign-location case no longer escapes as a 500.
      let status: number | undefined;
      try {
        await service.createWorkSchedule(TENANT, data, USER);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        status = (e as HttpException).getStatus();
      }
      expect(status).toBe(400);

      // The ownership check was performed scoped to the caller's tenant_id, and
      // no persistence was attempted for the foreign location.
      expect(prisma.locations.findFirst).toHaveBeenCalledWith({
        where: { id: "loc-foreign", tenant_id: TENANT },
      });
      expect(hrRepository.createWorkSchedule).not.toHaveBeenCalled();
    });
  });

  describe("createWorkShift: add-shift-to-approved -> 409", () => {
    let service: SchedulingService;
    let prisma: any;
    let hrRepository: any;

    beforeEach(() => {
      prisma = {
        locations: { findFirst: vi.fn() },
        $transaction: vi.fn(async (cb: any) => cb({})),
      };
      hrRepository = {
        // The target schedule is APPROVED, so a shift may not be added to it.
        getWorkSchedules: vi
          .fn()
          .mockResolvedValue([{ id: "sch-approved", status: "APPROVED" }]),
        createWorkShift: vi.fn(),
      };
      ({ service } = buildService({ prisma, hrRepository }));
    });

    it("throws ConflictException (HTTP 409) when the schedule is APPROVED", async () => {
      // Inbound DTO uses the camelCase `scheduleId` alias; the service maps it to
      // `schedule_id` before matching against the persisted schedule.
      const data = {
        scheduleId: "sch-approved",
        location_id: "loc-1",
        employee_id: "emp-1",
        start_time: "2024-01-01T09:00:00.000Z",
        end_time: "2024-01-01T17:00:00.000Z",
      };

      await expect(
        service.createWorkShift(TENANT, data, USER),
      ).rejects.toBeInstanceOf(ConflictException);

      let status: number | undefined;
      try {
        await service.createWorkShift(TENANT, data, USER);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        status = (e as HttpException).getStatus();
      }
      expect(status).toBe(409);

      // No shift was persisted to the approved schedule.
      expect(hrRepository.createWorkShift).not.toHaveBeenCalled();
    });
  });
});
