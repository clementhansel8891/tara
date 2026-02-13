import { beforeEach, describe, expect, it, vi } from "vitest";
import { Roles } from "@/core/security/roles";
import type { SessionContext } from "@/core/security/session";
import { registerDefaultRepos } from "@/core/persistence/repositoryRegistry";
import { financeService } from "./financeService";
import { runFinanceDepreciationSchedulerTick } from "./financeScheduler";

const tenantId = "tenant-finance-e2e";

const superadminSession: SessionContext = {
  userId: "finance-superadmin",
  tenantId,
  role: Roles.SUPERADMIN,
  departmentId: "FINANCE",
};

const opsHodSession: SessionContext = {
  userId: "ops-hod",
  tenantId,
  role: Roles.DEPT_HEAD,
  departmentId: "dept-ops",
};

const financeHodSession: SessionContext = {
  userId: "finance-hod",
  tenantId,
  role: Roles.FINANCE_DEPT_HEAD,
  departmentId: "dept-fin",
};

const cfoSession: SessionContext = {
  userId: "finance-cfo",
  tenantId,
  role: Roles.FINANCE_ADMIN,
  departmentId: "FINANCE",
};

describe("financeService end-to-end flows", () => {
  beforeEach(() => {
    registerDefaultRepos();
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it("enforces ledger budget and staged CAPEX approvals before capitalization", async () => {
    financeService.setCapexBudget(tenantId, superadminSession, {
      department: "OPERATIONS",
      totalBudget: 1_000_000_000,
      notes: "E2E budget setup",
    });

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
    await expect(
      financeService.approveCapexRequest(tenantId, financeHodSession, created.capex.id),
    ).rejects.toThrow("HOD approval is restricted");

    const hodApproved = await financeService.approveCapexRequest(
      tenantId,
      opsHodSession,
      created.capex.id,
    );
    expect(hodApproved?.status).toBe("PENDING_CFO_APPROVAL");
    expect(hodApproved?.hodApprovedBy).toBe(opsHodSession.userId);

    const cfoApproved = await financeService.approveCapexRequest(
      tenantId,
      cfoSession,
      created.capex.id,
    );
    expect(cfoApproved?.status).toBe("APPROVED");
    expect(cfoApproved?.cfoApprovedBy).toBe(cfoSession.userId);

    const capitalized = await financeService.capitalizeAsset(
      tenantId,
      superadminSession,
      created.asset.id,
      "2026-02-15",
    );
    expect(capitalized?.status).toBe("ACTIVE");
  });

  it("runs depreciation via background scheduler tick", async () => {
    await financeService.listAssets(tenantId, superadminSession);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T08:00:00.000Z"));

    await runFinanceDepreciationSchedulerTick();

    const depEntries = financeService.listAssetDepreciationEntries(tenantId);
    expect(depEntries.length).toBeGreaterThan(0);
  });

  it("keeps receivable/payable/invoice/docs flows operational", async () => {
    const receivable = financeService.createReceivable(tenantId, superadminSession, {
      customer: "Acme Distribution",
      amount: 120_000_000,
      dueDate: "2026-02-20",
      invoiceDate: "2026-02-01",
    });
    financeService.sendReceivableReminder(tenantId, superadminSession, receivable.id);
    financeService.markReceived(tenantId, receivable.id);
    const updatedReceivable = financeService
      .listReceivables(tenantId)
      .find((item) => item.id === receivable.id);
    expect(updatedReceivable?.status).toBe("APPROVED");

    const payable = financeService.createPayable(tenantId, superadminSession, {
      vendor: "Vendor Prime",
      amount: 80_000_000,
      dueDate: "2026-02-28",
    });
    const approvedPayable = financeService.approvePayable(
      tenantId,
      superadminSession,
      payable.id,
    );
    expect(approvedPayable?.status).toBe("approved");
    financeService.markPaid(tenantId, payable.id);
    const updatedPayable = financeService
      .listPayables(tenantId)
      .find((item) => item.id === payable.id);
    expect(updatedPayable?.status).toBe("APPROVED");

    const capturedReceivable = financeService.captureInvoice(tenantId, {
      vendor: "Client A",
      amount: 25_000_000,
      invoiceDate: "2026-02-05",
      dueDate: "2026-02-25",
    });
    const capturedPayable = financeService.capturePayableInvoice(
      tenantId,
      superadminSession,
      {
        vendor: "Supplier A",
        amount: 30_000_000,
        invoiceDate: "2026-02-06",
        dueDate: "2026-02-26",
      },
    );
    expect(capturedReceivable.id.startsWith("inv-")).toBe(true);
    expect(capturedPayable.id.startsWith("bill-")).toBe(true);

    const doc = financeService.uploadDocumentForApproval(tenantId, superadminSession, {
      title: "Impairment evidence packet",
      type: "ASSET_EVIDENCE",
      description: "Engineering and valuation reports",
    });
    financeService.updateDocumentStatus(tenantId, doc.id, "APPROVED");
    const updatedDoc = financeService.listDocuments(tenantId).find((item) => item.id === doc.id);
    expect(updatedDoc?.status).toBe("APPROVED");
  });

  it("produces verifiable immutable audit packs", async () => {
    const [asset] = await financeService.listAssets(tenantId, superadminSession);
    const pack = financeService.generateAssetAuditPack(tenantId, asset.id);
    expect(financeService.verifyAssetAuditPack(tenantId, pack)).toBe(true);
    expect(pack.signatureVersion).toBe("v1");

    const tamperedPack = { ...pack, checksum: `${pack.checksum}-tampered` };
    expect(financeService.verifyAssetAuditPack(tenantId, tamperedPack)).toBe(false);
  });
});
