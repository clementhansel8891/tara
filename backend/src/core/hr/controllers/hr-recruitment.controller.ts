import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { HrRecruitmentService } from "../hr-recruitment.service";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { RolesGuard } from "../../../shared/guards/roles.guard";
import { TenantGuard } from "../../../shared/guards/tenant.guard";
import { UserRole } from "../../../shared/roles";
import { TenantInterceptor } from "../../../gateway/tenant.interceptor";
import { TenantContext } from "../../../gateway/tenant-context.interface";
import { ModuleStateGuard } from "../../auth/guards/module-state.guard";
import { TenantScopeResolver } from "../scope/tenant-scope.resolver";
import { CreateRequisitionDto } from "../dto";

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

/**
 * HR Recruitment / Performance Controller (Phase 6)
 *
 * Identity and scope are derived exclusively from the verified
 * `request.tenantContext` (populated by `TenantInterceptor` after the
 * JWT-bearing tenant middleware), never from client-supplied `x-tenant-id`
 * headers or `req.user?.id` (Requirements 2.1, 2.2, 2.3). Each request resolves
 * a validated `TenantScope` via the shared `TenantScopeResolver`, mirroring the
 * pattern used by `HrSchedulingController`, `HrLeaveController`, and
 * `HrPayrollController`. Every mutating endpoint (create requisition / create
 * candidate / schedule interview / convert lead) carries a `@Roles(...)` gate
 * (Requirements 3.1, 3.2, 3.4), and the actor identity recorded on those
 * operations is sourced from `request.tenantContext.user_id`.
 *
 * NOTE: `HrRecruitmentService` method signatures still take `tenant_id` as their
 * first argument; this task (12.1) only migrates the controller's identity/scope
 * sourcing and audits the role gates, so the resolved `scope.tenant_id` is passed
 * through unchanged. Service-internal changes (persistent requisition/candidate/
 * cycle/review create+update, atomic candidate hire, scoped reads) are deferred to
 * tasks 12.2–12.4.
 */
@Controller('hr/recruitment')
@UseInterceptors(TenantInterceptor)
@UseGuards(ModuleStateGuard, TenantGuard, RolesGuard)
export class HrRecruitmentController {
  constructor(
    private readonly recruitmentService: HrRecruitmentService,
    private readonly scopeResolver: TenantScopeResolver,
  ) {}

  @Get("requisitions")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getRequisitions(
    @Req() request: RequestWithTenant,
    @Query("status") status?: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.recruitmentService.getRequisitions(scope.tenant_id, status);
  }

  @Post("requisitions")
  @Roles(UserRole.ADMIN)
  async createRequisition(
    @Req() request: RequestWithTenant,
    @Body() data: CreateRequisitionDto,
  ) {
    const user_id = request.tenantContext.user_id ?? "system";
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.recruitmentService.createRequisition(scope.tenant_id, data, user_id);
  }

  @Get("candidates")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getCandidates(
    @Req() request: RequestWithTenant,
    @Query("status") status?: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.recruitmentService.getCandidates(scope.tenant_id, status);
  }

  @Post("candidates")
  @Roles(UserRole.ADMIN)
  async createCandidate(
    @Req() request: RequestWithTenant,
    @Body() data: any,
  ) {
    const user_id = request.tenantContext.user_id ?? "system";
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.recruitmentService.createCandidate(scope.tenant_id, data, user_id);
  }

  @Get("interviews")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getInterviews(
    @Req() request: RequestWithTenant,
    @Query("candidateId") candidateId?: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.recruitmentService.getInterviews(scope.tenant_id, candidateId);
  }

  @Post("interviews")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async scheduleInterview(
    @Req() request: RequestWithTenant,
    @Body() data: any,
  ) {
    const user_id = request.tenantContext.user_id ?? "system";
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.recruitmentService.scheduleInterview(scope.tenant_id, data, user_id);
  }

  @Get("leads")
  @Roles(UserRole.ADMIN)
  async getLeads(
    @Req() request: RequestWithTenant,
    @Query("status") status?: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.recruitmentService.getTalentLeads(scope.tenant_id, status);
  }

  @Post("leads/convert")
  @Roles(UserRole.ADMIN)
  async convertLead(
    @Req() request: RequestWithTenant,
    @Body("lead_id") lead_id: string,
    @Body("requisitionId") requisitionId: string,
  ) {
    const user_id = request.tenantContext.user_id ?? "system";
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.recruitmentService.convertLeadToCandidate(
      scope.tenant_id,
      lead_id,
      requisitionId,
      user_id,
    );
  }
}
