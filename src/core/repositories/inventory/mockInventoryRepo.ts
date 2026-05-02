import {
  ensureSeed,
  loadFromStorage,
  saveToStorage,
} from "@/core/persistence";
import type { InventoryRepository } from "@/core/repositories/inventory/inventoryRepository";
import type {
  InventoryAdjustmentRequest,
  InventoryAlert,
  InventoryAuditCycle,
  InventoryIntegrationEvent,
  InventoryItemMaster,
  InventoryMovement,
  InventoryStockBalance,
} from "@/core/types/inventory/inventory";

const now = () => new Date().toISOString();

const itemsKey = (tenantId: string) => `inv:${tenantId}:items`;
const balancesKey = (tenantId: string) => `inv:${tenantId}:balances`;
const movementsKey = (tenantId: string) => `inv:${tenantId}:movements`;
const adjustmentsKey = (tenantId: string) => `inv:${tenantId}:adjustments`;
const auditCyclesKey = (tenantId: string) => `inv:${tenantId}:audit-cycles`;
const alertsKey = (tenantId: string) => `inv:${tenantId}:alerts`;
const integrationEventsKey = (tenantId: string) => `inv:${tenantId}:integration-events`;

const seedItems = (tenantId: string): InventoryItemMaster[] => [
  {
    id: `${tenantId}-itm-001`,
    tenantId,
    sku: "RM-STEEL-001",
    name: "Steel Sheet Grade A",
    category: "RAW_MATERIAL",
    uom: "SHEET",
    barcode: "BC-RM-STEEL-001",
    qrCode: "QR-RM-STEEL-001",
    moduleTags: ["MANUFACTURING", "PROCUREMENT"],
    active: true,
    retailPrice: 950000,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: `${tenantId}-itm-002`,
    tenantId,
    sku: "CONS-GLOVE-010",
    name: "Safety Gloves",
    category: "CONSUMABLE",
    uom: "BOX",
    barcode: "BC-CONS-GLOVE-010",
    qrCode: "QR-CONS-GLOVE-010",
    moduleTags: ["HR", "OPERATIONS"],
    active: true,
    retailPrice: 150000,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: `${tenantId}-itm-003`,
    tenantId,
    sku: "FG-PACK-101",
    name: "Packaging Kit",
    category: "FINISHED_GOOD",
    uom: "UNIT",
    barcode: "BC-FG-PACK-101",
    qrCode: "QR-FG-PACK-101",
    moduleTags: ["SALES", "FNB", "RETAIL"],
    active: true,
    retailPrice: 285000,
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedBalances = (tenantId: string): InventoryStockBalance[] => [
  {
    id: `${tenantId}-bal-001`,
    tenantId,
    itemId: `${tenantId}-itm-001`,
    locationCode: "JKT-WH",
    departmentCode: "PRODUCTION",
    quantity: 220,
    reservedQuantity: 40,
    avgUnitCost: 850000,
    currency: "IDR",
    reorderPoint: 120,
    safetyStock: 90,
    updatedAt: now(),
  },
  {
    id: `${tenantId}-bal-002`,
    tenantId,
    itemId: `${tenantId}-itm-002`,
    locationCode: "JKT-HQ",
    departmentCode: "HSE",
    quantity: 35,
    reservedQuantity: 2,
    avgUnitCost: 120000,
    currency: "IDR",
    reorderPoint: 50,
    safetyStock: 30,
    expiryDate: "2026-03-10",
    updatedAt: now(),
  },
  {
    id: `${tenantId}-bal-003`,
    tenantId,
    itemId: `${tenantId}-itm-003`,
    locationCode: "SBY-WH",
    departmentCode: "DISTRIBUTION",
    quantity: 410,
    reservedQuantity: 60,
    avgUnitCost: 220000,
    currency: "IDR",
    reorderPoint: 160,
    safetyStock: 120,
    updatedAt: now(),
  },
];

const seedMovements = (tenantId: string): InventoryMovement[] => [
  {
    id: `${tenantId}-mov-001`,
    tenantId,
    itemId: `${tenantId}-itm-001`,
    type: "INTAKE",
    quantity: 50,
    unitCost: 850000,
    reason: "Supplier receipt",
    destinationLocationCode: "JKT-WH",
    destinationDepartmentCode: "PRODUCTION",
    referenceType: "PO",
    referenceId: "po-2026-001",
    performedBy: "user-demo",
    createdAt: now(),
  },
  {
    id: `${tenantId}-mov-002`,
    tenantId,
    itemId: `${tenantId}-itm-003`,
    type: "DEDUCTION",
    quantity: 20,
    unitCost: 220000,
    reason: "Sales shipment",
    sourceLocationCode: "SBY-WH",
    sourceDepartmentCode: "DISTRIBUTION",
    referenceType: "SALES_ORDER",
    referenceId: "so-4491",
    performedBy: "user-demo",
    createdAt: now(),
  },
];

const seedAdjustments = (tenantId: string): InventoryAdjustmentRequest[] => [
  {
    id: `${tenantId}-adj-001`,
    tenantId,
    itemId: `${tenantId}-itm-002`,
    locationCode: "JKT-HQ",
    departmentCode: "HSE",
    requestedDelta: -3,
    reason: "Damaged boxes after audit",
    status: "PENDING_APPROVAL",
    requestedBy: "user-demo",
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedAuditCycles = (tenantId: string): InventoryAuditCycle[] => [
  {
    id: `${tenantId}-cyc-001`,
    tenantId,
    locationCode: "JKT-WH",
    scope: "LOCATION",
    status: "OPEN",
    openedBy: "user-demo",
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedAlerts = (tenantId: string): InventoryAlert[] => [
  {
    id: `${tenantId}-alert-001`,
    tenantId,
    type: "LOW_STOCK",
    severity: "MEDIUM",
    status: "OPEN",
    entityId: `${tenantId}-bal-002`,
    message: "Safety Gloves below reorder point in JKT-HQ/HSE.",
    createdAt: now(),
    updatedAt: now(),
  },
];

const ensureArray = <T>(key: string, seed: T[]) => ensureSeed<T>(key, seed);

const updateById = <T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<T>,
): { updated: T | null; next: T[] } => {
  let updated: T | null = null;
  const next = (Array.isArray(items) ? items : []).map((item) => {
    if (item.id !== id) return item;
    updated = { ...item, ...patch };
    return updated;
  });
  return { updated, next };
};

export const mockInventoryRepo: InventoryRepository = {
  async listItems(tenantId) {
    return await ensureArray(itemsKey(tenantId), seedItems(tenantId));
  },
  async createItem(tenantId, payload) {
    const items = await this.listItems(tenantId);
    const next = [payload, ...items];
    await saveToStorage(itemsKey(tenantId), next);
    return payload;
  },
  async updateItem(tenantId, id, patch) {
    const items = await this.listItems(tenantId);
    const { updated, next } = updateById(items, id, patch);
    if (updated) await saveToStorage(itemsKey(tenantId), next);
    return updated;
  },
  async deleteItem(tenantId, id) {
    const items = await this.listItems(tenantId);
    const next = (Array.isArray(items) ? items : []).filter(i => i.id !== id);
    if (next.length === items.length) return false;
    await saveToStorage(itemsKey(tenantId), next);
    return true;
  },

  async listBalances(tenantId) {
    return await ensureArray(balancesKey(tenantId), seedBalances(tenantId));
  },
  async createBalance(tenantId, payload) {
    const balances = await this.listBalances(tenantId);
    const next = [payload, ...balances];
    await saveToStorage(balancesKey(tenantId), next);
    return payload;
  },
  async updateBalance(tenantId, id, patch) {
    const balances = await this.listBalances(tenantId);
    const { updated, next } = updateById(balances, id, patch);
    if (updated) await saveToStorage(balancesKey(tenantId), next);
    return updated;
  },

  async listMovements(tenantId) {
    return await ensureArray(movementsKey(tenantId), seedMovements(tenantId));
  },
  async createMovement(tenantId, payload) {
    const movements = await this.listMovements(tenantId);
    const next = [payload, ...movements];
    await saveToStorage(movementsKey(tenantId), next);
    return payload;
  },

  async listAdjustments(tenantId) {
    return await ensureArray(adjustmentsKey(tenantId), seedAdjustments(tenantId));
  },
  async createAdjustment(tenantId, payload) {
    const adjustments = await this.listAdjustments(tenantId);
    const next = [payload, ...adjustments];
    await saveToStorage(adjustmentsKey(tenantId), next);
    return payload;
  },
  async updateAdjustment(tenantId, id, patch) {
    const adjustments = await this.listAdjustments(tenantId);
    const { updated, next } = updateById(adjustments, id, patch);
    if (updated) await saveToStorage(adjustmentsKey(tenantId), next);
    return updated;
  },

  async listAuditCycles(tenantId) {
    return await ensureArray(auditCyclesKey(tenantId), seedAuditCycles(tenantId));
  },
  async createAuditCycle(tenantId, payload) {
    const cycles = await this.listAuditCycles(tenantId);
    const next = [payload, ...cycles];
    await saveToStorage(auditCyclesKey(tenantId), next);
    return payload;
  },
  async updateAuditCycle(tenantId, id, patch) {
    const cycles = await this.listAuditCycles(tenantId);
    const { updated, next } = updateById(cycles, id, patch);
    if (updated) await saveToStorage(auditCyclesKey(tenantId), next);
    return updated;
  },

  async listAlerts(tenantId) {
    return await ensureArray(alertsKey(tenantId), seedAlerts(tenantId));
  },
  async createAlert(tenantId, payload) {
    const alerts = await this.listAlerts(tenantId);
    const next = [payload, ...alerts];
    await saveToStorage(alertsKey(tenantId), next);
    return payload;
  },
  async updateAlert(tenantId, id, patch) {
    const alerts = await this.listAlerts(tenantId);
    const { updated, next } = updateById(alerts, id, patch);
    if (updated) await saveToStorage(alertsKey(tenantId), next);
    return updated;
  },

  async listIntegrationEvents(tenantId) {
    return await loadFromStorage<InventoryIntegrationEvent[]>(integrationEventsKey(tenantId), []);
  },
  async createIntegrationEvent(tenantId, payload) {
    const events = await this.listIntegrationEvents(tenantId);
    const next = [payload, ...events];
    await saveToStorage(integrationEventsKey(tenantId), next);
    return payload;
  },
  async updateIntegrationEvent(tenantId, id, patch) {
    const events = await this.listIntegrationEvents(tenantId);
    const { updated, next } = updateById(events, id, patch);
    if (updated) await saveToStorage(integrationEventsKey(tenantId), next);
    return updated;
  },
};
