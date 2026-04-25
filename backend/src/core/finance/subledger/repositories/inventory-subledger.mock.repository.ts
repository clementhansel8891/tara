import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IInventorySubledgerRepository } from './interfaces/inventory-subledger.repository.interface';
import { InventorySubledgerEntry } from '../entities/inventory-subledger-entry.entity';
import { CostLayer } from '../entities/cost-layer.entity';
import { CostSnapshot } from '../entities/cost-snapshot.entity';
import { v4 as uuid } from 'uuid';
import { TenantContext } from '../../../../gateway/tenant-context.interface';

@Injectable()
export class InventorySubledgerMockRepository implements IInventorySubledgerRepository {
  private entries: InventorySubledgerEntry[] = [];
  private costLayers: CostLayer[] = [];
  private costSnapshots: CostSnapshot[] = [];

  async createEntry(ctx: TenantContext, data: Partial<InventorySubledgerEntry>, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry> {
    const entry: InventorySubledgerEntry = {
      id: uuid(),
      tenant_id: ctx.tenant_id,
      status: 'PENDING',
      isSystemGenerated: data.isSystemGenerated ?? true,
      amount: new Prisma.Decimal(data.amount?.toString() || '0'),
      qty: new Prisma.Decimal(data.qty?.toString() || '0'),
      unitCost: new Prisma.Decimal(data.unitCost?.toString() || '0'),
      currency: data.currency || 'USD',
      skuId: data.skuId!,
      location_id: data.location_id!,
      inventoryTransactionId: data.inventoryTransactionId!,
      sourceEventId: data.sourceEventId!,
      postingRequestId: data.postingRequestId!,
      entryType: data.entryType!,
      accountingPeriodId: data.accountingPeriodId!,
      created_at: new Date(),
      updated_at: new Date(),
    } as InventorySubledgerEntry;
    
    this.entries.push(entry);
    return entry;
  }

  async getEntryById(ctx: TenantContext, id: string, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry> {
    const entry = this.entries.find(e => e.id === id && e.tenant_id === ctx.tenant_id);
    if (!entry) throw new Error(`Entry ${id} not found`);
    return entry;
  }

  async findEntryBySourceEvent(ctx: TenantContext, sourceEventId: string, entryType: string, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry | null> {
    return this.entries.find(e => e.tenant_id === ctx.tenant_id && e.sourceEventId === sourceEventId && e.entryType === entryType) || null;
  }

  async updateEntryStatus(ctx: TenantContext, id: string, status: any, metadata?: any, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry> {
    const entry = await this.getEntryById(ctx, id);
    if (!entry) throw new Error('Entry not found');
    
    if (entry.status === 'POSTED') {
      throw new Error(`CRITICAL AUDIT SHIELD: Entry ${id} is POSTED and IMMUTABLE.`);
    }

    entry.status = status;
    if (metadata) {
      Object.assign(entry, metadata);
    }
    entry.updated_at = new Date();
    return entry;
  }

  async lockEntry(ctx: TenantContext, id: string, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry> {
    return this.updateEntryStatus(ctx, id, 'POSTED', undefined, tx);
  }

  async getCostLayers(ctx: TenantContext, skuId: string, location_id: string, tx?: Prisma.TransactionClient): Promise<CostLayer[]> {
    return this.costLayers.filter(l => l.tenant_id === ctx.tenant_id && l.skuId === skuId && l.location_id === location_id && l.remainingQty.gt(0));
  }

  async createCostLayer(ctx: TenantContext, data: Partial<CostLayer>, tx?: Prisma.TransactionClient): Promise<CostLayer> {
    const layer: CostLayer = {
      id: uuid(),
      tenant_id: ctx.tenant_id,
      skuId: data.skuId!,
      location_id: data.location_id!,
      qty: new Prisma.Decimal(data.qty?.toString() || '0'),
      remainingQty: new Prisma.Decimal(data.remainingQty?.toString() || data.qty?.toString() || '0'),
      unitCost: new Prisma.Decimal(data.unitCost?.toString() || '0'),
      currency: data.currency || 'USD',
      method: data.method || 'FIFO',
      sourceEventId: data.sourceEventId!,
      created_at: new Date(),
    } as CostLayer;
    this.costLayers.push(layer);
    return layer;
  }

  async updateCostLayer(ctx: TenantContext, id: string, data: Partial<CostLayer>, tx?: Prisma.TransactionClient): Promise<CostLayer> {
    const index = this.costLayers.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Layer not found');
    this.costLayers[index] = { ...this.costLayers[index], ...data };
    return this.costLayers[index];
  }

  async createCostSnapshot(ctx: TenantContext, data: Partial<CostSnapshot>, tx?: Prisma.TransactionClient): Promise<CostSnapshot> {
    const snapshot: CostSnapshot = {
      id: uuid(),
      tenant_id: ctx.tenant_id,
      skuId: data.skuId!,
      location_id: data.location_id!,
      totalQty: new Prisma.Decimal(data.totalQty?.toString() || '0'),
      totalValuation: new Prisma.Decimal(data.totalValuation?.toString() || '0'),
      avgUnitCost: new Prisma.Decimal(data.avgUnitCost?.toString() || '0'),
      currency: data.currency || 'USD',
      snapshotDate: data.snapshotDate || new Date(),
    } as CostSnapshot;
    this.costSnapshots.push(snapshot);
    return snapshot;
  }

  async getCurrentValuation(ctx: TenantContext, skuId: string, location_id: string, tx?: Prisma.TransactionClient): Promise<{ unitCost: Prisma.Decimal; currency: string; method: string }> {
    const layers = await this.getCostLayers(ctx, skuId, location_id);
    if (layers.length === 0) return { unitCost: new Prisma.Decimal(0), currency: 'USD', method: 'FIFO' };
    
    let totalQty = new Prisma.Decimal(0);
    let totalVal = new Prisma.Decimal(0);
    
    for (const l of layers) {
      totalQty = totalQty.plus(l.remainingQty || 0);
      totalVal = totalVal.plus((l.remainingQty || 0).mul(l.unitCost || 0));
    }
    
    return {
      unitCost: totalQty.gt(0) ? totalVal.div(totalQty) : new Prisma.Decimal(0),
      currency: layers[0].currency || 'USD',
      method: 'FIFO',
    };
  }

  seedCostLayer(layer: CostLayer) {
    this.costLayers.push(layer);
  }
}
