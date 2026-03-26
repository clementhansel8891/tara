import { Injectable, Inject, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { ReportDefinitionRegistry } from '../domain/report-definition.registry';
import { ProjectionCheckpointService } from './projection-checkpoint.service';
import { IFinancialReportSnapshotRepository } from '../repositories/interfaces/financial-report-snapshot.repository.interface';
import { ProfitLossService } from './profit-loss.service';
import { BalanceSheetService } from './balance-sheet.service';
import { CashFlowService } from './cash-flow.service';

@Injectable()
export class FinancialReportService {
  private readonly logger = new Logger(FinancialReportService.name);

  constructor(
    private readonly registry: ReportDefinitionRegistry,
    private readonly checkpointService: ProjectionCheckpointService,
    private readonly plService: ProfitLossService,
    private readonly bsService: BalanceSheetService,
    private readonly cfService: CashFlowService,
    @Inject('IFinancialReportSnapshotRepository')
    private readonly snapshotRepo: IFinancialReportSnapshotRepository,
  ) {}

  async getReport(tenantId: string, companyId: string, type: string, fiscalPeriodId: string, dimensions?: Record<string, string>): Promise<any> {
    const definition = this.registry.getDefinition(type);
    if (!definition) throw new Error(`Unknown report type: ${type}`);

    const parametersHash = this.computeParametersHash(fiscalPeriodId, dimensions);
    const latestCheckpoint = await this.checkpointService.getLatestCheckpoint(tenantId, companyId);
    const cached = await this.snapshotRepo.findLatest(tenantId, companyId, type, fiscalPeriodId, parametersHash);

    if (cached && (cached.projectionCheckpointSequence as any) === latestCheckpoint) {
      if (cached.tenantId === tenantId && cached.companyId === companyId) {
        return this.decompressReport(cached.compressedData || '');
      }
    }

    await this.validateAccess(tenantId, companyId, dimensions?.branchId);

    let reportData: any;
    switch (type) {
      case 'PROFIT_LOSS':
        reportData = await this.plService.generate(tenantId, companyId, fiscalPeriodId, dimensions);
        break;
      case 'BALANCE_SHEET':
        reportData = await this.bsService.generate(tenantId, companyId, fiscalPeriodId, dimensions);
        break;
      case 'CASH_FLOW':
        reportData = await this.cfService.generate(tenantId, companyId, fiscalPeriodId);
        break;
      default:
        throw new Error(`Report type ${type} not supported`);
    }

    await this.cacheReport(tenantId, companyId, type, fiscalPeriodId, parametersHash, reportData, latestCheckpoint, definition.version);

    return reportData;
  }

  private computeParametersHash(fiscalPeriodId: string, dimensions?: Record<string, string>): string {
    const payload = JSON.stringify({ fiscalPeriodId, dimensions: dimensions || {} });
    return createHash('sha256').update(payload).digest('hex');
  }

  private async cacheReport(
    tenantId: string, 
    companyId: string,
    type: string, 
    fiscalPeriodId: string, 
    paramsHash: string, 
    data: any, 
    checkpoint: number,
    version: string
  ): Promise<void> {
    const serialized = JSON.stringify(data);
    const compressed = Buffer.from(serialized).toString('base64');

    await this.snapshotRepo.create({
      tenantId,
      companyId,
      reportType: type,
      reportVersion: Number(version) || 1,
      fiscalPeriodId,
      reportParametersHash: paramsHash,
      compressedData: compressed,
      projectionCheckpointSequence: checkpoint,
    });
  }

  private decompressReport(compressed: string): any {
    const serialized = Buffer.from(compressed, 'base64').toString('utf-8');
    return JSON.parse(serialized);
  }

  private async validateAccess(tenantId: string, companyId: string, branchId?: string): Promise<void> {
    if (!tenantId || !companyId) throw new Error(`Access denied`);
  }
}
