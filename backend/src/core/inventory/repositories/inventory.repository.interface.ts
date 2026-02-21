import { CreateAdjustmentDto } from '../dto/create-adjustment.dto';
import { CreateItemDto } from '../dto/create-item.dto';
import { StockIntakeDto } from '../dto/stock-intake.dto';
import { TransferStockDto } from '../dto/transfer-stock.dto';
import { InventoryAlert } from '../entities/inventory-alert.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { StockAdjustment } from '../entities/stock-adjustment.entity';
import { StockBalance } from '../entities/stock-balance.entity';
import { StockMovement } from '../entities/stock-movement.entity';

export {
  CreateAdjustmentDto,
  CreateItemDto,
  StockIntakeDto,
  TransferStockDto,
  InventoryAlert,
  InventoryItem,
  StockAdjustment,
  StockBalance,
  StockMovement,
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
  abstract getDashboard(tenantId: string): Promise<InventoryDashboard>;
  abstract getItems(tenantId: string): Promise<InventoryItem[]>;
  abstract createItem(tenantId: string, data: CreateItemDto): Promise<InventoryItem>;
  abstract getBalances(tenantId: string, locationId?: string, departmentId?: string): Promise<StockBalance[]>;
  abstract getMovements(tenantId: string, itemId?: string): Promise<StockMovement[]>;
  abstract intakeStock(tenantId: string, data: StockIntakeDto): Promise<StockMovement>;
  abstract transferStock(tenantId: string, data: TransferStockDto): Promise<StockMovement[]>;
  abstract getAdjustments(tenantId: string): Promise<StockAdjustment[]>;
  abstract createAdjustment(tenantId: string, data: CreateAdjustmentDto): Promise<StockAdjustment>;
  abstract approveAdjustment(
    tenantId: string,
    adjustmentId: string,
    approvedBy: string,
  ): Promise<StockAdjustment>;
  abstract getAlerts(tenantId: string): Promise<InventoryAlert[]>;
  abstract setAlertStatus(
    tenantId: string,
    alertId: string,
    status: InventoryAlert['status'],
  ): Promise<InventoryAlert>;
  abstract getAuditCycles(tenantId: string): Promise<any[]>;
  abstract createAuditCycle(tenantId: string, data: any): Promise<any>;
  abstract updateAuditCycle(tenantId: string, id: string, data: any): Promise<any>;
  abstract getIntegrationEvents(tenantId: string): Promise<any[]>;
  abstract createIntegrationEvent(tenantId: string, data: any): Promise<any>;
  abstract consumeStock(tenantId: string, data: any): Promise<any>;
  abstract deleteItem(tenantId: string, itemId: string): Promise<void>;
  abstract batchDeleteItems(tenantId: string, itemIds: string[]): Promise<void>;
  abstract batchIntakeStock(tenantId: string, data: StockIntakeDto[]): Promise<StockMovement[]>;
  abstract batchCreateItems(tenantId: string, data: CreateItemDto[]): Promise<InventoryItem[]>;
  abstract requestProcurement(tenantId: string, data: any): Promise<any>;
}

