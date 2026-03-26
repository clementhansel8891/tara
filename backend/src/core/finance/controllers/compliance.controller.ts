import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { TaxExportService } from '../services/tax-export.service';
import { AuditDashboardService } from '../services/audit-dashboard.service';
import { TenantGuard } from '../../../shared/guards/tenant.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { TenantCtx } from '../../../gateway/tenant-context.decorator';
import { TenantContext } from '../../../gateway/tenant-context.interface';
import { UserRole } from '../../../shared/roles';
import { Roles } from '../../../shared/decorators/roles.decorator';

@Controller('v1/finance/compliance')
@UseGuards(TenantGuard, RolesGuard)
export class ComplianceController {
  constructor(
    private readonly taxExportService: TaxExportService,
    private readonly auditDashboardService: AuditDashboardService,
  ) {}

  @Get('tax/report')
  async getTaxReport(
    @TenantCtx() ctx: TenantContext,
    @Query('companyId') companyId: string,
    @Query('fiscalPeriodId') fiscalPeriodId: string,
  ) {
    const targetCompanyId = companyId || ctx.companyId;
    return this.taxExportService.generateTaxReport(ctx.tenantId, targetCompanyId, fiscalPeriodId);
  }

  @Get('audit/integrity')
  async getLedgerIntegrity(
    @TenantCtx() ctx: TenantContext,
    @Query('companyId') companyId: string,
  ) {
    const targetCompanyId = companyId || ctx.companyId;
    return this.auditDashboardService.verifyLedgerIntegrity(ctx.tenantId, targetCompanyId);
  }

  @Get('audit/prove/:reportId')
  async proveReport(
    @TenantCtx() ctx: TenantContext,
    @Param('reportId') reportId: string,
    @Query('reportHash') reportHash: string,
  ) {
    return this.auditDashboardService.proveReport(ctx.tenantId, reportId, reportHash);
  }
}
