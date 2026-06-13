// Feature: hr-module-stabilization, Property 8: Valid requests never produce server errors
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { HttpException } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { SchedulingService } from "./scheduling.service";
import {
  prismaErrorToHttpException,
  mapPrismaError,
} from "./utils/hr-prisma.errors";

/**
 * Property 8: Valid requests never produce server errors
 * Validates: Requirements 1.1, 1.3, 1.4, 1.6, 6.6, 7.8
 *
 * For any valid, scoped request to an HR endpoint, the response status is below
 * 500; inputs that fail validation produce a 400-422 response and missing
 * in-scope resources produce a 404 — never a 500.
 *
 * This is exercised against the Phase 2 scheduling service (the bug class fixed
 * in Phase 2: `SchedulingService.createWorkSchedule`/`createWorkShift` used to
 * `throw new Error(...)`, surfacing as HTTP 500 instead of 4xx). We use a
 * mockable prisma/repository boundary (per design Testing Strategy) so the
 * service can be unit-driven, generate valid and adversarial inputs, and assert
 * that every known business/validation/lookup failure surfaces as an
 * `HttpException` with `400 <= status < 500` (never a bare Error / 500).
 *
 * We additionally assert that the module's Prisma error-mapping layer
 * (`prismaErrorToHttpException` / `mapPrismaError`) maps the known Prisma codes
 * (P2025 -> 404, P2002 -> 409, P2003 -> 400, P2000 -> 400) to 4xx across
 * generated codes, so repository-level lookup/constraint failures never escape
 * as a 500 either.
 */

/* -------------------------------------------------------------------------- */
/* Mockable prisma / repository boundary                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fake PrismaService: `$transaction` runs the callback against a no-op `tx`,
 * and `locations.findFirst` returns a caller-configured row (null = the
 * location does not belong to the tenant -> foreign location).
 */
function makeFakePrisma(locationRow: unknown) {
  return {
    locations: {
      findFirst: async (_args: unknown) => locationRow,
    },
    async $transaction<T>(cb: (tx: any) => Promise<T>): Promise<T> {
      return cb({ __tx: true });
    },
  } as any;
}

/**
 * Fake HR repository exposing only the methods the create paths touch.
 * `schedules` seeds what `getWorkSchedules` returns so a shift add can target a
 * schedule with a chosen status (e.g. APPROVED).
 */
function makeFakeRepo(schedules: Array<{ id: string; status: string }>) {
  return {
    createWorkSchedule: async (tenant_id: string, data: any) => ({
      id: "sched-1",
      name: data?.name ?? "schedule",
      location_id: data?.location_id ?? null,
    }),
    getWorkSchedules: async () => schedules,
    createWorkShift: async () => ({ id: "shift-1" }),
  } as any;
}

const noopAudit = { log: async () => ({ ok: true }) } as any;
const noopEventBus = { publish: async () => ({ ok: true }) } as any;
const noopLogger = { log: () => {}, error: () => {} } as any;

function makeService(opts: {
  locationRow: unknown;
  schedules?: Array<{ id: string; status: string }>;
}) {
  return new SchedulingService(
    makeFakePrisma(opts.locationRow),
    makeFakeRepo(opts.schedules ?? []),
    noopAudit,
    noopEventBus,
    noopLogger,
  );
}

/** Assert a caught value is a 4xx HttpException (never a 500 / bare Error). */
function expectClientError(err: unknown) {
  expect(err).toBeInstanceOf(HttpException);
  const status = (err as HttpException).getStatus();
  expect(status).toBeGreaterThanOrEqual(400);
  expect(status).toBeLessThan(500);
  return status;
}

const idArb = fc
  .string({ minLength: 1, maxLength: 12 })
  .map((s) => `id-${s.replace(/\s/g, "_")}`);

