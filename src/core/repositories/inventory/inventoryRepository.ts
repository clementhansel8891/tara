import type {
  InventoryAdjustmentRequest,
  InventoryAlert,
  InventoryAuditCycle,
  InventoryIntegrationEvent,
  InventoryItemMaster,
  InventoryMovement,
  InventoryStockBalance,
} from "@/core/types/inventory/inventory";

export interface InventoryRepository {
  listItems: (tenantId: string) => Promise<InventoryItemMaster[]>;
  createItem: (tenantId: string, payload: InventoryItemMaster) => Promise<InventoryItemMaster>;
  updateItem: (
    tenantId: string,
    id: string,
    patch: Partial<InventoryItemMaster>,
  ) => Promise<InventoryItemMaster | null>;
  deleteItem: (tenantId: string, id: string) => Promise<boolean>;

  listBalances: (tenantId: string) => Promise<InventoryStockBalance[]>;
  createBalance: (tenantId: string, payload: InventoryStockBalance) => Promise<InventoryStockBalance>;
  updateBalance: (
    tenantId: string,
    id: string,
    patch: Partial<InventoryStockBalance>,
  ) => Promise<InventoryStockBalance | null>;

  listMovements: (tenantId: string) => Promise<InventoryMovement[]>;
  createMovement: (tenantId: string, payload: InventoryMovement) => Promise<InventoryMovement>;

  listAdjustments: (tenantId: string) => Promise<InventoryAdjustmentRequest[]>;
  createAdjustment: (
    tenantId: string,
    payload: InventoryAdjustmentRequest,
  ) => Promise<InventoryAdjustmentRequest>;
  updateAdjustment: (
    tenantId: string,
    id: string,
    patch: Partial<InventoryAdjustmentRequest>,
  ) => Promise<InventoryAdjustmentRequest | null>;

  listAuditCycles: (tenantId: string) => Promise<InventoryAuditCycle[]>;
  createAuditCycle: (tenantId: string, payload: InventoryAuditCycle) => Promise<InventoryAuditCycle>;
  updateAuditCycle: (
    tenantId: string,
    id: string,
    patch: Partial<InventoryAuditCycle>,
  ) => Promise<InventoryAuditCycle | null>;

  listAlerts: (tenantId: string) => Promise<InventoryAlert[]>;
  createAlert: (tenantId: string, payload: InventoryAlert) => Promise<InventoryAlert>;
  updateAlert: (
    tenantId: string,
    id: string,
    patch: Partial<InventoryAlert>,
  ) => Promise<InventoryAlert | null>;

  listIntegrationEvents: (tenantId: string) => Promise<InventoryIntegrationEvent[]>;
  createIntegrationEvent: (
    tenantId: string,
    payload: InventoryIntegrationEvent,
  ) => Promise<InventoryIntegrationEvent>;
  updateIntegrationEvent: (
    tenantId: string,
    id: string,
    patch: Partial<InventoryIntegrationEvent>,
  ) => Promise<InventoryIntegrationEvent | null>;
}

