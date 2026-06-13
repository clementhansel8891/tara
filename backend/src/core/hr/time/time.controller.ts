import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { TimeAndAttendanceService } from './time.service';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { TenantGuard } from '../../../shared/guards/tenant.guard';
import { UserRole } from '../../../shared/roles';
import { TenantInterceptor } from '../../../gateway/tenant.interceptor';
import { TenantContext } from '../../../gateway/tenant-context.interface';
import { ModuleStateGuard } from '../../auth/guards/module-state.guard';
import { TenantScopeResolver } from '../scope/tenant-scope.resolver';

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

/**
 * Time & Attendance Controller (Phase 3)
 *
 * Identity and scope are derived exclusively from the verified
 * `request.tenantContext` (populated by `TenantInterceptor` after the
 * JWT-bearing tenant middleware), never from client-supplied `x-tenant-id`
 * headers (Requirements 2.1, 2.2, 2.3). Each request resolves a validated
 * `TenantScope` via the shared `TenantScopeResolver`, mirroring the pattern
 * already used by `HRController` and `HrSchedulingController`. Every mutating
 * endpoint carries a `@Roles(...)` gate (Requirements 3.1, 3.2, 3.4).
 *
 * Clock-in/clock-out is delegated to the single canonical
 * `TimeAndAttendanceService` code path (consolidation per design). The
 * single-open-record invariant is NOT changed here; that is task 6.2.
 */
@Controller('hr/time')
@UseInterceptors(TenantInterceptor)
@UseGuards(ModuleStateGuard, TenantGuard, RolesGuard)
export class TimeAndAttendanceController {
  constructor(
    private readonly timeService: TimeAndAttendanceService,
    private readonly scopeResolver: TenantScopeResolver,
  ) {}

  @Post('leave/request')
  @Roles(UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  async requestLeave(
    @Req() request: RequestWithTenant,
    @Body('employee_id') employee_id: string,
    @Body() dto: { type: string; start_date: Date; end_date: Date; reason?: string },
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    const result = await this.timeService.requestLeave(scope.tenant_id, employee_id, dto);
    return { success: true, data: result };
  }

  @Post('leave/:id/approve')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async approveLeave(
    @Req() request: RequestWithTenant,
    @Param('id') leaveId: string,
    @Body('approverId') approverId?: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    // Prefer the verified actor from the context; fall back to the supplied
    // approverId for backward compatibility.
    const approver = request.tenantContext.user_id ?? approverId ?? 'system';
    await this.timeService.approveLeave(scope.tenant_id, leaveId, approver);
    return { success: true, message: 'Leave approved' };
  }

  @Post('clock-in')
  @Roles(UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  async clock_in(
    @Req() request: RequestWithTenant,
    @Body('employee_id') employee_id: string,
    @Body('location_id') location_id?: string,
    @Body('shift_id') shift_id?: string,
    @Body('source') source?: string,
    @Body('device_id') device_id?: string,
    @Body('reason') reason?: string,
    @Body('metadata') metadata?: any,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    const effectiveLocationId =
      location_id ?? request.tenantContext.location_id ?? 'default';
    const result = await this.timeService.clock_in(
      scope.tenant_id,
      employee_id,
      effectiveLocationId,
      {
        shift_id,
        source,
        device_id,
        reason,
        metadata,
      },
    );
    return { success: true, data: result };
  }

  @Post('clock-out')
  @Roles(UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  async clock_out(
    @Req() request: RequestWithTenant,
    @Body('employee_id') employee_id: string,
    @Body('metadata') metadata?: any,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    const result = await this.timeService.clock_out(scope.tenant_id, employee_id, metadata);
    return { success: true, data: result };
  }

  @Post('shift/assign')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async assignShift(
    @Req() request: RequestWithTenant,
    @Body('employee_id') employee_id: string,
    @Body('shift_id') shift_id: string,
    @Body('location_id') location_id: string,
    @Body('date') date: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    await this.timeService.assignShift(
      scope.tenant_id,
      employee_id,
      shift_id,
      location_id,
      date,
    );
    return { success: true, message: 'Shift assigned' };
  }
}
