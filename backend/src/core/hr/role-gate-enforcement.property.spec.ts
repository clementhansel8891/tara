// Feature: hr-module-stabilization, Property 3: Mutating endpoints enforce their Role_Gate
import "reflect-metadata";
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { ExecutionContext, ForbiddenException, RequestMethod } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { RolesGuard } from "../../shared/guards/roles.guard";
import { ROLES_KEY } from "../../shared/decorators/roles.decorator";
import { UserRole } from "../../shared/roles";

// Migrated HR REST surface (the controllers the stabilization spec's gate tasks
// 2.4 / 4.1 / 6.1 / 8.1 / 10.1 / 12.1 targeted). Every create/update/delete/
// transition handler on these must declare a `@Roles(...)` gate (Requirement 3.4).
import { HrSchedulingController } from "./controllers/hr-scheduling.controller";
import { HrPayrollController } from "./controllers/hr-payroll.controller";
import { HrLeaveController } from "./controllers/hr-leave.controller";
import { HrAttendanceController } from "./controllers/hr-attendance.controller";
import { HrRecruitmentController } from "./controllers/hr-recruitment.controller";
import { TimeAndAttendanceController } from "./time/time.controller";
import { AttendanceDeviceController } from "./time/device.controller";

/**
 * Property 3: Mutating endpoints enforce their Role_Gate
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 *
 * For any mutating HR endpoint and any caller role, the request is rejected with
 * a forbidden (403) response when the role is neither included in the endpoint's
 * `@Roles` gate nor a permitted privileged bypass (SUPERADMIN global, OWNER
 * tenant-scoped), and permitted otherwise; AND every create/update/delete/
 * transition handler in the HR controllers declares a `@Roles` gate.
 *
 * This file validates the property in two complementary parts:
 *
 *   PART A — Gate enforcement semantics (Requirements 3.1, 3.2, 3.3).
 *     The unit under test is the real `RolesGuard`, exercised through a mocked
 *     `ExecutionContext` carrying generated `@Roles` metadata (via `Reflector`)
 *     and a `TenantContext` carrying a generated caller role. The guard's
 *     observable decision (allow vs. ForbiddenException/403) is asserted against
 *     an independent oracle that mirrors the guard's exact bypass rules read
 *     from `roles.guard.ts`:
 *       - no `@Roles` metadata        -> allow (route ungated at the guard layer)
 *       - missing TenantContext       -> 403 (security context missing)
 *       - SUPERADMIN                  -> allow (global platform bypass)
 *       - OWNER on a SYSTEM route     -> 403 (system routes are blacklisted)
 *       - OWNER on any other route    -> allow (tenant-scoped bypass)
 *       - otherwise                   -> allow iff role ∈ required roles, else 403
 *     fast-check drives ≥ 100 generated cases over arbitrary required-role sets,
 *     caller roles (including roles outside the gate and unknown roles), and
 *     system / non-system URLs.
 *
 *   PART B — Gate coverage (Requirement 3.4).
 *     Reflection over the migrated HR controller classes asserts that every
 *     mutating handler (@Post / @Put / @Patch / @Delete) declares `@Roles`
 *     metadata (on the handler or its controller class).
 *
 *     SCOPE NOTE: the legacy monolith `HRController` (hr.controller.ts) is a
 *     separate, pre-existing REST surface that still carries many ungated
 *     mutating handlers; it is intentionally NOT asserted here so this property
 *     reflects the canonical migrated surface the stabilization spec defines.
 *     The legacy gap is reported separately rather than silently fixed.
 */

const ALL_ROLES: UserRole[] = [
  UserRole.SUPERADMIN,
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.MEMBER,
];

// Mirrors the SYSTEM_ROUTES blacklist in roles.guard.ts (OWNER is blocked here).
const SYSTEM_ROUTES = [
  "/v1/audit/repair",
  "/v1/admin/infra",
  "/v1/admin/audit",
  "/v1/license",
  "/v1/logs",
  "/v1/sync",
  "/v1/audit/verify",
];

const NON_SYSTEM_ROUTES = [
  "/v1/hr/recruitment/requisitions",
  "/v1/hr/payroll/calculate/emp-1",
  "/v1/hr/leave",
  "/v1/hr/scheduling/schedules",
  "/hr/employees",
  "/v1/hr/time/device/ingest",
];

function isSystemRoute(url: string): boolean {
  return SYSTEM_ROUTES.some((route) => url.startsWith(route));
}

type GuardOutcome = "allow" | "forbid";

/**
 * Independent oracle mirroring roles.guard.ts decision logic exactly.
 * `requiredRoles === undefined` models a route with no @Roles metadata.
 * `callerRole === undefined` models a missing TenantContext.
 */
function expectedOutcome(
  requiredRoles: UserRole[] | undefined,
  callerRole: string | undefined,
  url: string,
): GuardOutcome {
  if (requiredRoles === undefined) return "allow";
  if (callerRole === undefined) return "forbid"; // security context missing -> 403
  if (callerRole === UserRole.SUPERADMIN) return "allow";
  if (callerRole === UserRole.OWNER) {
    return isSystemRoute(url) ? "forbid" : "allow";
  }
  return requiredRoles.includes(callerRole as UserRole) ? "allow" : "forbid";
}

