import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../persistence/prisma.service';
import { IInventorySubledgerRepository } from './interfaces/inventory-subledger.repository.interface';
import { InventorySubledgerEntry } from '../entities/inventory-subledger-entry.entity';
import { CostLayer } from '../entities/cost-layer.entity';
import { CostSnapshot } from '../entities/cost-snapshot.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventorySubledgerDbRepository implements IInventorySubledgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(dbEntry: any): InventorySubledgerEntry {
    const metadata = (dbEntry.metadata as any) || {};
    return {
      id: dbEntry.id,
      tenantId: dbEntry.tenantId,
      sourceEventId: dbEntry.sourceEventId,
      entryType: dbEntry.entryType as any,
      status: dbEntry.status as any,
      isSystemGenerated: dbEntry.isSystemGenerated,
      postedAt: dbEntry.postedAt,
      createdAt: dbEntry.createdAt,
      updatedAt: dbEntry.updatedAt,
      reversedEntryId: dbEntry.reversedEntryId,
      ...metadata,
    };
  }

  private mapToCostLayer(dbLayer: any): CostLayer {
    return {
      id: dbLayer.id,
      tenantId: dbLayer.tenantId,
      skuId: dbLayer.skuId,
      locationId: dbLayer.locationId,
      qty: new Prisma.Decimal(dbLayer.qty.toString()),
      remainingQty: new Prisma.Decimal(dbLayer.remainingQty.toString()),
      unitCost: new Prisma.Decimal(dbLayer.unitCost.toString()),
      currency: dbLayer.currency,
      method: dbLayer.method as any,
      sourceEventId: dbLayer.sourceEventId,
      createdAt: dbLayer.createdAt,
    };
  }

  async createEntry(tenant_id: string, data: Partial<InventorySubledgerEntry>, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry> {
    const db = tx ?? this.prisma;
    const { id, tenantId, sourceEventId, entryType, status, isSystemGenerated, postedAt, createdAt, updatedAt, reversedEntryId, ...metadata } = data;
    
    const dbEntry = await db.inventorySubledgerEntry.create({
      data: {
        tenantId: tenant_id,
        sourceEventId: sourceEventId!,
        entryType: entryType!,
        status: status || 'PENDING',
        isSystemGenerated: isSystemGenerated ?? true,
        reversedEntryId: reversedEntryId,
        metadata: metadata as any,
      },
    });

    return this.mapToEntity(dbEntry);
  }

  async getEntryById(tenant_id: string, id: string, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry> {
    const db = tx ?? this.prisma;
    const dbEntry = await db.inventorySubledgerEntry.findFirst({
      where: { id, tenantId: tenant_id },
    });
    if (!dbEntry) throw new Error(`Subledger Entry ${id} not found`);
    return this.mapToEntity(dbEntry);
  }

  async findEntryBySourceEvent(tenant_id: string, sourceEventId: string, entryType: string, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry | null> {
    const db = tx ?? this.prisma;
    const dbEntry = await db.inventorySubledgerEntry.findFirst({
      where: { tenantId: tenant_id, sourceEventId, entryType },
    });
    return dbEntry ? this.mapToEntity(dbEntry) : null;
  }

  async updateEntryStatus(tenant_id: string, id: string, status: string, additionalMetadata?: any, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry> {
    const db = tx ?? this.prisma;
    const existing = await db.inventorySubledgerEntry.findUnique({ where: { id } });
    const currentMetadata = (existing?.metadata as any) || {};
    
    const dbEntry = await db.inventorySubledgerEntry.update({
      where: { id },
      data: {
        status,
        postedAt: status === 'POSTED' ? new Date() : undefined,
        metadata: { ...currentMetadata, ...additionalMetadata },
      },
    });
    return this.mapToEntity(dbEntry);
  }

  async lockEntry(tenant_id: string, id: string, tx?: Prisma.TransactionClient): Promise<InventorySubledgerEntry> {
    return this.updateEntryStatus(tenant_id, id, 'POSTED', undefined, tx);
  }

  async getCostLayers(tenant_id: string, skuId: string, locationId: string, tx?: Prisma.TransactionClient): Promise<CostLayer[]> {
    const db = tx ?? this.prisma;
    const dbLayers = await db.costLayer.findMany({
      where: {
        tenantId: tenant_id,
        skuId,
        locationId,
        remainingQty: { gt: 0 },
      },
      orderBy: { createdAt: 'asc' }, // FIFO default
    });
    return dbLayers.map((l: any) => this.mapToCostLayer(l));
  }

  async createCostLayer(tenant_id: string, data: Partial<CostLayer>, tx?: Prisma.TransactionClient): Promise<CostLayer> {
    const db = tx ?? this.prisma;
    const dbLayer = await db.costLayer.create({
      data: {
        tenantId: tenant_id,
        skuId: data.skuId!,
        locationId: data.locationId!,
        qty: data.qty!,
        remainingQty: data.remainingQty ?? data.qty!,
        unitCost: new Prisma.Decimal(data.unitCost!),
        currency: data.currency || 'USD',
        method: data.method || 'FIFO',
        sourceEventId: data.sourceEventId!,
      },
    });
    return this.mapToCostLayer(dbLayer);
  }

  async updateCostLayer(tenant_id: string, id: string, data: Partial<CostLayer>, tx?: Prisma.TransactionClient): Promise<CostLayer> {
    const db = tx ?? this.prisma;
    const dbLayer = await db.costLayer.update({
      where: { id },
      data: {
        remainingQty: data.remainingQty,
      },
    });
    return this.mapToCostLayer(dbLayer);
  }

  async createCostSnapshot(tenant_id: string, data: Partial<CostSnapshot>, tx?: Prisma.TransactionClient): Promise<CostSnapshot> {
    const db = tx ?? this.prisma;
    const dbSnapshot = await db.costSnapshot.create({
      data: {
        tenantId: tenant_id,
        skuId: data.skuId!,
        locationId: data.locationId!,
        totalQty: data.totalQty!,
        totalValuation: new Prisma.Decimal(data.totalValuation!),
        avgUnitCost: new Prisma.Decimal(data.avgUnitCost!),
        currency: data.currency || 'USD',
      },
    });

    return {
      id: dbSnapshot.id,
      tenantId: dbSnapshot.tenantId,
      skuId: dbSnapshot.skuId,
      locationId: dbSnapshot.locationId,
      totalQty: new Prisma.Decimal(dbSnapshot.totalQty.toString()),
      totalValuation: new Prisma.Decimal(dbSnapshot.totalValuation.toString()),
      avgUnitCost: new Prisma.Decimal(dbSnapshot.avgUnitCost.toString()),
      currency: dbSnapshot.currency,
      snapshotDate: dbSnapshot.snapshotDate,
    };
  }

  async getCurrentValuation(tenant_id: string, skuId: string, locationId: string, tx?: Prisma.TransactionClient): Promise<{ unitCost: Prisma.Decimal; currency: string; method: string }> {
    const layers = await this.getCostLayers(tenant_id, skuId, locationId, tx);
    if (layers.length === 0) return { unitCost: new Prisma.Decimal(0), currency: 'USD', method: 'FIFO' };
    
    let totalQty = new Prisma.Decimal(0);
    let totalVal = new Prisma.Decimal(0);
    
    for (const l of layers) {
      totalQty = totalQty.plus(l.remainingQty);
      totalVal = totalVal.plus(l.remainingQty.mul(l.unitCost));
    }
    
    return {
      unitCost: totalQty.gt(0) ? totalVal.div(totalQty) : new Prisma.Decimal(0),
      currency: layers[0].currency,
      method: 'FIFO',
    };
  }
}
