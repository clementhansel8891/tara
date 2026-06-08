
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Roles } from "@/core/security/roles";
import type { SessionContext } from "@/core/security/session";
import { financeService } from "./financeService";

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

// ─── Session (snake_case aligned to SessionContext) ───────────────────────────
const tenantId = "tenant-finance-test";
const session: SessionContext = {
  user_id: "finance-owner",
  tenant_id: tenantId,
  role: Roles.SUPERADMIN,
  department_id: "FINANCE",
  location_id: "LOC-HQ",
  permissions: [],
};

const mockOnce = (value: unknown) => (apiRequest as any).mockResolvedValueOnce(value);
const mockRejected = (message: string, status = 400) =>
  (apiRequest as any).mockRejectedValueOnce(new ApiError(message, status));

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("financeService asset lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs scheduled depreciation and returns posted journal IDs", async () => {
    // Step 1: List assets
    const mockAssets = [
      { id: "asset-1", description: "Forklift A", status: "ACTIVE" },
      { id: "asset-2", description: "Conveyor Belt", status: "ACTIVE" },
    ];
    mockOnce(mockAssets);
    const assets = await financeService.listAssets(tenantId, session);
    expect(assets.length).toBeGreaterThan(0);

    // Step 2: Run scheduled depreciation
    const mockRun = {
      postedEntries: 2,
      journalEntryIds: ["jv-dep-001", "jv-dep-002"],
      periodStart: "2026-02-01",
      periodEnd: "2026-02-28",
    };
    mockOnce(mockRun);
    const run = await financeService.runScheduledPeriodDepreciation(tenantId, session, {
      periodStart: "2026-02-01",
      periodEnd: "2026-02-28",
      postingDate: "2026-02-28",
      cfoSignoff: true,
    });
    expect(run.postedEntries).toBeGreaterThan(0);
    expect(run.journalEntryIds.length).toBe(run.postedEntries);

    // Step 3: Verify depreciation entries exist
    const mockEntries = [
      { id: "dep-1", asset_id: "asset-1", amount: 10_000_000 },
      { id: "dep-2", asset_id: "asset-2", amount: 8_000_000 },
    ];
    mockOnce(mockEntries);
    const entries = await financeService.listAssetDepreciationEntries(tenantId, session);
    expect(entries.length).toBe(run.postedEntries);
  });

  it("enforces document attachments on impairment, revaluation, and disposal", async () => {
    // Step 1: List assets
    mockOnce([{ id: "asset-1", description: "Server Rack", status: "ACTIVE" }]);
    const [asset] = await financeService.listAssets(tenantId, session);
    expect(asset).toBeDefined();

    // Step 2: Impairment without documents → should fail
    mockRejected("At least one supporting document is required.", 422);
    await expect(
      financeService.recordAssetImpairment(tenantId, session, {
        assetId: asset.id,
        impairmentAmount: 1_000_000,
        reason: "Missing docs should fail",
        attachmentDocumentIds: [],
      }),
    ).rejects.toThrow("At least one supporting document is required.");

    // Step 3: Impairment with documents → succeeds
    const docIds = ["doc-001"];
    mockOnce({ id: "evt-imp-1", type: "IMPAIRMENT", assetId: asset.id, attachmentDocumentIds: docIds });
    const impairment = await financeService.recordAssetImpairment(tenantId, session, {
      assetId: asset.id,
      impairmentAmount: 1_000_000,
      reason: "Evidence-backed impairment",
      attachmentDocumentIds: docIds,
    });
    expect(impairment.type).toBe("IMPAIRMENT");
    expect(impairment.attachmentDocumentIds).toEqual(docIds);

    // Step 4: Revaluation with documents
    mockOnce({ id: "evt-rev-1", type: "REVALUATION", assetId: asset.id, attachmentDocumentIds: docIds });
    const revaluation = await financeService.recordAssetRevaluation(tenantId, session, {
      assetId: asset.id,
      revaluedAmount: 1_000_000_000,
      reason: "Evidence-backed revaluation",
      attachmentDocumentIds: docIds,
    });
    expect(revaluation.type).toBe("REVALUATION");
    expect(revaluation.attachmentDocumentIds).toEqual(docIds);

    // Step 5: Disposal with documents
    const journalEntryId = "jv-disposal-001";
    mockOnce({
      id: "evt-dis-1",
      type: "DISPOSAL",
      assetId: asset.id,
      attachmentDocumentIds: docIds,
      journalEntryId,
    });
    const disposal = await financeService.disposeAsset(tenantId, session, {
      assetId: asset.id,
      disposalType: "WRITE_OFF",
      proceeds: 0,
      attachmentDocumentIds: docIds,
    });
    expect(disposal.type).toBe("DISPOSAL");
    expect(disposal.attachmentDocumentIds).toEqual(docIds);
    // The backend should have created a journal entry for the disposal gain/loss
    expect(disposal.journalEntryId).toBe(journalEntryId);
  });

  it("generates downloadable audit pack artifacts as JSON and PDF", async () => {
    // Step 1: List assets
    mockOnce([{ id: "asset-1", description: "Industrial Pump" }]);
    const [asset] = await financeService.listAssets(tenantId, session);
    expect(asset).toBeDefined();

    // Step 2: Download JSON artifact
    const jsonArtifact = {
      mimeType: "application/json",
      data: JSON.stringify({
        assetId: asset.id,
        checksum: "sha256-checksum-abc",
        signature: "sig-xyz",
        evidence: ["doc-001", "doc-002"],
      }),
    };
    mockOnce(jsonArtifact);
    const json = await financeService.downloadAssetAuditPack(tenantId, session, asset.id, "JSON");
    expect(json.mimeType).toBe("application/json");
    expect(typeof json.data).toBe("string");
    const parsed = JSON.parse(json.data as string);
    expect(parsed.assetId).toBe(asset.id);
    expect(parsed.checksum.length).toBeGreaterThan(0);
    expect(parsed.signature.length).toBeGreaterThan(0);
    expect(parsed.evidence.length).toBeGreaterThan(0);

    // Step 3: Download PDF artifact (binary blob)
    const pdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF header
    const pdfArtifact = {
      mimeType: "application/pdf",
      data: pdfBuffer,
    };
    mockOnce(pdfArtifact);
    const pdf = await financeService.downloadAssetAuditPack(tenantId, session, asset.id, "PDF");
    expect(pdf.mimeType).toBe("application/pdf");
    expect(ArrayBuffer.isView(pdf.data)).toBe(true);
  });

  it("posts individual asset depreciation entry", async () => {
    const assetId = "asset-1";
    const mockEntry = {
      id: "dep-001",
      assetId,
      postingDate: "2026-02-28",
      method: "STRAIGHT_LINE",
      amount: 12_500_000,
      accumulatedDepreciation: 25_000_000,
      carryingValue: 75_000_000,
      journalEntryId: "jv-001",
      createdAt: new Date().toISOString(),
    };
    mockOnce(mockEntry);

    const entry = await financeService.postDepreciation(tenantId, session, {
      assetId,
      postingDate: "2026-02-28",
      method: "STRAIGHT_LINE",
      cfoSignoff: true,
    });
    expect(entry.assetId).toBe(assetId);
    expect(entry.journalEntryId).toBe("jv-001");
    expect(entry.amount).toBe(12_500_000);
  });

  it("records and retrieves asset events (impairment, revaluation, disposal)", async () => {
    const assetId = "asset-1";
    const docIds = ["doc-evidence-1"];

    // Record impairment
    mockOnce({ id: "evt-1", type: "IMPAIRMENT", assetId, attachmentDocumentIds: docIds });
    await financeService.recordAssetImpairment(tenantId, session, {
      assetId,
      impairmentAmount: 500_000,
      reason: "Market decline",
      attachmentDocumentIds: docIds,
    });

    // List events
    mockOnce([
      { id: "evt-1", type: "IMPAIRMENT", assetId },
    ]);
    const events = await financeService.listAssetEvents(tenantId, session, assetId);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe("IMPAIRMENT");
  });
});
