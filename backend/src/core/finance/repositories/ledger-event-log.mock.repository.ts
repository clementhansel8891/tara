import { Injectable } from '@nestjs/common';
import { LedgerEventLog } from '../domain/finance.interfaces';
import { ILedgerEventLogRepository } from './interfaces/ledger-event-log.repository.interface';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LedgerEventLogMockRepository implements ILedgerEventLogRepository {
  private logs: Map<string, LedgerEventLog[]> = new Map();

  async create(tenantId: string, companyId: string, data: any): Promise<LedgerEventLog> {
    const scopeKey = `${tenantId}:${companyId}`;
    const list = this.logs.get(scopeKey) || [];

    // Check for existing event based on sourceEventId within the scope
    const existing = list.find(l => l.sourceEventId === data.sourceEventId);
    if (existing) {
      throw new Error(`Conflict: Event ${data.sourceEventId} already exists for tenant ${tenantId} and company ${companyId}`);
    }

    const newLog: LedgerEventLog = {
      id: uuid(), // Reverted to uuid() as it's more robust than Math.random() for IDs
      tenantId,
      companyId,
      eventType: data.eventType || '',
      sourceEventId: data.sourceEventId || '',
      status: data.status || 'PENDING',
      payload: data.payload || {},
      sequenceKey: data.sequenceKey,
      sequenceNumber: data.sequenceNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    list.push(newLog);
    this.logs.set(scopeKey, list);
    return newLog;
  }

  async findBySourceEventId(tenantId: string, companyId: string, sourceEventId: string): Promise<LedgerEventLog | null> {
    const list = this.logs.get(`${tenantId}:${companyId}`) || [];
    return list.find(l => l.sourceEventId === sourceEventId) || null;
  }

  async updateStatus(tenantId: string, companyId: string, id: string, status: 'PENDING' | 'POSTED' | 'FAILED'): Promise<void> {
    const scopeKey = `${tenantId}:${companyId}`;
    const list = this.logs.get(scopeKey) || [];
    const index = list.findIndex(l => l.id === id);
    if (index !== -1) {
      const updatedLog = { ...list[index], status, updatedAt: new Date() };
      if (status === 'POSTED') {
        updatedLog.processedAt = new Date();
      }
      list[index] = updatedLog;
      this.logs.set(scopeKey, list);
    }
  }

  async findUnprocessed(tenantId: string, companyId: string, batchSize: number): Promise<LedgerEventLog[]> {
    const list = this.logs.get(`${tenantId}:${companyId}`) || [];
    return list
      .filter(l => l.status === 'PENDING')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) // Added sorting to match original behavior
      .slice(0, batchSize);
  }

  async markProcessed(tenantId: string, companyId: string, id: string): Promise<void> {
    await this.updateStatus(tenantId, companyId, id, 'POSTED');
  }

  async findProcessedBefore(tenantId: string, companyId: string, date: Date): Promise<LedgerEventLog[]> {
    const list = this.logs.get(`${tenantId}:${companyId}`) || [];
    return list.filter(l => l.status === 'POSTED' && l.processedAt && l.processedAt < date);
  }

  async deleteMany(tenantId: string, companyId: string, ids: string[]): Promise<void> {
    const scopeKey = `${tenantId}:${companyId}`;
    let list = this.logs.get(scopeKey) || [];
    list = list.filter(l => !ids.includes(l.id));
    this.logs.set(scopeKey, list);
  }
}
