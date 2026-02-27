import { Injectable } from "@nestjs/common";
import { CreateAdjustmentDto } from "./dto/create-adjustment.dto";
import { CreateItemDto } from "./dto/create-item.dto";
import { StockIntakeDto } from "./dto/stock-intake.dto";
import { TransferStockDto } from "./dto/transfer-stock.dto";
import { IInventoryRepository } from "./repositories/inventory.repository.interface";
import { AuditService } from "../../shared/audit/audit.service";

@Injectable()
export class InventoryService {
  constructor(
    private readonly repository: IInventoryRepository,
    private readonly auditService: AuditService,
  ) {}

  async getDashboard(tenant_id: string) {
    return this.repository.getDashboard(tenant_id);
  }

  async getItems(tenant_id: string) {
    return this.repository.getItems(tenant_id);
  }

  async createItem(tenant_id: string, data: CreateItemDto, userId?: string) {
    const item = await this.repository.createItem(tenant_id, data);
    if (userId) {
      await this.auditService.log({
        tenantId: tenant_id,
        userId,
        module: "inventory",
        action: "CREATE",
        entityType: "ITEM",
        entityId: item.id,
        metadata: { name: data.name, sku: data.sku },
      });
    }
    return item;
  }

  async getBalances(
    tenant_id: string,
    locationId?: string,
    departmentId?: string,
  ) {
    return this.repository.getBalances(tenant_id, locationId, departmentId);
  }

  async getMovements(tenant_id: string, itemId?: string) {
    return this.repository.getMovements(tenant_id, itemId);
  }

  async intakeStock(tenant_id: string, data: StockIntakeDto, userId?: string) {
    const result = await this.repository.intakeStock(tenant_id, data);
    if (userId) {
      await this.auditService.log({
        tenantId: tenant_id,
        userId,
        module: "inventory",
        action: "INTAKE",
        entityType: "STOCK",
        entityId: data.itemId,
        metadata: { quantity: data.quantity, locationId: data.locationId },
      });
    }
    return result;
  }

  async transferStock(
    tenant_id: string,
    data: TransferStockDto,
    userId?: string,
  ) {
    const result = await this.repository.transferStock(tenant_id, data);
    if (userId) {
      await this.auditService.log({
        tenantId: tenant_id,
        userId,
        module: "inventory",
        action: "TRANSFER",
        entityType: "STOCK",
        entityId: data.itemId,
        metadata: {
          quantity: data.quantity,
          fromLocation: data.fromLocationId,
          toLocation: data.toLocationId,
        },
      });
    }
    return result;
  }

  async getAdjustments(tenant_id: string) {
    return this.repository.getAdjustments(tenant_id);
  }

  async createAdjustment(
    tenant_id: string,
    data: CreateAdjustmentDto,
    userId?: string,
  ) {
    const adjustment = await this.repository.createAdjustment(tenant_id, data);
    if (userId) {
      await this.auditService.log({
        tenantId: tenant_id,
        userId,
        module: "inventory",
        action: "ADJUST_CREATE",
        entityType: "ADJUSTMENT",
        entityId: (adjustment as any).id,
        metadata: {
          itemId: data.itemId,
          delta: data.requestedDelta,
          reason: data.reason,
        },
      });
    }
    return adjustment;
  }

  async approveAdjustment(
    tenant_id: string,
    adjustmentId: string,
    approvedBy: string,
  ) {
    return this.repository.approveAdjustment(
      tenant_id,
      adjustmentId,
      approvedBy,
    );
  }

  async getAlerts(tenant_id: string) {
    return this.repository.getAlerts(tenant_id);
  }

  async setAlertStatus(
    tenant_id: string,
    alertId: string,
    status: "open" | "acknowledged" | "resolved",
  ) {
    return this.repository.setAlertStatus(tenant_id, alertId, status);
  }

  async getAuditCycles(tenant_id: string) {
    return this.repository.getAuditCycles(tenant_id);
  }

  async createAuditCycle(tenant_id: string, data: any) {
    return this.repository.createAuditCycle(tenant_id, data);
  }

  async updateAuditCycle(tenant_id: string, id: string, data: any) {
    return this.repository.updateAuditCycle(tenant_id, id, data);
  }

  async getIntegrationEvents(tenant_id: string) {
    return this.repository.getIntegrationEvents(tenant_id);
  }

  async createIntegrationEvent(tenant_id: string, data: any) {
    return this.repository.createIntegrationEvent(tenant_id, data);
  }

  async runLowStockScan(tenant_id: string) {
    const balances = await this.repository.getBalances(tenant_id);
    // Placeholder logic: just return scanned count for now as per mock requirement speed
    return {
      scanned: balances.length,
      lowStockFound: balances.filter((b) => b.quantity <= 50).length,
    };
  }

  async runExpiryScan(tenant_id: string) {
    return { scanned: 0, expiryFound: 0 };
  }

  async consumeStock(tenant_id: string, data: any) {
    return this.repository.consumeStock(tenant_id, data);
  }

  async deleteItem(tenant_id: string, itemId: string, userId?: string) {
    const result = await this.repository.deleteItem(tenant_id, itemId);
    if (userId) {
      await this.auditService.log({
        tenantId: tenant_id,
        userId,
        module: "inventory",
        action: "DELETE",
        entityType: "ITEM",
        entityId: itemId,
      });
    }
    return result;
  }

  async batchDeleteItems(
    tenant_id: string,
    itemIds: string[],
    userId?: string,
  ) {
    const result = await this.repository.batchDeleteItems(tenant_id, itemIds);
    if (userId) {
      await this.auditService.log({
        tenantId: tenant_id,
        userId,
        module: "inventory",
        action: "BATCH_DELETE",
        entityType: "ITEM",
        entityId: "batch",
        metadata: { count: itemIds.length },
      });
    }
    return result;
  }

  async batchIntakeStock(
    tenant_id: string,
    data: StockIntakeDto[],
    userId?: string,
  ) {
    const result = await this.repository.batchIntakeStock(tenant_id, data);
    if (userId) {
      await this.auditService.log({
        tenantId: tenant_id,
        userId,
        module: "inventory",
        action: "BATCH_INTAKE",
        entityType: "STOCK",
        entityId: "batch",
        metadata: { count: data.length },
      });
    }
    return result;
  }

  async requestProcurement(tenant_id: string, data: any) {
    return this.repository.requestProcurement(tenant_id, data);
  }

  async batchCreateItems(
    tenant_id: string,
    data: CreateItemDto[],
    userId?: string,
  ) {
    const items = await this.repository.batchCreateItems(tenant_id, data);
    if (userId) {
      await this.auditService.log({
        tenantId: tenant_id,
        userId,
        module: "inventory",
        action: "BATCH_CREATE",
        entityType: "ITEM",
        entityId: "batch",
        metadata: { count: data.length },
      });
    }
    return items;
  }
}
