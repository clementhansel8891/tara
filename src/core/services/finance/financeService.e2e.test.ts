
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Roles } from "@/core/security/roles";
import type { SessionContext } from "@/core/security/session";
import { financeService } from "./financeService";

// ─── Mock the HTTP layer ──────────────────────────────────────────────────────
// financeService is entirely API-backed. We mock apiRequest to isolate logic
// and avoid hitting a live server during E2E unit tests.
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

// ─── Sessions (snake_case aligned to SessionContext) ─────────────────────────
const tenantId = "tenant-finance-e2e";

const superadminSession: SessionContext = {
  user_id: "finance-superadmin",
  tenant_id: tenantId,
  role: Roles.SUPERADMIN,
  department_id: "FINANCE",
  location_id: "LOC-HQ",
  permissions: [],
};

const opsHodSession: SessionContext = {
  user_id: "ops-hod",
  tenant_id: tenantId,
  role: Roles.DEPT_HEAD,
  department_id: "dept-ops",
  location_id: "LOC-HQ",
  permissions: [],
};

const financeHodSession: SessionContext = {
  user_id: "finance-hod",
  tenant_id: tenantId,
  role: Roles.FINANCE_DEPT_HEAD,
  department_id: "dept-fin",
  location_id: "LOC-HQ",
  permissions: [],
};

