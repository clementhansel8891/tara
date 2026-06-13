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
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { HrPayrollService } from "../hr-payroll.service";
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
 * HR Payroll Controller (Phase 5)
 *
 * Identity and scope are derived exclusively from the verified
 * `request.tenantContext` (populated by `TenantInterceptor` after the
 * JWT-bearing tenant middleware), never from client-supplied `x-tenant-id`
 * headers or `req.user?.id` (Requirements 2.1, 2.2, 2.3). Each request resolves
 * a validated `TenantScope` via the shared `TenantScopeResolver`, mirroring the
 * pattern used by `HrSchedulingController` and `HrLeaveController`. Every
 * mutating endpoint (calculate / update-compensation / approve / disburse /
 * settle / export) carries a `@Roles(...)` gate (Requirements 3.1, 3.2, 3.4),
 * and the actor identity recorded on those operations is sourced from
 * `request.tenantContext.user_id`.
 *
 * NOTE: `HrPayrollService` method signatures still take `tenant_id` as their
 * first argument; this task only migrates the controller's identity/scope
 * sourcing, so the resolved `scope.tenant_id` (and `scope.location_id` for the
 * location-filtered list read) is passed through unchanged. Service-internal
 * changes (calculation, atomic lifecycle transitions, finance integration) are
 * deferred to tasks 10.2–10.5.
 */
@Controller('hr/payroll')
@UseInterceptors(TenantInterceptor)
@UseGuards(ModuleStateGuard, TenantGuard, RolesGuard)
export class HrPayrollController {
  constructor(
    private readonly payrollService: HrPayrollService,
    private readonly scopeResolver: TenantScopeResolver,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getPayroll(
    @Req() request: RequestWithTenant,
    @Query("location_id") location_id?: string,
    @Query("employee_id") employee_id?: string,
    @Query("period") period?: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext, {
      location_id,
    });
    return this.payrollService.getPayroll(
      scope.tenant_id,
      scope.location_id,
      employee_id,
      period,
    );
  }

  @Post("calculate/:employee_id")
  @Roles(UserRole.ADMIN)
  async calculatePayroll(
    @Req() request: RequestWithTenant,
    @Param("employee_id") employee_id: string,
    @Body("period") period: string,
  ) {
    const user_id = request.tenantContext.user_id ?? "system";
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.payrollService.calculatePayroll(
      scope.tenant_id,
      employee_id,
      period,
      user_id,
    );
  }

  @Get("compensation/:employee_id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getCompensation(
    @Req() request: RequestWithTenant,
    @Param("employee_id") employee_id: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.payrollService.getCompensation(scope.tenant_id, employee_id);
  }

  @Put("compensation/:employee_id")
  @Roles(UserRole.ADMIN)
  async updateCompensation(
    @Req() request: RequestWithTenant,
    @Param("employee_id") employee_id: string,
    @Body() data: any,
  ) {
    const user_id = request.tenantContext.user_id ?? "system";
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.payrollService.updateCompensation(
      scope.tenant_id,
      employee_id,
      data,
      user_id,
    );
  }

  @Get("analytics")
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getCompensationAnalytics(@Req() request: RequestWithTenant) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.payrollService.getCompensationAnalytics(scope.tenant_id);
  }

  @Post(":id/approve")
  @Roles(UserRole.ADMIN)
  async approvePayroll(
    @Req() request: RequestWithTenant,
    @Param("id") run_id: string,
  ) {
    const user_id = request.tenantContext.user_id ?? "system";
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.payrollService.approvePayroll(scope.tenant_id, run_id, user_id);
  }

  @Post(":id/export-bank")
  @Roles(UserRole.ADMIN)
  async exportBankFile(
    @Req() request: RequestWithTenant,
    @Param("id") run_id: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.payrollService.generateBankFile(scope.tenant_id, run_id);
  }

  @Post(":id/confirm")
  @Roles(UserRole.ADMIN)
  async confirmDisbursement(
    @Req() request: RequestWithTenant,
    @Param("id") run_id: string,
  ) {
    const user_id = request.tenantContext.user_id ?? "system";
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.payrollService.confirmDisbursement(
      scope.tenant_id,
      run_id,
      user_id,
    );
  }

  @Get(":id/payslip/:employee_id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  async getPayslip(
    @Req() request: RequestWithTenant,
    @Param("id") run_id: string,
    @Param("employee_id") employee_id: string,
    @Res() res: Response,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    const pdfBuffer = await this.payrollService.generatePayslip(
      scope.tenant_id,
      run_id,
      employee_id,
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=payslip_${employee_id}_${run_id}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get("performance-snapshot/:employee_id")
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER)
  async getPerformanceSnapshot(
    @Req() request: RequestWithTenant,
    @Param("employee_id") employee_id: string,
  ) {
    const scope = await this.scopeResolver.resolve(request.tenantContext);
    return this.payrollService.getPerformanceSnapshot(
      scope.tenant_id,
      employee_id,
    );
  }
}
