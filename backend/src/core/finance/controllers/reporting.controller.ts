import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportingEngineService } from '../services/reporting-engine.service';
import { ConsolidationReportService } from '../services/consolidation-report.service';
import { TenantGuard } from '../../../shared/guards/tenant.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { TenantCtx } from '../../../gateway/tenant-context.decorator';
import { TenantContext } from '../../../gateway/tenant-context.interface';

@Controller('v1/finance/reporting')
@UseGuards(TenantGuard, RolesGuard)
export class ReportingController {
  constructor(
    private readonly reportingEngineService: ReportingEngineService,
    private readonly consolidationReportService: ConsolidationReportService,
  ) {}

  @Get('trends')
  async getTrendReport(
    @TenantCtx() ctx: TenantContext,
    @Query('companyId') companyId: string,
    @Query('periodIds') periodIds: string[],
    @Query('metric') metric: 'REVENUE' | 'NET_PROFIT' | 'EXPENSE' = 'REVENUE',
  ) {
    const targetCompanyId = companyId || ctx.companyId;
    return this.reportingEngineService.getTrendReport(ctx.tenantId, targetCompanyId, periodIds, metric);
  }

  @Get('consolidated')
  async getConsolidatedReport(
    @TenantCtx() ctx: TenantContext,
    @Query('companyId') companyId: string,
    @Query('fiscalPeriodId') fiscalPeriodId: string,
    @Query('type') type: 'PROFIT_LOSS' | 'BALANCE_SHEET',
  ) {
    const targetCompanyId = companyId || ctx.companyId;
    return this.consolidationReportService.getConsolidatedReport(ctx.tenantId, targetCompanyId, type, fiscalPeriodId);
  }
}
