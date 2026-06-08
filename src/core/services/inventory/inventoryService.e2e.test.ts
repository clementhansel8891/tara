
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Roles } from "@/core/security/roles";
import type { SessionContext } from "@/core/security/session";
import { inventoryService } from "./inventoryService";

// ─── Mock the HTTP layer ──────────────────────────────────────────────────────
vi.mock("@/core/api/apiClient", () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public message: string, public status: number, public data: any = null) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

import { apiRequest } from "@/core/api/apiClient";
import { ApiError } from "@/core/api/apiClient";

// ─── Session (snake_case per SessionContext) ──────────────────────────────────
const tenantId = "tenant-inventory-e2e";
const session: SessionContext = {
  user_id: "inventory-admin",
  tenant_id: tenantId,
  role: Roles.SUPERADMIN,
  department_id: "INVENTORY",
  location_id: "LOC-JKT",
  permissions: [],
};

const mockOnce = (value: unknown) => (apiRequest as any).mockResolvedValueOnce(value);
const mockRejected = (message: string, status = 400) =>
  (apiRequest as any).mockRejectedValueOnce(new ApiError(message, status));

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("inventoryService end-to-end flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supports intake, transfer, deduction, and dashboard metrics", async () => {
    const item = { id: "item-001", sku: "SKU-001", name: "Cardboard Box", status: "ACTIVE" };

    // listItems
    mockOnce([item]);
    const [firstItem] = await inventoryService.listItems(tenantId, session);
    expect(firstItem).toBeDefined();
    expect(firstItem.id).toBe("item-001");

    // recordIntake
    mockOnce({ id: "mv-001", type: "INTAKE", quantity: 30 });
    await inventoryService.recordIntake(tenantId, session, {
      item_id: firstItem.id,
      location_id: "LOC-JKT",
      department_id: "PRODUCTION",
      quantity: 30,
      unit_cost: 120_000,
      reason: "Test intake",
    });
    expect(apiRequest).toHaveBeenCalledWith(
      "/v1/inventory/intake",
      "POST",
      session,
      expect.objectContaining({ item_id: firstItem.id, quantity: 30 }),
    );

    // recordTransfer
    mockOnce({ id: "mv-002", type: "TRANSFER", quantity: 10 });
    await inventoryService.recordTransfer(tenantId, session, {
      item_id: firstItem.id,
      from_location_id: "LOC-JKT",
      to_location_id: "LOC-SBY",
      quantity: 10,
      reason: "Inter-location balancing",
    });

    // recordDeduction
    mockOnce({ id: "mv-003", type: "DEDUCTION", quantity: 5 });
    await inventoryService.recordDeduction(tenantId, session, {
      item_id: firstItem.id,
      location_id: "LOC-SBY",
      quantity: 5,
      reason: "Outbound fulfillment",
    });

    // getDashboard
    const mockDashboard = {
      totalItems: 1,
      totalOnHandQty: 25,
      totalValuation: 3_000_000,
      lowStockCount: 0,
      pendingAdjustments: 0,
    };
    mockOnce(mockDashboard);
    const dashboard = await inventoryService.getDashboard(tenantId, session);
    expect(dashboard.totalItems).toBeGreaterThan(0);
    expect(dashboard.totalOnHandQty).toBeGreaterThan(0);
    expect(dashboard.totalValuation).toBeGreaterThan(0);
  });

  it("handles adjustment approval with alert scans", async () => {
    const item = { id: "item-002", sku: "SKU-002", name: "Packing Material" };
    const adjustmentId = "adj-001";

    // listItems
    mockOnce([item]);
    const [firstItem] = await inventoryService.listItems(tenantId, session);

    // requestAdjustment
    mockOnce({ id: adjustmentId, item_id: firstItem.id, status: "PENDING_APPROVAL", requested_delta: -25 });
    const adjustment = await inventoryService.requestAdjustment(tenantId, session, {
      item_id: firstItem.id,
      location_id: "LOC-JKT",
      department_id: "PRODUCTION",
      requested_delta: -25,
      reason: "High variance correction",
    });
    expect(adjustment.status).toBe("PENDING_APPROVAL");

    // approveAdjustment
    mockOnce({ id: adjustmentId, status: "APPROVED", approved_by: session.user_id });
    const approved = await inventoryService.approveAdjustment(tenantId, session, adjustment.id);
    expect(approved.status).toBe("APPROVED");

    // runLowStockScan
    mockOnce({ scanned: 1, alerts: 1 });
    await inventoryService.runLowStockScan(tenantId, session);

    // runExpiryScan
    mockOnce({ scanned: 1, expiring: 0 });
    await inventoryService.runExpiryScan(tenantId, session);

    // listAlerts
    mockOnce([{ id: "alert-001", type: "LOW_STOCK", item_id: firstItem.id, status: "OPEN" }]);
    const alerts = await inventoryService.listAlerts(tenantId, session);
    expect(alerts.length).toBeGreaterThan(0);
  });

  it("lists procurement receipt queue and integration events", async () => {
    // listProcurementReceiptQueue
    mockOnce([
      { id: "receipt-001", final_po_id: "po-e2e-001", status: "PENDING" },
    ]);
    const queue = await inventoryService.listProcurementReceiptQueue(tenantId, session);
    expect(queue.length).toBeGreaterThan(0);

    // processProcurementReceipt
    mockOnce({ id: "receipt-001", status: "PROCESSED" });
    const result = await inventoryService.processProcurementReceipt(tenantId, session, {
      final_po_id: "po-e2e-001",
      location_id: "LOC-JKT",
      items: [{ sku: "SKU-001", quantity: 12, unit_cost: 95_000 }],
    });
    expect(result.status).toBe("PROCESSED");

    // listIntegrationEvents
    mockOnce([
      { id: "evt-001", eventType: "PROCUREMENT_RECEIPT_SYNCED" },
      { id: "evt-002", eventType: "PROCUREMENT_RECEIPT_MISMATCH" },
    ]);
    const events = await inventoryService.listIntegrationEvents(tenantId, session);
    expect(events.some((e) => e.eventType === "PROCUREMENT_RECEIPT_SYNCED")).toBe(true);
    expect(events.some((e) => e.eventType === "PROCUREMENT_RECEIPT_MISMATCH")).toBe(true);
  });

  it("supports warehouse bin operations", async () => {
    // getWarehouseBins
    mockOnce([{ id: "bin-001", code: "A1-01", zone: "A", capacity: 100 }]);
    const bins = await inventoryService.getWarehouseBins(tenantId, session, "LOC-JKT");
    expect(bins.length).toBeGreaterThan(0);

    // createWarehouseBin
    mockOnce({ id: "bin-new", code: "B2-01", zone: "B", capacity: 50 });
    const newBin = await inventoryService.createWarehouseBin(tenantId, session, {
      location_id: "LOC-JKT",
      code: "B2-01",
      zone: "B",
      capacity: 50,
    });
    expect(newBin.id).toBe("bin-new");

    // assignStockToBin
    mockOnce({ id: "assign-001", bin_id: "bin-001", product_id: "item-001", qty: 30 });
    await inventoryService.assignStockToBin(tenantId, session, "bin-001", {
      product_id: "item-001",
      qty: 30,
    });

    // getBinStock
    mockOnce([{ bin_id: "bin-001", product_id: "item-001", qty: 30 }]);
    const binStock = await inventoryService.getBinStock(tenantId, session, "bin-001");
    expect(binStock.length).toBeGreaterThan(0);
  });

  it("supports audit cycle initiation and closure", async () => {
    // startAuditCycle
    mockOnce({ id: "cycle-001", status: "IN_PROGRESS", location_id: "LOC-JKT" });
    const cycle = await inventoryService.startAuditCycle(tenantId, session, {
      location_id: "LOC-JKT",
      scope: "LOCATION",
    });
    expect(cycle.id).toBe("cycle-001");

    // closeAuditCycle
    mockOnce({ id: "cycle-001", status: "COMPLETED" });
    const closed = await inventoryService.closeAuditCycle(tenantId, session, "cycle-001", {
      counted_value: 2_000_000,
      variance_value: 50_000,
    });
    expect(closed.status).toBe("COMPLETED");
  });
});
