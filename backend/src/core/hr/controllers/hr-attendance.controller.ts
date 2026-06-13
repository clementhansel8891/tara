import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { Request } from "express";
import { HrAttendanceService } from "../hr-attendance.service";
import { TimeAndAttendanceService } from "../time/time.service";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { RolesGuard } from "../../../shared/guards/roles.guard";
import { TenantGuard } from "../../../shared/guards/tenant.guard";
import { UserRole } from "../../../shared/roles";
import { TenantInterceptor } from "../../../gateway/tenant.interceptor";
import { TenantContext } from "../../../gateway/tenant-context.interface";
import { ModuleStateGuard } from "../../auth/guards/module-state.guard";
import { TenantScopeResolver } from "../scope/tenant-scope.resolver";

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

/**
 * HR Attendance Controller (Phase 3)
 *
 * Identity and scope are derived exclusively from the verified
 * `request.tenantContext` (populated by `TenantInterceptor` after the
 * JWT-bearing tenant middleware), never from client-supplied `x-tenant-id` /
 * `x-location-id` headers (Requirements 2.1, 2.2, 2.3). Each request resolves a
 * validated `TenantScope` via the shared `TenantScopeResolver`, mirroring the
 * pattern used by `HRController` and `HrSchedulingController`. Every mutating
 * endpoint carries a `@Roles(...)` gate (Requirements 3.1, 3.2, 3.4).
 *
 * Clock-in/clock-out is delegated to the single canonical
 * `TimeAndAttendanceService` code path (consolidation per design) instead of a
 * duplicate attendance-service implementation. The single-open-record invariant
 * is NOT changed here; that is task 6.2.
 */
@Controller('hr/attendance')
@UseInterceptors(TenantInterceptor)
@UseGuards(ModuleStateGuard, TenantGuard, RolesGuard)
export class HrAttendanceController {
  constructor(
    private readonly attendanceService: HrAttendanceService,
    private readonly timeService: TimeAndAttendanceService,
    private readonly scopeResolver: TenantScopeResolver,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getAttendance(
    @Req() request: RequestWithTenant,
    @Query("location_id") location_id?: string,
    @Query("employee_id") employee_id?: string,
    @Query("start_date") start_date?: string,
    @Query("end_date") end_date?: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext, {
      location_id,
    });
    return this.attendanceService.getAttendance(
      scope.tenant_id,
      scope.location_id,
      employee_id,
      start_date,
      end_date,
    );
  }

  @Post("clock-in")
  @Roles(UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  async clock_in(
    @Req() request: RequestWithTenant,
    @Body("employee_id") employee_id: string,
    @Body("location_id") location_id?: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    const effectiveLocationId =
      location_id ?? request.tenantContext.location_id ?? "default";
    return this.timeService.clock_in(scope.tenant_id, employee_id, effectiveLocationId);
  }

  @Post("clock-out")
  @Roles(UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  async clock_out(
    @Req() request: RequestWithTenant,
    @Body("employee_id") employee_id: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.timeService.clock_out(scope.tenant_id, employee_id);
  }
}
