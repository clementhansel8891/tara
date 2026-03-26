import { Controller, Get, Query, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { CashflowService } from '../services/cashflow.service';
import { InsightService } from '../services/insight.service';
import { ForecastService } from '../services/forecast.service';
import { RecommendationService } from '../services/recommendation.service';
import { TenantGuard } from '../../../shared/guards/tenant.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { TenantCtx } from '../../../gateway/tenant-context.decorator';
import { TenantContext } from '../../../gateway/tenant-context.interface';

@Controller('v1/finance/intelligence')
@UseGuards(TenantGuard, RolesGuard)
export class FinancialIntelligenceController {
  constructor(
    private readonly cashflowService: CashflowService,
    private readonly insightService: InsightService,
    private readonly forecastService: ForecastService,
    private readonly recommendationService: RecommendationService,
  ) {}

  @Get('recommendations')
  async getRecommendations(
    @TenantCtx() ctx: TenantContext,
    @Query('companyId') companyId: string,
    @Query('snapshotId') snapshotId?: string,
  ) {
    const targetCompanyId = companyId || ctx.companyId;
    const correlationId = `rec-${Date.now()}`;

    return this.recommendationService.getRecommendations({
      tenantId: ctx.tenantId,
      companyId: targetCompanyId,
      snapshotId,
      correlationId,
      userId: ctx.userId || 'anonymous',
    });
  }

  @Get('cashflow')
  async getCashflow(
    @TenantCtx() ctx: TenantContext,
    @Query('companyId') companyId: string,
    @Query('snapshotId') snapshotId?: string,
    @Query('days') days?: string,
    @Query('minimumSafeCash') minimumSafeCash?: string,
    @Query('avgDelayDays') avgDelayDays?: string,
    @Query('timezone') timezone?: string,
    @Query('revenueMultiplier') revMult?: string,
    @Query('expenseMultiplier') expMult?: string,
    @Query('scenarioDelayDays') sceneDelay?: string,
  ) {
    const targetCompanyId = companyId || ctx.companyId;
    const correlationId = `cfo-${Date.now()}`;

    const scenario = (revMult || expMult || sceneDelay) ? {
      revenueMultiplier: revMult ? parseFloat(revMult) : undefined,
      expenseMultiplier: expMult ? parseFloat(expMult) : undefined,
      delayDays: sceneDelay ? parseInt(sceneDelay, 10) : undefined,
    } : undefined;

    return this.cashflowService.getCashflow({
      tenantId: ctx.tenantId,
      companyId: targetCompanyId,
      snapshotId,
      days: days ? parseInt(days, 10) : 30,
      minimumSafeCash: minimumSafeCash ? parseFloat(minimumSafeCash) : 0,
      avgDelayDays: avgDelayDays ? parseInt(avgDelayDays, 10) : 7,
      timezone: timezone || 'UTC',
      scenario,
      correlationId,
      userId: ctx.userId || 'anonymous',
    });
  }

  @Get('insights')
  async getInsights(
    @TenantCtx() ctx: TenantContext,
    @Query('companyId') companyId: string,
    @Query('snapshotId') snapshotId?: string,
  ) {
    const targetCompanyId = companyId || ctx.companyId;
    const correlationId = `insight-${Date.now()}`;

    return this.insightService.getInsights({
      tenantId: ctx.tenantId,
      companyId: targetCompanyId,
      snapshotId,
      correlationId,
      userId: ctx.userId || 'anonymous',
    });
  }

  @Get('forecast')
  async getForecast(
    @TenantCtx() ctx: TenantContext,
    @Query('companyId') companyId: string,
    @Query('snapshotId') snapshotId?: string,
    @Query('horizonDays') horizonDays?: string,
    @Query('revenueMultiplier') revMult?: string,
    @Query('expenseMultiplier') expMult?: string,
  ) {
    const targetCompanyId = companyId || ctx.companyId;

    return this.forecastService.getForecast({
      tenantId: ctx.tenantId,
      companyId: targetCompanyId,
      snapshotId,
      horizonDays: horizonDays ? parseInt(horizonDays, 10) : 90,
      scenario: (revMult || expMult) ? {
        revenueMultiplier: revMult ? parseFloat(revMult) : undefined,
        expenseMultiplier: expMult ? parseFloat(expMult) : undefined,
      } : undefined
    });
  }

  @Get('predictive-insights')
  async getPredictiveInsights(
    @TenantCtx() ctx: TenantContext,
    @Query('companyId') companyId: string,
    @Query('snapshotId') snapshotId?: string,
    @Query('horizonDays') horizonDays?: string,
  ) {
    const targetCompanyId = companyId || ctx.companyId;
    const correlationId = `predict-${Date.now()}`;

    const forecast = await this.forecastService.getForecast({
      tenantId: ctx.tenantId,
      companyId: targetCompanyId,
      snapshotId,
      horizonDays: horizonDays ? parseInt(horizonDays, 10) : 90,
    });

    return this.insightService.getInsights({
      tenantId: ctx.tenantId,
      companyId: targetCompanyId,
      snapshotId,
      correlationId,
      userId: ctx.userId || 'anonymous',
      forecast,
    });
  }

  @Get('insights/snapshot/:id')
  async getSnapshot(@Param('id') id: string) {
    const snapshot = await this.insightService.getSnapshotById(id);
    if (!snapshot) throw new NotFoundException('Snapshot not found');

    const verification = await this.insightService.verifyInsightSnapshot(id);
    return { snapshot, verification };
  }
}

