import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { HrLeaveService } from "../hr-leave.service";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { RolesGuard } from "../../../shared/guards/roles.guard";
import { TenantGuard } from "../../../shared/guards/tenant.guard";
import { UserRole } from "../../../shared/roles";
import { TenantInterceptor } from "../../../gateway/tenant.interceptor";
import { TenantContext } from "../../../gateway/tenant-context.interface";
import { ModuleStateGuard } from "../../auth/guards/module-state.guard";
import { TenantScopeResolver } from "../scope/tenant-scope.resolver";
import { CreateLeaveRequestDto } from "../dto";

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

/**
 * HR Leave Controller (Phase 4)
 *
 * Identity and scope are derived exclusively from the verified
 * `request.tenantContext` (populated by `TenantInterceptor` after the
 * JWT-bearing tenant middleware), never from client-supplied `x-tenant-id`
 * headers or `req.user?.id` (Requirements 2.1, 2.2, 2.3). Each request resolves
 * a validated `TenantScope` via the shared `TenantScopeResolver`, mirroring the
 * pattern used by `HrSchedulingController` and `HrAttendanceController`. Every
 * mutating endpoint (submit/approve/reject) carries a `@Roles(...)` gate
 * (Requirements 3.1, 3.2, 3.4), and the approver/reviewer identity recorded on
 * approve/reject is sourced from `request.tenantContext.user_id`.
 *
 * Routes are served under `/hr/leaves`, distinct from the `/hr/leave-requests`
 * routes served by `HRController`, so there is no route collision.
 *
 * NOTE: `HrLeaveService` method signatures still take `tenant_id` as their first
 * argument; this task only migrates the controller's identity/scope sourcing, so
 * the resolved `scope.tenant_id` (and `scope.location_id` for the
 * location-filtered list read) is passed through unchanged. Service-internal
 * changes are deferred to tasks 8.2/8.3.
 */
@Controller('hr/leaves')
@UseInterceptors(TenantInterceptor)
@UseGuards(ModuleStateGuard, TenantGuard, RolesGuard)
export class HrLeaveController {
  constructor(
    private readonly leaveService: HrLeaveService,
    private readonly scopeResolver: TenantScopeResolver,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getLeaveRequests(
    @Req() request: RequestWithTenant,
    @Query("location_id") location_id?: string,
    @Query("status") status?: string,
    @Query("employee_id") employee_id?: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext, {
      location_id,
    });
    return this.leaveService.getLeaveRequests(
      scope.tenant_id,
      scope.location_id,
      status,
      employee_id,
    );
  }

  @Post()
  @Roles(UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  async createLeaveRequest(
    @Req() request: RequestWithTenant,
    @Body() data: CreateLeaveRequestDto,
  ) {
    const user_id = request.tenantContext.user_id ?? "system";
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.leaveService.createLeaveRequest(scope.tenant_id, data, user_id);
  }

  @Put(":id/approve")
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async approveLeaveRequest(
    @Req() request: RequestWithTenant,
    @Param("id") id: string,
    @Body("notes") notes: string,
  ) {
    const user_id = request.tenantContext.user_id ?? "system";
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.leaveService.approveLeaveRequest(
      scope.tenant_id,
      id,
      user_id,
      notes,
      user_id,
    );
  }

  @Put(":id/reject")
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  async rejectLeaveRequest(
    @Req() request: RequestWithTenant,
    @Param("id") id: string,
    @Body("notes") notes: string,
  ) {
    const user_id = request.tenantContext.user_id ?? "system";
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.leaveService.rejectLeaveRequest(
      scope.tenant_id,
      id,
      user_id,
      notes,
      user_id,
    );
  }
}
