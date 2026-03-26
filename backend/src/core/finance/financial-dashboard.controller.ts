import { Controller, Get, Post, Body, Req, UseGuards, ForbiddenException, Query } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { FinancialDashboardService } from './services/financial-dashboard.service';
import { AuditService } from '../../shared/audit/audit.service';
import { AuditChainService } from '../../shared/audit/audit-chain.service';
import { createHash } from 'crypto';

@Controller('v1/finance/dashboard')
@UseGuards(ThrottlerGuard)
export class FinancialDashboardController {
  constructor(
    private readonly dashboardService: FinancialDashboardService,
    private readonly audit: AuditService,
    private readonly auditChain: AuditChainService,
  ) {}

  @Get('summary')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getSummary(@Req() req: any, @Query() query: any) {
    const { tenantId, userId } = req.tenantContext;
    const companyId = query.companyId || tenantId;

    // Requirement 5: Validate allowedCompanies
    this.validateCompanyAccess(req.user, companyId);

    const data = await this.dashboardService.getDashboardSummary(tenantId, companyId, query);

    // Requirement 1 & 8: Backend Audit Enforcement (Resilient)
    // Requirement 2: Audit Enrichment (After State)
    await this.audit.log({
      tenantId,
      userId,
      module: 'FINANCE',
      action: 'FINANCE_DASHBOARD_VIEW',
      entityType: 'FINANCE_SUMMARY',
      entityId: query.periodId || 'LATEST',
      metadata: { filters: query, snapshotSequence: data.sequence },
      afterState: { kpis: data.kpis, healthStatus: data.healthStatus },
      idempotencyKey: this.generateEventIdempotencyKey(userId, 'DASHBOARD_VIEW', query),
    });

    return data;
  }

  @Get('drilldown')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getDrillDown(@Req() req: any, @Query() query: any) {
    const { tenantId, userId } = req.tenantContext;
    const companyId = query.companyId || tenantId;

    this.validateCompanyAccess(req.user, companyId);

    const data = await this.dashboardService.getDrillDown(tenantId, companyId, query);

    await this.audit.log({
      tenantId,
      userId,
      module: 'FINANCE',
      action: 'FINANCE_DRILLDOWN_VIEW',
      entityType: 'FINANCE_LEDGER',
      entityId: query.accountId,
      metadata: { filters: query },
      idempotencyKey: this.generateEventIdempotencyKey(userId, 'DRILLDOWN_VIEW', query),
    });

    return data;
  }

  @Post('export')
  async exportReport(@Req() req: any, @Body() body: any) {
    const { tenantId, userId } = req.tenantContext;
    const companyId = body.companyId || tenantId;

    this.validateCompanyAccess(req.user, companyId);

    const data = await this.dashboardService.exportReport(tenantId, companyId, body, userId);

    await this.audit.log({
      tenantId,
      userId,
      module: 'FINANCE',
      action: 'FINANCE_EXPORT',
      entityType: 'FINANCE_REPORT',
      entityId: body.periodId,
      metadata: { filters: body, exportId: data.exportId },
      beforeState: { summaryKpis: data.reportData?.kpis },
      afterState: { watermark: data.watermark },
      idempotencyKey: this.generateEventIdempotencyKey(userId, 'EXPORT', body),
    });

    return data;
  }

  @Post('verify-export')
  async verifyExport(@Body() body: { data: any; signature: string }) {
    const secret = process.env.FINANCE_EXPORT_SECRET;
    if (!secret) {
      throw new Error('FINANCE_EXPORT_SECRET not configured');
    }
    const isValid = await this.dashboardService.verifyExportSignature(body.data, body.signature, secret);
    return { valid: isValid };
  }

  @Get('health')
  async getHealth(@Req() req: any, @Query('companyId') companyId: string) {
    const { tenantId } = req.tenantContext;
    return this.dashboardService.getSystemHealth(tenantId, companyId || tenantId, 'LATEST');
  }

  @Post('repair-chain')
  async repairChain(@Req() req: any, @Body() body: { fromTimestamp?: string }) {
    const { tenantId, userId } = req.tenantContext;
    if (req.user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Only SuperAdmins can trigger audit chain repairs');
    }
    return this.auditChain.repairChain(
      tenantId, 
      userId, 
      { approvedBy: userId, reason: 'ADMIN_FORCE_REPAIR' },
      body.fromTimestamp ? new Date(body.fromTimestamp) : undefined
    );
  }

  private validateCompanyAccess(user: any, requestedCompanyId: string) {
    // Requirement 4: tenantId from session ONLY (already in req.tenantContext)
    // Requirement 5: validate allowedCompanies
    const userCompanies = user.userCompanies || [];
    const isAllowed = userCompanies.some((uc: any) => uc.tenantId === requestedCompanyId);
    
    if (!isAllowed && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException(`Access Denied: You do not have permission to access company ${requestedCompanyId}`);
    }
  }

  private generateEventIdempotencyKey(userId: string, action: string, params: any): string {
    // Requirement 1: generate event-level idempotencyKey
    // Using a stable hash of user, action, parameters, and time (hourly) to deduplicate views
    // but allowing fresh logs every hour if the user keeps the tab open.
    const hourPrefix = new Date().toISOString().slice(0, 13);
    const source = `${userId}:${action}:${JSON.stringify(params)}:${hourPrefix}`;
    return createHash('sha256').update(source).digest('hex');
  }
}
