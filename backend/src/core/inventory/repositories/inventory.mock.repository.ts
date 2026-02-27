import { Injectable } from "@nestjs/common";
import {
  IInventoryRepository,
  InventoryItem,
  StockBalance,
  StockMovement,
  StockAdjustment,
  InventoryAlert,
  InventoryDashboard,
  CreateItemDto,
  StockIntakeDto,
  TransferStockDto,
  CreateAdjustmentDto,
} from "./inventory.repository.interface";

@Injectable()
export class InventoryMockRepository implements IInventoryRepository {
  private items: InventoryItem[] = [];
  private balances: StockBalance[] = [];
  private movements: StockMovement[] = [];
  private adjustments: StockAdjustment[] = [];
  private alerts: InventoryAlert[] = [];

  async getDashboard(tenant_id: string): Promise<InventoryDashboard> {
    return {
      totalItems: this.items.filter((i) => i.tenant_id === tenant_id).length,
      totalLocations: 2,
      totalDepartments: 3,
      totalOnHandQty: 1500,
      totalValuation: 250000,
      lowStockCount: 5,
      expiryWarningCount: 2,
      pendingAdjustments: 1,
      pendingReceiptSyncs: 0,
    };
  }

  async getItems(tenant_id: string): Promise<InventoryItem[]> {
    return this.items.filter((item) => item.tenant_id === tenant_id);
  }

  async createItem(
    tenant_id: string,
    data: CreateItemDto,
  ): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      tenant_id: tenant_id,
      sku: data.sku,
      name: data.name,
      category: data.category as any,
      uom: data.uom,
      moduleTags: data.moduleTags || [],
    } as any;
    this.items.push(newItem);
    return newItem;
  }

  async getBalances(
    tenant_id: string,
    locationId?: string,
    departmentId?: string,
  ): Promise<StockBalance[]> {
    return this.balances.filter(
      (b) =>
        b.tenant_id === tenant_id &&
        (!locationId || b.locationId === locationId) &&
        (!departmentId || b.departmentId === departmentId),
    );
  }

  async getMovements(
    tenant_id: string,
    itemId?: string,
  ): Promise<StockMovement[]> {
    return this.movements.filter(
      (m) => m.tenant_id === tenant_id && (!itemId || m.itemId === itemId),
    );
  }

  async intakeStock(
    tenant_id: string,
    data: StockIntakeDto,
  ): Promise<StockMovement> {
    const movement: StockMovement = {
      id: Math.random().toString(36).substr(2, 9),
      tenant_id: tenant_id,
      itemId: data.itemId,
      locationId: data.locationId as any,
      type: "IN" as any,
      quantity: data.quantity,
      reference: (data as any).reference || (data as any).referenceId,
      createdAt: new Date(),
    } as any;
    this.movements.push(movement);
    return movement;
  }

  async transferStock(
    tenant_id: string,
    data: TransferStockDto,
  ): Promise<StockMovement[]> {
    return [];
  }

  async getAdjustments(tenant_id: string): Promise<StockAdjustment[]> {
    return this.adjustments.filter((a) => a.tenant_id === tenant_id);
  }

  async createAdjustment(
    tenant_id: string,
    data: CreateAdjustmentDto,
  ): Promise<StockAdjustment> {
    return {} as any;
  }

  async approveAdjustment(
    tenant_id: string,
    adjustmentId: string,
    approvedBy: string,
  ): Promise<StockAdjustment> {
    return {} as any;
  }

  async getAlerts(tenant_id: string): Promise<InventoryAlert[]> {
    return this.alerts.filter((a) => a.tenant_id === tenant_id);
  }

  async setAlertStatus(
    tenant_id: string,
    alertId: string,
    status: InventoryAlert["status"],
  ): Promise<InventoryAlert> {
    return {} as any;
  }

  async getAuditCycles(tenant_id: string): Promise<any[]> {
    return [];
  }
  async createAuditCycle(tenant_id: string, data: any): Promise<any> {
    return {};
  }
  async updateAuditCycle(
    tenant_id: string,
    id: string,
    data: any,
  ): Promise<any> {
    return {};
  }
  async getIntegrationEvents(tenant_id: string): Promise<any[]> {
    return [];
  }
  async createIntegrationEvent(tenant_id: string, data: any): Promise<any> {
    return {};
  }
  async consumeStock(tenant_id: string, data: any): Promise<any> {
    return {};
  }
  async deleteItem(tenant_id: string, itemId: string): Promise<void> {}
  async batchDeleteItems(tenant_id: string, itemIds: string[]): Promise<void> {}
  async batchIntakeStock(
    tenant_id: string,
    data: StockIntakeDto[],
  ): Promise<StockMovement[]> {
    return [];
  }
  async batchCreateItems(
    tenant_id: string,
    data: CreateItemDto[],
  ): Promise<InventoryItem[]> {
    return [];
  }
  async requestProcurement(tenant_id: string, data: any): Promise<any> {
    return {};
  }
}