describe("Property 8: Valid requests never produce server errors", () => {
  it("createWorkSchedule: foreign location -> 400, valid location -> success; never a 500", async () => {
    await fc.assert(
      fc.asyncProperty(
        idArb, // tenant_id
        idArb, // location_id
        fc.string({ maxLength: 20 }), // schedule name
        fc.boolean(), // does the location belong to the tenant?
        async (tenant_id, location_id, name, locationBelongs) => {
          const service = makeService({
            locationRow: locationBelongs
              ? { id: location_id, tenant_id }
              : null,
          });
          const data = { location_id, name };

          if (locationBelongs) {
            // Valid, scoped request -> succeeds with a real record (no error).
            const result = await service.createWorkSchedule(
              tenant_id,
              data,
              "user-1",
            );
            expect(result).toBeTruthy();
            expect(result.id).toBe("sched-1");
          } else {
            // Foreign/unknown location is a validation failure: it must surface
            // as a 4xx HttpException, NOT a bare Error / 500.
            let caught: unknown;
            try {
              await service.createWorkSchedule(tenant_id, data, "user-1");
            } catch (e) {
              caught = e;
            }
            expect(caught).toBeDefined();
            const status = expectClientError(caught);
            expect(status).toBe(400);
          }
        },
      ),
      { numRuns: 150 },
    );
  });

  it("createWorkShift: add to APPROVED schedule -> 409, otherwise success; never a 500", async () => {
    await fc.assert(
      fc.asyncProperty(
        idArb, // tenant_id
        idArb, // schedule_id
        idArb, // location_id
        idArb, // employee_id
        fc.constantFrom("DRAFT", "APPROVED", "PUBLISHED"), // owning-schedule status
        fc.boolean(), // supply scheduleId (camelCase alias) vs schedule_id
        async (
          tenant_id,
          schedule_id,
          location_id,
          employee_id,
          status,
          useCamelAlias,
        ) => {
          const service = makeService({
            locationRow: { id: location_id, tenant_id },
            schedules: [{ id: schedule_id, status }],
          });

          const data: any = {
            location_id,
            employee_id,
            start_time: "09:00",
            end_time: "17:00",
          };
          // Exercise both the camelCase alias and the schema column name; both
          // must resolve to the same target schedule (no name-drift surprises).
          if (useCamelAlias) {
            data.scheduleId = schedule_id;
          } else {
            data.schedule_id = schedule_id;
          }

          if (status === "APPROVED") {
            // Business-rule violation -> must be a 4xx (409 Conflict), not 500.
            let caught: unknown;
            try {
              await service.createWorkShift(tenant_id, data, "user-1");
            } catch (e) {
              caught = e;
            }
            expect(caught).toBeDefined();
            const code = expectClientError(caught);
            expect(code).toBe(409);
          } else {
            const result = await service.createWorkShift(
              tenant_id,
              data,
              "user-1",
            );
            expect(result).toBeTruthy();
            expect(result.id).toBe("shift-1");
          }
        },
      ),
      { numRuns: 150 },
    );
  });

  it("Prisma error mapping: known codes map to 4xx (P2025->404, P2002->409, P2003->400, P2000->400); never a 500", async () => {
    const expectedStatus: Record<string, number> = {
      P2025: 404,
      P2002: 409,
      P2003: 400,
      P2000: 400,
    };

    await fc.assert(
      fc.property(
        fc.constantFrom("P2025", "P2002", "P2003", "P2000"),
        fc.string({ maxLength: 24 }), // arbitrary error message
        fc.string({ minLength: 1, maxLength: 16 }), // arbitrary meta field/target
        (code, message, metaValue) => {
          const error = new PrismaClientKnownRequestError(message, {
            code,
            clientVersion: "6.2.1",
            meta: { target: [metaValue], field_name: metaValue, column_name: metaValue },
          });

          // 1. prismaErrorToHttpException returns a typed 4xx exception.
          const mapped = prismaErrorToHttpException(error, "Scheduling");
          expect(mapped).toBeInstanceOf(HttpException);
          const status = (mapped as HttpException).getStatus();
          expect(status).toBe(expectedStatus[code]);
          expect(status).toBeLessThan(500);

          // 2. mapPrismaError throws the equivalent 4xx exception (never 500).
          let caught: unknown;
          try {
            mapPrismaError(error, "Scheduling");
          } catch (e) {
            caught = e;
          }
          expect(caught).toBeInstanceOf(HttpException);
          expect((caught as HttpException).getStatus()).toBe(expectedStatus[code]);
        },
      ),
      { numRuns: 150 },
    );
  });

  it("Prisma error mapping: an already-typed 4xx HttpException is preserved (never widened to 500)", async () => {
    // Regression guard: a deliberately-raised 400/404/409 upstream must not be
    // re-wrapped as a 500 by the central catch-block handler.
    const { BadRequestException, NotFoundException } = await import(
      "@nestjs/common"
    );
    for (const ex of [
      new BadRequestException("bad input"),
      new NotFoundException("missing"),
    ]) {
      let caught: unknown;
      try {
        mapPrismaError(ex, "Scheduling");
      } catch (e) {
        caught = e;
      }
      expect(caught).toBe(ex);
      expect((caught as HttpException).getStatus()).toBeLessThan(500);
    }
  });
});
