import { describe, it, expect, vi, beforeEach } from "vitest";

import { TimeAndAttendanceController } from "./time.controller";
import { AttendanceDeviceController } from "./device.controller";
import { HrAttendanceController } from "../controllers/hr-attendance.controller";
import { TenantContext } from "../../../gateway/tenant-context.interface";
import { UserRole } from "../../../shared/roles";

/**
 * Task 6.1 — Phase 3 Time & Attendance controller migration.
 *
 * These focused unit tests assert the two core guarantees of the migration:
 *   1. Tenant identity is sourced from the verified `request.tenantContext`
 *      (resolved through `TenantScopeResolver`), NOT from client-supplied
 *      `x-tenant-id` headers (Requirements 2.1, 2.2, 2.3).
 *   2. Clock-in / clock-out (and biometric ingest) are delegated to the single
 *      canonical `TimeAndAttendanceService` code path (consolidation per design).
 *
 * Framework-level role gating (`@Roles` + `RolesGuard`) is exercised separately
 * by the guard/e2e suites; here we only verify the controller wiring.
 */

function buildContext(overrides: Partial<TenantContext> = {}): TenantContext {
  return {
    tenant_id: "tnt-verified",
    company_id: "cmp-verified",
    location_id: "loc-verified",
    user_id: "usr-verified",
    role: UserRole.MANAGER,
    ...overrides,
  };
}

function buildRequest(ctx: TenantContext): any {
  // A spoofed header tenant must never be used; the resolver reads the context.
  return { tenantContext: ctx, headers: { "x-tenant-id": "tnt-SPOOFED" } };
}

describe("TimeAndAttendanceController (task 6.1 migration)", () => {
  let timeService: any;
  let scopeResolver: any;
  let controller: TimeAndAttendanceController;

  beforeEach(() => {
    timeService = {
      clock_in: vi.fn().mockResolvedValue({ id: "att-1", status: "PRESENT" }),
      clock_out: vi.fn().mockResolvedValue({ id: "att-1", status: "PRESENT" }),
      requestLeave: vi.fn().mockResolvedValue({ id: "lv-1" }),
      approveLeave: vi.fn().mockResolvedValue(undefined),
      assignShift: vi.fn().mockResolvedValue(undefined),
    };
    // The resolver echoes the verified context tenant_id, proving the controller
    // routes identity through the resolved scope rather than a header.
    scopeResolver = {
      resolve: vi.fn(async (ctx: TenantContext) => ({
        tenant_id: ctx.tenant_id,
        location_id: ctx.location_id,
      })),
    };
    controller = new TimeAndAttendanceController(timeService, scopeResolver);
  });

  it("clock-in derives tenant from verified context and delegates to TimeAndAttendanceService", async () => {
    const ctx = buildContext();
    await controller.clock_in(buildRequest(ctx), "emp-1", "loc-body");

    expect(scopeResolver.resolve).toHaveBeenCalledWith(ctx);
    expect(timeService.clock_in).toHaveBeenCalledTimes(1);
    const [tenant_id, employee_id, location_id] = timeService.clock_in.mock.calls[0];
    expect(tenant_id).toBe("tnt-verified");
    expect(tenant_id).not.toBe("tnt-SPOOFED");
    expect(employee_id).toBe("emp-1");
    expect(location_id).toBe("loc-body");
  });

  it("clock-out derives tenant from verified context and delegates to TimeAndAttendanceService", async () => {
    const ctx = buildContext();
    await controller.clock_out(buildRequest(ctx), "emp-1");

    expect(timeService.clock_out).toHaveBeenCalledWith("tnt-verified", "emp-1", undefined);
  });

  it("approve-leave records the verified actor from context over a supplied approverId", async () => {
    const ctx = buildContext({ user_id: "usr-approver" });
    await controller.approveLeave(buildRequest(ctx), "lv-1", "spoofed-approver");

    expect(timeService.approveLeave).toHaveBeenCalledWith("tnt-verified", "lv-1", "usr-approver");
  });
});

describe("AttendanceDeviceController (task 6.1 migration)", () => {
  it("ingest derives tenant from verified context and delegates to the canonical service", async () => {
    const timeService: any = {
      biometricIngest: vi.fn().mockResolvedValue({ id: "att-2", status: "PRESENT" }),
    };
    const scopeResolver: any = {
      resolve: vi.fn(async (ctx: TenantContext) => ({ tenant_id: ctx.tenant_id })),
    };
    const controller = new AttendanceDeviceController(timeService, scopeResolver);
    const ctx = buildContext();

    const res = await controller.ingest(buildRequest(ctx), {
      employee_code: "E-100",
      device_id: "dev-1",
      timestamp: new Date().toISOString(),
    });

    expect(timeService.biometricIngest).toHaveBeenCalledTimes(1);
    expect(timeService.biometricIngest.mock.calls[0][0]).toBe("tnt-verified");
    expect(res.success).toBe(true);
    expect(res.record_id).toBe("att-2");
  });
});

describe("HrAttendanceController (task 6.1 migration)", () => {
  it("clock-in/out delegate to the single canonical TimeAndAttendanceService path", async () => {
    const attendanceService: any = {
      getAttendance: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    };
    const timeService: any = {
      clock_in: vi.fn().mockResolvedValue({ id: "att-3" }),
      clock_out: vi.fn().mockResolvedValue({ id: "att-3" }),
    };
    const scopeResolver: any = {
      resolve: vi.fn(async (ctx: TenantContext) => ({
        tenant_id: ctx.tenant_id,
        location_id: ctx.location_id,
      })),
    };
    const controller = new HrAttendanceController(
      attendanceService,
      timeService,
      scopeResolver,
    );
    const ctx = buildContext();

    await controller.clock_in(buildRequest(ctx), "emp-9", "loc-body");
    await controller.clock_out(buildRequest(ctx), "emp-9");

    expect(timeService.clock_in).toHaveBeenCalledWith("tnt-verified", "emp-9", "loc-body");
    expect(timeService.clock_out).toHaveBeenCalledWith("tnt-verified", "emp-9");
  });
});
