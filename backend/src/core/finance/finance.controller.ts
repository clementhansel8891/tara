import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TenantInterceptor } from '../../gateway/tenant.interceptor';
import { TenantContext } from '../../gateway/tenant-context.interface';

interface RequestWithTenant extends Request {
  tenantContext: TenantContext;
}

@Controller('finance')
@UseInterceptors(TenantInterceptor)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // Ledger & Transactions
  @Get('ledger')
  async getLedger(
    @Req() request: RequestWithTenant,
    @Query('locationId') locationId?: string,
  ) {
    const { tenantId } = request.tenantContext;
    const ledger = await this.financeService.getLedger(tenantId, locationId);
    return { success: true, tenantId, data: ledger };
  }

  @Post('transactions')
  async createTransaction(
    @Req() request: RequestWithTenant,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    const { tenantId, locationId } = request.tenantContext;
    if (locationId && !createTransactionDto.locationId) {
      createTransactionDto.locationId = locationId;
    }
    const transaction = await this.financeService.createTransaction(tenantId, createTransactionDto);
    return { success: true, tenantId, data: transaction };
  }

  @Get('balance')
  async getBalance(@Req() request: RequestWithTenant) {
    const { tenantId } = request.tenantContext;
    const balance = await this.financeService.getBalance(tenantId);
    return { success: true, tenantId, data: balance };
  }

  // Assets
  @Get('assets')
  async listAssets(@Req() request: RequestWithTenant) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.listAssets(tenantId);
      return { success: true, data };
  }

  @Post('assets/:id/status')
  async updateAssetStatus(@Req() request: RequestWithTenant, @Param('id') id: string, @Body() body: { status: string }) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.updateAssetStatus(tenantId, id, body.status);
      return { success: true, data };
  }

  @Post('assets/:id/capitalize')
  async capitalizeAsset(@Req() request: RequestWithTenant, @Param('id') id: string, @Body() body: { capitalizationDate: string }) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.capitalizeAsset(tenantId, id, body.capitalizationDate);
      return { success: true, data };
  }

  // Capex
  @Get('capex/requests')
  async listCapexRequests(@Req() request: RequestWithTenant) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.listCapexRequests(tenantId);
      return { success: true, data };
  }

  @Post('capex/requests')
  async createCapexRequest(@Req() request: RequestWithTenant, @Body() body: any) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.createCapexRequest(tenantId, body);
      return { success: true, data };
  }

  @Get('capex/budgets')
  async listCapexBudgets(@Req() request: RequestWithTenant) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.listCapexBudgets(tenantId);
      return { success: true, data };
  }

  @Post('capex/budgets')
  async setCapexBudget(@Req() request: RequestWithTenant, @Body() body: any) {
      const { tenantId } = request.tenantContext;
      await this.financeService.setCapexBudget(tenantId, body);
      return { success: true };
  }

  @Post('capex/requests/:id/approve')
  async approveCapexRequest(@Req() request: RequestWithTenant, @Param('id') id: string) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.approveCapexRequest(tenantId, id);
      return { success: true, data };
  }

  @Post('capex/requests/:id/reject')
  async rejectCapexRequest(@Req() request: RequestWithTenant, @Param('id') id: string) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.rejectCapexRequest(tenantId, id);
      return { success: true, data };
  }

  // Depreciation
  @Get('assets/depreciation')
  async listAssetDepreciationEntries(@Req() request: RequestWithTenant, @Query('assetId') assetId?: string) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.listAssetDepreciationEntries(tenantId, assetId);
      return { success: true, data };
  }

  @Post('assets/depreciation/schedule-run')
  async runScheduledPeriodDepreciation(@Req() request: RequestWithTenant, @Body() body: any) {
       const { tenantId } = request.tenantContext;
       const data = await this.financeService.runScheduledPeriodDepreciation(tenantId, body.periodStart, body.periodEnd);
       return { success: true, data };
  }

  @Post('assets/:id/depreciation')
  async postDepreciation(@Req() request: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.createDepreciationEntry(tenantId, { ...body, assetId: id });
      return { success: true, data };
  }

  // Events
  @Get('assets/events')
  async listAssetEvents(@Req() request: RequestWithTenant, @Query('assetId') assetId?: string) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.listAssetEvents(tenantId, assetId);
      return { success: true, data };
  }

  @Post('assets/:id/impairment')
  async recordAssetImpairment(@Req() request: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.createAssetEvent(tenantId, { ...body, assetId: id, type: 'IMPAIRMENT' });
      return { success: true, data };
  }

  @Post('assets/:id/revaluation')
  async recordAssetRevaluation(@Req() request: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.createAssetEvent(tenantId, { ...body, assetId: id, type: 'REVALUATION' });
      return { success: true, data };
  }

  @Post('assets/:id/disposal')
  async disposeAsset(@Req() request: RequestWithTenant, @Param('id') id: string, @Body() body: any) {
       const { tenantId } = request.tenantContext;
       const data = await this.financeService.createAssetEvent(tenantId, { ...body, assetId: id, type: 'DISPOSAL' });
       return { success: true, data };
  }

  @Get('assets/:id/audit-pack')
  async getAssetAuditPack(@Req() request: RequestWithTenant, @Param('id') id: string) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.getAssetAuditPack(tenantId, id);
      return { success: true, data };
  }

  // Receivables
  @Get('receivables')
  async listReceivables(@Req() request: RequestWithTenant) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.listReceivables(tenantId);
      return { success: true, data };
  }

  @Post('receivables')
  async createReceivable(@Req() request: RequestWithTenant, @Body() body: any) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.createReceivable(tenantId, body);
      return { success: true, data };
  }

  @Post('receivables/:id/mark-received')
  async markReceivableReceived(@Req() request: RequestWithTenant, @Param('id') id: string) {
      const { tenantId } = request.tenantContext;
      await this.financeService.markReceivableReceived(tenantId, id);
      return { success: true };
  }

  @Post('receivables/:id/remind')
  async sendReceivableReminder(@Req() request: RequestWithTenant, @Param('id') id: string) {
      const { tenantId } = request.tenantContext;
      await this.financeService.sendReceivableReminder(tenantId, id);
      return { success: true };
  }

  // Payables
  @Get('payables')
  async listPayables(@Req() request: RequestWithTenant) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.listPayables(tenantId);
      return { success: true, data };
  }

  @Post('payables')
  async createPayable(@Req() request: RequestWithTenant, @Body() body: any) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.createPayable(tenantId, body);
      return { success: true, data };
  }

  @Post('payables/:id/approve')
  async approvePayable(@Req() request: RequestWithTenant, @Param('id') id: string) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.approvePayable(tenantId, id);
      return { success: true, data };
  }

  @Post('payables/:id/mark-paid')
  async markPayablePaid(@Req() request: RequestWithTenant, @Param('id') id: string) {
      const { tenantId } = request.tenantContext;
      await this.financeService.markPayablePaid(tenantId, id);
      return { success: true };
  }

  // Payments
  @Get('payments')
  async listPayments(@Req() request: RequestWithTenant) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.listPayments(tenantId);
      return { success: true, data };
  }

  @Post('payment-requests')
  async createPaymentRequest(@Req() request: RequestWithTenant, @Body() body: any) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.createPaymentRequest(tenantId, body);
      return { success: true, data };
  }

  @Post('payments/:id/status')
  async updatePaymentStatus(@Req() request: RequestWithTenant, @Param('id') id: string, @Body() body: { status: string }) {
      const { tenantId } = request.tenantContext;
      await this.financeService.updatePaymentStatus(tenantId, id, body.status);
      return { success: true };
  }

  // Documents
  @Get('documents')
  async listDocuments(@Req() request: RequestWithTenant) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.listDocuments(tenantId);
      return { success: true, data };
  }
  
  // Policies & Periods
  @Get('policies')
  async listPolicies(@Req() request: RequestWithTenant) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.listPolicies(tenantId);
      return { success: true, data };
  }

  @Get('periods')
  async listPeriods(@Req() request: RequestWithTenant) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.listPeriods(tenantId);
      return { success: true, data };
  }

  // Insights
  @Get('insights')
  async getInsights(@Req() request: RequestWithTenant) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.getInsights(tenantId);
      return { success: true, data };
  }

  @Get('alerts')
  async getAlerts(@Req() request: RequestWithTenant) {
      const { tenantId } = request.tenantContext;
      const data = await this.financeService.getAlerts(tenantId);
      return { success: true, data };
  }
}
