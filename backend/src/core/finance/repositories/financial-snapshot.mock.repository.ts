import { Injectable } from '@nestjs/common';
import { FinancialSnapshot } from '../domain/finance.interfaces';

@Injectable()
export class FinancialSnapshotMockRepository {
  private snapshots: FinancialSnapshot[] = [];

  async save(snapshot: FinancialSnapshot): Promise<void> {
    this.snapshots.push(snapshot);
  }

  async findLatest(tenantId: string, companyId: string, periodId: string): Promise<FinancialSnapshot | null> {
    const list = this.snapshots.filter(s => s.tenantId === tenantId && s.companyId === companyId && s.periodId === periodId);
    if (list.length === 0) return null;
    return list.sort((a, b) => (b.snapshotSequence || 0) - (a.snapshotSequence || 0))[0];
  }
}
