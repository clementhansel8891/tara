import { Injectable } from '@nestjs/common';
import { LedgerHashAnchor } from '../domain/finance.interfaces';
import { ILedgerHashAnchorRepository } from './interfaces/ledger-hash-anchor.repository.interface';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LedgerHashAnchorMockRepository implements ILedgerHashAnchorRepository {
  private anchors: LedgerHashAnchor[] = [];

  async create(tenantId: string, data: { anchorDate: Date, finalJournalHash: string }): Promise<LedgerHashAnchor> {
    const anchor: LedgerHashAnchor = {
      id: uuid(),
      tenantId,
      anchorDate: data.anchorDate,
      finalJournalHash: data.finalJournalHash,
      createdAt: new Date(),
    };
    this.anchors.push(anchor);
    return anchor;
  }

  async findLatest(tenantId: string): Promise<LedgerHashAnchor | null> {
    const tenantAnchors = this.anchors.filter(a => a.tenantId === tenantId);
    if (tenantAnchors.length === 0) return null;
    return tenantAnchors.sort((a, b) => b.anchorDate.getTime() - a.anchorDate.getTime())[0];
  }

  async findByDate(tenantId: string, date: Date): Promise<LedgerHashAnchor | null> {
    return this.anchors.find(a => a.tenantId === tenantId && a.anchorDate.getTime() === date.getTime()) || null;
  }
}
