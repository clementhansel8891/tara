import { beforeEach, describe, expect, it } from "vitest";
import { financeRepo } from "@/core/repositories/finance/financeRepo";
import { Roles } from "@/core/security/roles";
import type { SessionContext } from "@/core/security/session";
import { financeService } from "./financeService";

const tenantId = "tenant-finance-test";
const session: SessionContext = {
  userId: "finance-owner",
  tenantId,
  role: Roles.SUPERADMIN,
  departmentId: "FINANCE",
};

describe("financeService asset lifecycle", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("runs scheduled depreciation and auto-posts journals", async () => {
    const assets = await financeService.listAssets(tenantId, session);
    expect(assets.length).toBeGreaterThan(0);

    const run = await financeService.runScheduledPeriodDepreciation(
      tenantId,
      session,
      {
        periodStart: "2026-02-01",
        periodEnd: "2026-02-28",
        postingDate: "2026-02-28",
        cfoSignoff: true,
      },
    );

    expect(run.postedEntries).toBeGreaterThan(0);
    expect(run.journalEntryIds.length).toBe(run.postedEntries);

    const entries = await financeService.listAssetDepreciationEntries(tenantId);
    expect(entries.length).toBe(run.postedEntries);

    const journals = await financeRepo.listJournalEntries(tenantId);
    const allJournalsExist = run.journalEntryIds.every((id) =>
      journals.some((journal) => journal.id === id),
    );
    expect(allJournalsExist).toBe(true);
  });

  it("enforces document attachments and creates disposal gain or loss journals", async () => {
    const docs = financeService.listDocuments(tenantId);
    const docIds = docs.slice(0, 1).map((doc) => doc.id);
    const [asset] = await financeService.listAssets(tenantId, session);
    expect(asset).toBeDefined();

    await expect(
      financeService.recordAssetImpairment(tenantId, session, {
        assetId: asset.id,
        impairmentAmount: 1000,
        reason: "Missing docs should fail",
        attachmentDocumentIds: [],
      }),
    ).rejects.toThrow("At least one supporting document is required.");

    const impairment = await financeService.recordAssetImpairment(tenantId, session, {
      assetId: asset.id,
      impairmentAmount: 1000,
      reason: "Evidence-backed impairment",
      attachmentDocumentIds: docIds,
    });
    expect(impairment.type).toBe("IMPAIRMENT");
    expect(impairment.attachmentDocumentIds).toEqual(docIds);

    const revaluation = await financeService.recordAssetRevaluation(tenantId, session, {
      assetId: asset.id,
      revaluedAmount: 1000000,
      reason: "Evidence-backed revaluation",
      attachmentDocumentIds: docIds,
    });
    expect(revaluation.type).toBe("REVALUATION");
    expect(revaluation.attachmentDocumentIds).toEqual(docIds);

    const disposal = await financeService.disposeAsset(tenantId, session, {
      assetId: asset.id,
      disposalType: "WRITE_OFF",
      proceeds: 0,
      attachmentDocumentIds: docIds,
    });
    expect(disposal.type).toBe("DISPOSAL");
    expect(disposal.attachmentDocumentIds).toEqual(docIds);

    const disposalJournal = (await financeRepo.listJournalEntries(tenantId))
      .find((entry) => entry.id === disposal.journalEntryId);
    expect(disposalJournal).toBeDefined();
    expect(
      disposalJournal?.lines.some(
        (line) =>
          line.accountCode === "EXP-DISPOSAL-LOSS" ||
          line.accountCode === "INC-DISPOSAL-GAIN",
      ),
    ).toBe(true);
  });

  it("generates downloadable audit pack artifacts as JSON and PDF", async () => {
    const [asset] = await financeService.listAssets(tenantId, session);
    expect(asset).toBeDefined();

    const jsonArtifact = financeService.downloadAssetAuditPack(tenantId, asset.id, "JSON");
    expect(jsonArtifact.mimeType).toBe("application/json");
    expect(typeof jsonArtifact.data).toBe("string");
    if (typeof jsonArtifact.data !== "string") {
      throw new Error("JSON artifact did not return string data.");
    }
    const parsed = JSON.parse(jsonArtifact.data) as {
      assetId: string;
      checksum: string;
      signature: string;
      evidence: string[];
    };
    expect(parsed.assetId).toBe(asset.id);
    expect(parsed.checksum.length).toBeGreaterThan(0);
    expect(parsed.signature.length).toBeGreaterThan(0);
    expect(parsed.evidence.length).toBeGreaterThan(0);

    const pdfArtifact = financeService.downloadAssetAuditPack(tenantId, asset.id, "PDF");
    expect(pdfArtifact.mimeType).toBe("application/pdf");
    expect(typeof pdfArtifact.data).not.toBe("string");
    expect(ArrayBuffer.isView(pdfArtifact.data)).toBe(true);
  });
});
