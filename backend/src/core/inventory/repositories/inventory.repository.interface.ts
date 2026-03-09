import { CreateAdjustmentDto } from "../dto/create-adjustment.dto";
import { CreateItemDto } from "../dto/create-item.dto";
import { StockIntakeDto } from "../dto/stock-intake.dto";
import { TransferStockDto } from "../dto/transfer-stock.dto";
import { CreateMovementRequestDto } from "../dto/create-movement-request.dto";
import { InventoryAlert } from "../entities/inventory-alert.entity";
import { InventoryItem } from "../entities/inventory-item.entity";
import { StockAdjustment } from "../entities/stock-adjustment.entity";
import { StockBalance } from "../entities/stock-balance.entity";
import { StockMovement } from "../entities/stock-movement.entity";
import { MovementRequest } from "../entities/movement-request.entity";

export {
  CreateAdjustmentDto,
  CreateItemDto,
  StockIntakeDto,
  TransferStockDto,
  CreateMovementRequestDto,
  InventoryAlert,
  InventoryItem,
  StockAdjustment,
  StockBalance,
  StockMovement,
  MovementRequest,
};

export type InventoryDashboard = {
  totalItems: number;
  totalLocations: number;
  totalDepartments: number;
  totalOnHandQty: number;
  totalValuation: number;
  lowStockCount: number;
  expiryWarningCount: number;
  pendingAdjustments: number;
  pendingReceiptSyncs: number;
};

export abstract class IInventoryRepository {
  abstract getDashboard(tenant_id: string): Promise<InventoryDashboard>;
  abstract getItems(tenant_id: string): Promise<InventoryItem[]>;
  abstract createItem(
    tenant_id: string,
    data: CreateItemDto,
  ): Promise<InventoryItem>;
  abstract getBalances(
    tenant_id: string,
    locationId?: string,
    departmentId?: string,
  ): Promise<StockBalance[]>;
  abstract getMovements(
    tenant_id: string,
    itemId?: string,
  ): Promise<StockMovement[]>;
  abstract intakeStock(
    tenant_id: string,
    data: StockIntakeDto,
  ): Promise<StockMovement>;
  abstract transferStock(
    tenant_id: string,
    data: TransferStockDto,
  ): Promise<StockMovement[]>;
  abstract getAdjustments(tenant_id: string): Promise<StockAdjustment[]>;
  abstract createAdjustment(
    tenant_id: string,
    data: CreateAdjustmentDto,
  ): Promise<StockAdjustment>;
  abstract approveAdjustment(
    tenant_id: string,
    adjustmentId: string,
    approvedBy: string,
  ): Promise<StockAdjustment>;
  abstract getAlerts(tenant_id: string): Promise<InventoryAlert[]>;
  abstract setAlertStatus(
    tenant_id: string,
    alertId: string,
    status: InventoryAlert["status"],
  ): Promise<InventoryAlert>;
  abstract getAuditCycles(tenant_id: string): Promise<any[]>;
  abstract createAuditCycle(tenant_id: string, data: any): Promise<any>;
  abstract updateAuditCycle(
    tenant_id: string,
    id: string,
    data: any,
  ): Promise<any>;
  abstract getIntegrationEvents(tenant_id: string): Promise<any[]>;
  abstract createIntegrationEvent(tenant_id: string, data: any): Promise<any>;
  abstract consumeStock(tenant_id: string, data: any): Promise<any>;
  abstract deleteItem(tenant_id: string, itemId: string): Promise<void>;
  abstract batchDeleteItems(
    tenant_id: string,
    itemIds: string[],
  ): Promise<void>;
  abstract batchIntakeStock(
    tenant_id: string,
    data: StockIntakeDto[],
  ): Promise<StockMovement[]>;
  abstract batchCreateItems(
    tenant_id: string,
    data: CreateItemDto[],
  ): Promise<InventoryItem[]>;
  abstract itemExistsBySku(tenant_id: string, sku: string): Promise<boolean>;
  abstract requestProcurement(tenant_id: string, data: any): Promise<any>;
  abstract createMovementRequest(
    tenant_id: string,
    data: CreateMovementRequestDto,
  ): Promise<MovementRequest>;
  abstract getNextSequence(
    tenant_id: string,
    category: string,
  ): Promise<number>;
  abstract updateItemStatus(
    tenant_id: string,
    itemId: string,
    status: string,
  ): Promise<InventoryItem>;
  abstract getPendingItems(tenant_id: string): Promise<InventoryItem[]>;
  abstract findHighestSkuByCategory(
    tenant_id: string,
    category: string,
  ): Promise<string | null>;
}