/**
 * Builds a mocked ExecutionContext. When `requiredRoles` is undefined no @Roles
 * metadata is attached (ungated route). When `callerRole` is undefined the
 * request carries no `tenantContext`.
 */
function buildContext(
  requiredRoles: UserRole[] | undefined,
  callerRole: string | undefined,
  url: string,
): ExecutionContext {
  const handler = function testHandler() {};
  if (requiredRoles !== undefined) {
    Reflect.defineMetadata(ROLES_KEY, requiredRoles, handler);
  }
  class TestController {}

  const request: any = { url };
  if (callerRole !== undefined) {
    request.tenantContext = { tenant_id: "tnt-1", role: callerRole, user_id: "usr-1" };
  }

  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

function runGuard(ctx: ExecutionContext): GuardOutcome {
  const guard = new RolesGuard(new Reflector());
  try {
    const result = guard.canActivate(ctx);
    return result ? "allow" : "forbid";
  } catch (err) {
    if (err instanceof ForbiddenException) return "forbid";
    throw err;
  }
}

describe("Property 3: Mutating endpoints enforce their Role_Gate", () => {
  // ── PART A: guard enforcement semantics (Requirements 3.1, 3.2, 3.3) ──
  it("allows iff caller role ∈ gate or privileged bypass, else rejects with 403", () => {
    const roleArb: fc.Arbitrary<string> = fc.oneof(
      fc.constantFrom<string>(...ALL_ROLES),
      // unknown roles model callers whose role is neither in the gate nor privileged
      fc.constantFrom<string>("GUEST", "VENDOR", "", "member"),
    );

    const requiredRolesArb: fc.Arbitrary<UserRole[] | undefined> = fc.oneof(
      // undefined => ungated route (no @Roles metadata)
      fc.constant<UserRole[] | undefined>(undefined),
      // any subset (including empty) of the known roles forms a concrete gate
      fc.subarray(ALL_ROLES, { minLength: 0, maxLength: ALL_ROLES.length }),
    );

    const urlArb: fc.Arbitrary<string> = fc.constantFrom<string>(
      ...SYSTEM_ROUTES,
      ...NON_SYSTEM_ROUTES,
    );

    // callerRole undefined => missing TenantContext branch
    const callerArb: fc.Arbitrary<string | undefined> = fc.oneof(
      roleArb,
      fc.constant<string | undefined>(undefined),
    );

    fc.assert(
      fc.property(requiredRolesArb, callerArb, urlArb, (requiredRoles, callerRole, url) => {
        const ctx = buildContext(requiredRoles, callerRole, url);
        const actual = runGuard(ctx);
        const expected = expectedOutcome(requiredRoles, callerRole, url);
        expect(actual).toBe(expected);
      }),
      { numRuns: 300 },
    );
  });

  it("rejects every non-privileged role excluded from a non-empty gate (403)", () => {
    fc.assert(
      fc.property(
        fc.subarray(ALL_ROLES, { minLength: 1, maxLength: ALL_ROLES.length }),
        fc.constantFrom<string>(...ALL_ROLES, "GUEST"),
        fc.constantFrom<string>(...NON_SYSTEM_ROUTES),
        (gate, callerRole, url) => {
          // restrict to non-privileged callers who are NOT in the gate
          fc.pre(
            callerRole !== UserRole.SUPERADMIN &&
              callerRole !== UserRole.OWNER &&
              !gate.includes(callerRole as UserRole),
          );
          const ctx = buildContext(gate, callerRole, url);
          expect(runGuard(ctx)).toBe("forbid");
        },
      ),
      { numRuns: 150 },
    );
  });

  // ── PART B: gate coverage over migrated controllers (Requirement 3.4) ──
  it("every mutating handler in the migrated HR controllers declares a @Roles gate", () => {
    const MUTATING_METHODS = new Set<RequestMethod>([
      RequestMethod.POST,
      RequestMethod.PUT,
      RequestMethod.PATCH,
      RequestMethod.DELETE,
    ]);

    const controllers = [
      HrSchedulingController,
      HrPayrollController,
      HrLeaveController,
      HrAttendanceController,
      HrRecruitmentController,
      TimeAndAttendanceController,
      AttendanceDeviceController,
    ];

    const ungated: string[] = [];
    let mutatingHandlerCount = 0;

    for (const controller of controllers) {
      const proto = controller.prototype;
      const classRoles = Reflect.getMetadata(ROLES_KEY, controller);

      for (const name of Object.getOwnPropertyNames(proto)) {
        if (name === "constructor") continue;
        const handler = proto[name];
        if (typeof handler !== "function") continue;

        const httpMethod = Reflect.getMetadata("method", handler) as RequestMethod | undefined;
        if (httpMethod === undefined || !MUTATING_METHODS.has(httpMethod)) continue;

        mutatingHandlerCount += 1;
        const handlerRoles = Reflect.getMetadata(ROLES_KEY, handler);
        const roles = handlerRoles ?? classRoles;
        const gated = Array.isArray(roles) && roles.length > 0;
        if (!gated) {
          ungated.push(`${controller.name}.${name}`);
        }
      }
    }

    // Sanity: we actually discovered mutating handlers to inspect.
    expect(mutatingHandlerCount).toBeGreaterThan(0);
    expect(ungated).toEqual([]);
  });
});