const cfoSession: SessionContext = {
  user_id: "finance-cfo",
  tenant_id: tenantId,
  role: Roles.FINANCE_ADMIN,
  department_id: "FINANCE",
  location_id: "LOC-HQ",
  permissions: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mockOnce = (value: unknown) => (apiRequest as any).mockResolvedValueOnce(value);
const mockRejected = (message: string, status = 400) =>
  (apiRequest as any).mockRejectedValueOnce(new ApiError(message, status));

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("financeService end-to-end flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── CAPEX workflow ──────────────────────────────────────────────────────────
  describe("CAPEX budget and staged approval workflow", () => {
    it("rejects oversized CAPEX request that exceeds budget", async () => {
      // Budget setup (fire-and-forget, no assertion needed)
      mockOnce({ id: "budget-1", department: "OPERATIONS", totalBudget: 1_000_000_000 });
      await financeService.setCapexBudget(tenantId, superadminSession, {
        department: "OPERATIONS",
        totalBudget: 1_000_000_000,
        notes: "E2E budget setup",
      });

      // Oversized request → backend rejects with 400
      mockRejected("CAPEX budget exceeded", 400);
      await expect(
        financeService.createCapexRequest(tenantId, superadminSession, {
          assetDescription: "Oversized generator",
          requestedAmount: 2_000_000_000,
          department: "OPERATIONS",
          projectCode: "OPS-OVR",
          location: "HQ",
          acquisitionDate: "2026-02-10",
          usefulLifeYears: 10,
          residualValue: 100_000_000,
          depreciationMethod: "STRAIGHT_LINE",
          assetClass: "MACHINERY",
        }),
      ).rejects.toThrow("CAPEX budget exceeded");
    });

    it("creates valid CAPEX and routes through HOD → CFO approval stages", async () => {
      const capexId = "capex-packing-001";
      const assetId = "asset-packing-001";

      // Step 1: Create CAPEX request
      const createdCapex = {
        id: capexId,
        assetDescription: "Packing machine",
        status: "PENDING_HOD_APPROVAL",
        requestedAmount: 400_000_000,
        department: "OPERATIONS",
      };
      const createdAsset = { id: assetId, status: "PENDING" };
      mockOnce({ asset: createdAsset, capex: createdCapex });

      const created = await financeService.createCapexRequest(tenantId, superadminSession, {
        assetDescription: "Packing machine",
        requestedAmount: 400_000_000,
        department: "OPERATIONS",
        projectCode: "OPS-001",
        location: "Plant A",
        acquisitionDate: "2026-02-10",
        usefulLifeYears: 8,
        residualValue: 20_000_000,
        depreciationMethod: "DECLINING_BALANCE",
        assetClass: "MACHINERY",
      });
      expect(created.capex.status).toBe("PENDING_HOD_APPROVAL");

      // Step 2: Finance HOD should NOT be able to approve OPS CAPEX
      mockRejected("HOD approval is restricted to the department HOD", 403);
      await expect(
        financeService.approveCapexRequest(tenantId, financeHodSession, capexId),
      ).rejects.toThrow("HOD approval is restricted");

      // Step 3: Ops HOD approves
      const hodApproved = { id: capexId, status: "PENDING_CFO_APPROVAL", hod_approved_by: opsHodSession.user_id };
      mockOnce(hodApproved);
      const hodResult = await financeService.approveCapexRequest(tenantId, opsHodSession, capexId);
      expect(hodResult?.status).toBe("PENDING_CFO_APPROVAL");
      expect(hodResult?.hod_approved_by).toBe(opsHodSession.user_id);

      // Step 4: CFO approves
      const cfoApproved = { id: capexId, status: "APPROVED", cfo_approved_by: cfoSession.user_id };
      mockOnce(cfoApproved);
      const cfoResult = await financeService.approveCapexRequest(tenantId, cfoSession, capexId);
      expect(cfoResult?.status).toBe("APPROVED");
      expect(cfoResult?.cfo_approved_by).toBe(cfoSession.user_id);

      // Step 5: Capitalize asset
      mockOnce({ id: assetId, status: "ACTIVE", capitalized_at: "2026-02-15" });
      const capitalized = await financeService.capitalizeAsset(
        tenantId,
        superadminSession,
        assetId,
        "2026-02-15",
      );
      expect(capitalized?.status).toBe("ACTIVE");
    });
  });

  // ── Depreciation scheduler ──────────────────────────────────────────────────
  describe("Depreciation scheduler tick", () => {
    it("runs scheduled period depreciation and returns posted entries", async () => {
      const mockRun = {
        postedEntries: 3,
        journalEntryIds: ["jv-1", "jv-2", "jv-3"],
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
      };
      mockOnce(mockRun);

      const run = await financeService.runScheduledPeriodDepreciation(tenantId, superadminSession, {
        periodStart: "2026-03-01",
        periodEnd: "2026-03-31",
        postingDate: "2026-03-31",
        cfoSignoff: true,
      });

      expect(run.postedEntries).toBe(3);
      expect(run.journalEntryIds).toHaveLength(3);
    });

    it("returns depreciation entries after scheduler tick", async () => {
      const mockEntries = [
        { id: "dep-1", asset_id: "asset-1", amount: 5_000_000 },
        { id: "dep-2", asset_id: "asset-2", amount: 8_000_000 },
      ];
      mockOnce(mockEntries);

      const entries = await financeService.listAssetDepreciationEntries(tenantId, superadminSession);
      expect(entries.length).toBeGreaterThan(0);
    });
  });

  // ── Receivables / Payables / Invoices ───────────────────────────────────────
  describe("Receivables, payables, and invoice flows", () => {
    it("creates receivable, sends reminder, and marks received", async () => {
      const receivableId = "rec-001";

      // Create receivable
      mockOnce({ id: receivableId, customer: "Acme Distribution", status: "PENDING" });
      const receivable = await financeService.createReceivable(tenantId, superadminSession, {
        customer: "Acme Distribution",
        amount: 120_000_000,
        dueDate: "2026-02-20",
        invoiceDate: "2026-02-01",
      });
      expect(receivable.id).toBe(receivableId);

      // Send reminder (no return value)
      mockOnce(undefined);
      await financeService.sendReceivableReminder(tenantId, superadminSession, receivable.id);

      // Mark received
      mockOnce(undefined);
      await financeService.markReceived(tenantId, superadminSession, receivable.id);

      // Verify updated status
      mockOnce([{ id: receivableId, status: "APPROVED" }]);
      const list = await financeService.listReceivables(tenantId, superadminSession);
      const updated = list.find((r) => r.id === receivable.id);
      expect(updated?.status).toBe("APPROVED");
    });

    it("creates payable and captures payable invoice", async () => {
      // Create payable (delegates to capturePayableInvoice)
      mockOnce({ id: "bill-001", status: "PENDING" });
      const payable = await financeService.createPayable(tenantId, superadminSession, {
        vendor: "Vendor Prime",
        amount: 80_000_000,
        dueDate: "2026-02-28",
      });
      expect(payable.id).toBe("bill-001");

      // Capture receivable invoice
      mockOnce({ id: "inv-001", kind: "RECEIVABLE", status: "PENDING" });
      const capturedReceivable = await financeService.capturePayableInvoice(tenantId, superadminSession, {
        vendor: "Client A",
        amount: 25_000_000,
        invoiceDate: "2026-02-05",
        dueDate: "2026-02-25",
      });
      expect(capturedReceivable.id).toBe("inv-001");
    });
  });

  // ── Asset audit packs ───────────────────────────────────────────────────────
  describe("Asset audit pack generation and verification", () => {
    it("generates audit pack and verifies checksum integrity", async () => {
      const assetId = "asset-001";
      const mockPack = {
        assetId,
        checksum: "sha256-abc123",
        signature: "sig-xyz",
        signatureVersion: "v1",
        artifacts: [],
      };

      // Generate
      mockOnce(mockPack);
      const pack = await financeService.generateAssetAuditPack(tenantId, superadminSession, assetId);
      expect(pack.signatureVersion).toBe("v1");

      // Verify — valid pack returns true
      mockOnce(true);
      const isValid = await financeService.verifyAssetAuditPack(tenantId, superadminSession, pack);
      expect(isValid).toBe(true);

      // Verify — tampered pack returns false
      mockOnce(false);
      const tamperedPack = { ...pack, checksum: `${pack.checksum}-tampered` };
      const isTampered = await financeService.verifyAssetAuditPack(tenantId, superadminSession, tamperedPack);
      expect(isTampered).toBe(false);
    });
  });

  // ── Finance alerts / dashboard ──────────────────────────────────────────────
  describe("Finance inbox and alerts", () => {
    it("retrieves finance inbox with alerts and pending payments", async () => {
      mockOnce({
        alerts: [{ id: "alert-1", type: "OVERDUE_RECEIVABLE" }],
        pendingPayments: [{ id: "pay-1", amount: 5_000_000 }],
        totalCount: 2,
      });

      const inbox = await financeService.getInbox(tenantId, superadminSession);
      expect(inbox.alerts).toHaveLength(1);
      expect(inbox.pendingPayments).toHaveLength(1);
    });
  });

  // ── Period management ───────────────────────────────────────────────────────
  describe("Accounting period management", () => {
    it("lists periods, locks one, and approves close", async () => {
      const periodId = "period-2026-02";

      mockOnce([{ id: periodId, status: "OPEN" }]);
      const periods = await financeService.listPeriods(tenantId, superadminSession);
      expect(periods).toHaveLength(1);

      mockOnce(undefined);
      await financeService.lockPeriod(tenantId, superadminSession, periodId);

      mockOnce(undefined);
      await financeService.approvePeriodClose(tenantId, superadminSession, periodId);

      expect(apiRequest).toHaveBeenCalledTimes(3);
    });
  });
});
