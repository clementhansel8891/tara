import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../persistence/prisma.service';
import { IFinancialReportSnapshotRepository } from './interfaces/financial-report-snapshot.repository.interface';
import { FinancialReportSnapshot } from '../domain/finance.interfaces';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FinancialReportSnapshotDbRepository implements IFinancialReportSnapshotRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient
  ) {}

  private get db(): Prisma.TransactionClient {
    return this.prisma;
  }

  async create(data: Partial<FinancialReportSnapshot>): Promise<FinancialReportSnapshot> {
    const id = data.id || uuid();
    
    const saved = await this.db.finance_financial_report_snapshots.create({
      data: {
        id,
        tenant_id: data.tenant_id!,
        company_id: data.company_id!,
        report_type: data.reportType!,
        fiscal_period: data.fiscalPeriodId!,
        snapshot_data: JSON.parse(data.compressedReportData || '{}'),
        report_hash: data.integrityHash!,
      }
    });

    return this.mapEntity(saved);
  }

  async findLatest(tenant_id: string, company_id: string, reportType: string, fiscalPeriodId: string, parametersHash: string): Promise<FinancialReportSnapshot | null> {
    const raw = await this.db.finance_financial_report_snapshots.findFirst({
      where: { 
        tenant_id, 
        company_id, 
        report_type: reportType,
        fiscal_period: fiscalPeriodId,
        report_hash: parametersHash 
      },
      orderBy: { created_at: 'desc' }
    });

    if (!raw) return null;
    return this.mapEntity(raw);
  }

  async deleteOldSnapshots(tenant_id: string, company_id: string, olderThan: Date): Promise<void> {
    await this.db.finance_financial_report_snapshots.deleteMany({
      where: {
        tenant_id,
        company_id,
        created_at: { lt: olderThan }
      }
    });
  }

  private mapEntity(raw: any): FinancialReportSnapshot {
    return {
      id: raw.id,
      tenant_id: raw.tenant_id,
      company_id: raw.company_id,
      fiscalPeriodId: raw.fiscal_period,
      snapshotSequence: 0, 
      reportType: raw.report_type,
      compressedReportData: JSON.stringify(raw.snapshot_data),
      integrityHash: raw.report_hash,
      created_at: raw.created_at,
    };
  }
}
