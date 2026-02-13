import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";
import { useSession } from "@/core/security/session";
import {
  financeService,
  type AssetCapexInput,
  type FinanceCapexBudgetRow,
  type FinanceDocumentRow,
  type ScheduledDepreciationRunResult,
} from "@/core/services/finance/financeService";
import { logService } from "@/core/services/finance/logService";
import type {
  AssetAuditPack,
  AssetDepreciationEntry,
  AssetEvent,
  CapexRequest,
  DepreciationMethod,
  FixedAsset,
} from "@/core/types/finance/assets";

type AssetTab = "register" | "capex" | "depreciation" | "events";

const TABS: { id: AssetTab; label: string }[] = [
  { id: "register", label: "Register" },
  { id: "capex", label: "CAPEX" },
  { id: "depreciation", label: "Depreciation" },
  { id: "events", label: "Events" },
];

const defaultCapexForm: AssetCapexInput = {
  assetDescription: "",
  requestedAmount: 0,
  department: "",
  projectCode: "",
  location: "",
  acquisitionDate: "",
  usefulLifeYears: 5,
  residualValue: 0,
  depreciationMethod: "STRAIGHT_LINE",
  assetClass: "EQUIPMENT",
};

type DepreciationRunForm = {
  periodStart: string;
  periodEnd: string;
  postingDate: string;
};

const defaultDepreciationRunForm = (): DepreciationRunForm => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return {
    periodStart: monthStart,
    periodEnd: monthEnd,
    postingDate: monthEnd,
  };
};

const toSafeNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatAmount = (value: unknown, fallback = 0): string =>
  toSafeNumber(value, fallback).toLocaleString();

export default function Assets() {
  const session = useSession();
  const sessionRef = useRef(session);
  const [tab, setTab] = useState<AssetTab>("register");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [capexForm, setCapexForm] = useState<AssetCapexInput>(defaultCapexForm);
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [capexRequests, setCapexRequests] = useState<CapexRequest[]>([]);
  const [capexBudgets, setCapexBudgets] = useState<FinanceCapexBudgetRow[]>([]);
  const [depreciationEntries, setDepreciationEntries] = useState<AssetDepreciationEntry[]>([]);
  const [assetEvents, setAssetEvents] = useState<AssetEvent[]>([]);
  const [documents, setDocuments] = useState<FinanceDocumentRow[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AssetAuditPack | null>(null);
  const [runForm, setRunForm] = useState<DepreciationRunForm>(defaultDepreciationRunForm);
  const [runResult, setRunResult] = useState<ScheduledDepreciationRunResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const runAction = useCallback(async (action: () => Promise<void>, success: string) => {
    setErrorMessage(null);
    try {
      await action();
      setStatusMessage(success);
    } catch (error) {
      setStatusMessage(null);
      setErrorMessage(error instanceof Error ? error.message : "Request failed.");
    }
  }, []);

  const loadData = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (!currentSession?.tenantId) return;

    const [assetRows, capexRows, documentRows, budgetRows] = await Promise.all([
      financeService.listAssets(currentSession.tenantId, currentSession),
      Promise.resolve(financeService.listCapexRequests(currentSession.tenantId)),
      Promise.resolve(financeService.listDocuments(currentSession.tenantId)),
      Promise.resolve(financeService.listCapexBudgets(currentSession.tenantId)),
    ]);
    setAssets(assetRows);
    setCapexRequests(capexRows);
    setCapexBudgets(budgetRows);
    setDocuments(documentRows);
    setDepreciationEntries(financeService.listAssetDepreciationEntries(currentSession.tenantId));
    setAssetEvents(financeService.listAssetEvents(currentSession.tenantId));
    setSelectedDocumentIds((previous) => {
      const retained = previous.filter((id) => documentRows.some((doc) => doc.id === id));
      if (retained.length) return retained;
      return documentRows[0] ? [documentRows[0].id] : [];
    });
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) =>
        search
          ? `${asset.description} ${asset.location} ${asset.department}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true,
      ),
    [assets, search],
  );

  const filteredCapex = useMemo(
    () =>
      capexRequests.filter((request) =>
        search
          ? `${request.assetDescription} ${request.department}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true,
      ),
    [capexRequests, search],
  );

  const createCapex = async () => {
    await runAction(async () => {
      await financeService.createCapexRequest(session.tenantId, session, capexForm);
      logService.log(
        session.tenantId,
        session.userId,
        "Created CAPEX request",
        capexForm.assetDescription,
      );
      setDialogOpen(false);
      setCapexForm(defaultCapexForm);
      await loadData();
    }, "CAPEX request created and routed.");
  };

  const approveCapex = async (requestId: string) => {
    await runAction(async () => {
      await financeService.approveCapexRequest(session.tenantId, session, requestId);
      logService.log(session.tenantId, session.userId, "Approved CAPEX request", requestId);
      await loadData();
    }, "CAPEX request approved.");
  };

  const rejectCapex = async (requestId: string) => {
    await runAction(async () => {
      await financeService.rejectCapexRequest(
        session.tenantId,
        session,
        requestId,
        "Rejected from Assets workspace",
      );
      logService.log(session.tenantId, session.userId, "Rejected CAPEX request", requestId);
      await loadData();
    }, "CAPEX request rejected.");
  };

  const capitalize = async (assetId: string) => {
    await runAction(async () => {
      await financeService.capitalizeAsset(
        session.tenantId,
        session,
        assetId,
        new Date().toISOString().slice(0, 10),
      );
      logService.log(session.tenantId, session.userId, "Capitalized asset", assetId);
      await loadData();
    }, "Asset capitalized.");
  };

  const impairment = async (assetId: string) => {
    await runAction(async () => {
      await financeService.recordAssetImpairment(session.tenantId, session, {
        assetId,
        impairmentAmount: 500000000,
        reason: "Operational impairment assessment",
        attachmentDocumentIds: selectedDocumentIds,
      });
      logService.log(session.tenantId, session.userId, "Recorded impairment", assetId);
      await loadData();
    }, "Impairment recorded with journal posting.");
  };

  const revalue = async (assetId: string, carryingValue: number) => {
    await runAction(async () => {
      await financeService.recordAssetRevaluation(session.tenantId, session, {
        assetId,
        revaluedAmount: Math.round(carryingValue * 1.05),
        reason: "Fair value reassessment",
        attachmentDocumentIds: selectedDocumentIds,
      });
      logService.log(session.tenantId, session.userId, "Recorded revaluation", assetId);
      await loadData();
    }, "Revaluation recorded with journal posting.");
  };

  const dispose = async (assetId: string, carryingValue: number) => {
    await runAction(async () => {
      await financeService.disposeAsset(session.tenantId, session, {
        assetId,
        disposalType: "SALE",
        proceeds: Math.max(Math.round(carryingValue * 0.8), 0),
        attachmentDocumentIds: selectedDocumentIds,
      });
      logService.log(session.tenantId, session.userId, "Disposed asset", assetId);
      await loadData();
    }, "Disposal recorded with gain/loss journal.");
  };

  const runScheduledDepreciation = async () => {
    await runAction(async () => {
      const result = await financeService.runScheduledPeriodDepreciation(
        session.tenantId,
        session,
        {
          periodStart: runForm.periodStart,
          periodEnd: runForm.periodEnd,
          postingDate: runForm.postingDate,
          cfoSignoff: true,
        },
      );
      setRunResult(result);
      logService.log(session.tenantId, session.userId, "Scheduled depreciation run", result.runId);
      await loadData();
    }, "Scheduled depreciation run completed.");
  };

  const openAuditPack = (assetId: string) => {
    const pack = financeService.generateAssetAuditPack(session.tenantId, assetId);
    setSelectedAudit(pack);
  };

  const downloadAuditPack = (assetId: string, format: "JSON" | "PDF") => {
    try {
      const artifact = financeService.downloadAssetAuditPack(session.tenantId, assetId, format);
      const blob = new Blob([artifact.data], { type: artifact.mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = artifact.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setErrorMessage(null);
      setStatusMessage(`Downloaded ${artifact.filename}.`);
    } catch (error) {
      setStatusMessage(null);
      setErrorMessage(error instanceof Error ? error.message : "Failed to download audit pack.");
    }
  };

  const toggleAttachment = (documentId: string, selected: boolean) => {
    setSelectedDocumentIds((previous) => {
      if (selected) {
        return Array.from(new Set([...previous, documentId]));
      }
      return previous.filter((id) => id !== documentId);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        subtitle="Fixed asset lifecycle with CAPEX governance, capitalization control, and depreciation posting."
        primaryAction={<Button onClick={() => setDialogOpen(true)}>New CAPEX Request</Button>}
        secondaryActions={
          <Input
            placeholder="Search assets, location, department"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[240px]"
          />
        }
      />

      <WorkspacePanel
        title="Lifecycle Workbench"
        description="CAPEX -> Capitalization -> Depreciation -> Event tracking."
      >
        <div className="mb-4 rounded-lg border p-3 text-sm">
          <p className="font-medium">CAPEX Budget Ledger</p>
          <p className="text-muted-foreground">
            Budget availability is enforced from ledger accounts before CAPEX requests are created.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
                {capexBudgets.map((budget) => (
                  <div key={budget.department} className="rounded border p-2 text-xs">
                    <p className="font-medium">{budget.department}</p>
                    <p className="text-muted-foreground">Allocated: {formatAmount(budget.allocatedBudget)}</p>
                    <p className="text-muted-foreground">Committed: {formatAmount(budget.committedBudget)}</p>
                    <p className="text-muted-foreground">Available: {formatAmount(budget.availableBudget)}</p>
                  </div>
                ))}
              </div>
        </div>
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <div className="mb-4 rounded-lg border p-3 text-sm">
          <p className="font-medium">Lifecycle Supporting Documents</p>
          <p className="text-muted-foreground">
            Impairment, revaluation, and disposal actions require at least one document attachment.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {documents.length ? (
              documents.map((document) => (
                <label
                  key={document.id}
                  className="flex items-center gap-2 rounded border px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedDocumentIds.includes(document.id)}
                    onChange={(event) => toggleAttachment(document.id, event.target.checked)}
                  />
                  <span className="font-medium">{document.title}</span>
                  <span className="text-muted-foreground">({document.type})</span>
                </label>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No documents available. Upload documents in Finance Docs first.
              </p>
            )}
          </div>
        </div>
        {statusMessage ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {statusMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errorMessage}
          </div>
        ) : null}
        <Tabs value={tab} onValueChange={(value) => setTab(value as AssetTab)}>
          <TabsList>
            {TABS.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="register" className="mt-4">
            <DataTableShell total={filteredAssets.length} page={1} pageSize={10}>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Asset</th>
                    <th className="p-3 text-left">Class</th>
                    <th className="p-3 text-left">Location</th>
                    <th className="p-3 text-left">Cost</th>
                    <th className="p-3 text-left">Carrying Value</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="border-t">
                      <td className="p-3 font-medium">{asset.description}</td>
                      <td className="p-3 text-muted-foreground">{asset.assetClass}</td>
                      <td className="p-3 text-muted-foreground">{asset.location}</td>
                      <td className="p-3 text-muted-foreground">{formatAmount(asset.acquisitionCost)}</td>
                      <td className="p-3 text-muted-foreground">
                        {formatAmount(asset.carryingValue, toSafeNumber(asset.acquisitionCost))}
                      </td>
                      <td className="p-3">
                        <ApprovalStatusBadge status={asset.status} />
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {asset.status === "APPROVED_FOR_CAPITALIZATION" ? (
                            <Button size="sm" onClick={() => capitalize(asset.id)}>
                              Capitalize
                            </Button>
                          ) : null}
                          {asset.status === "ACTIVE" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!selectedDocumentIds.length}
                                onClick={() => impairment(asset.id)}
                              >
                                Impair
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!selectedDocumentIds.length}
                                onClick={() =>
                                  revalue(
                                    asset.id,
                                    toSafeNumber(asset.carryingValue, toSafeNumber(asset.acquisitionCost)),
                                  )
                                }
                              >
                                Revalue
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={!selectedDocumentIds.length}
                                onClick={() =>
                                  dispose(
                                    asset.id,
                                    toSafeNumber(asset.carryingValue, toSafeNumber(asset.acquisitionCost)),
                                  )
                                }
                              >
                                Dispose
                              </Button>
                            </>
                          ) : null}
                          <Button size="sm" variant="outline" onClick={() => openAuditPack(asset.id)}>
                            Audit Pack
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableShell>
          </TabsContent>

          <TabsContent value="capex" className="mt-4">
            <DataTableShell total={filteredCapex.length} page={1} pageSize={10}>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Asset</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Department</th>
                    <th className="p-3 text-left">Budget Match</th>
                    <th className="p-3 text-left">Approval Stage</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCapex.map((request) => (
                    <tr key={request.id} className="border-t">
                      <td className="p-3 font-medium">{request.assetDescription}</td>
                      <td className="p-3 text-muted-foreground">{formatAmount(request.requestedAmount)}</td>
                      <td className="p-3 text-muted-foreground">{request.department}</td>
                      <td className="p-3 text-muted-foreground">{request.budgetMatched ? "YES" : "NO"}</td>
                      <td className="p-3 text-muted-foreground">
                        {request.currentApprovalStage ?? "-"}
                      </td>
                      <td className="p-3">
                        <ApprovalStatusBadge status={request.status} />
                      </td>
                      <td className="p-3">
                        {request.status === "PENDING" ||
                        request.status === "PENDING_HOD_APPROVAL" ||
                        request.status === "PENDING_CFO_APPROVAL" ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => approveCapex(request.id)}>
                              {request.currentApprovalStage === "CFO" ? "Approve (CFO)" : "Approve (HOD)"}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectCapex(request.id)}>
                              Reject
                            </Button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableShell>
          </TabsContent>

          <TabsContent value="depreciation" className="mt-4">
            <div className="mb-4 grid gap-3 rounded-lg border p-3 md:grid-cols-4">
              <Input
                type="date"
                value={runForm.periodStart}
                onChange={(event) =>
                  setRunForm({ ...runForm, periodStart: event.target.value })
                }
              />
              <Input
                type="date"
                value={runForm.periodEnd}
                onChange={(event) =>
                  setRunForm({ ...runForm, periodEnd: event.target.value })
                }
              />
              <Input
                type="date"
                value={runForm.postingDate}
                onChange={(event) =>
                  setRunForm({ ...runForm, postingDate: event.target.value })
                }
              />
              <Button onClick={runScheduledDepreciation}>Run Scheduled Period Depreciation</Button>
            </div>
            {runResult ? (
              <div className="mb-4 grid gap-3 rounded-lg border p-3 text-sm md:grid-cols-5">
                <div>
                  <p className="text-xs text-muted-foreground">Run</p>
                  <p className="font-medium">{runResult.runId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Period</p>
                  <p className="font-medium">
                    {runResult.periodStart} to {runResult.periodEnd}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Posting date</p>
                  <p className="font-medium">{runResult.postingDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Posted entries</p>
                  <p className="font-medium">{runResult.postedEntries}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Skipped assets</p>
                  <p className="font-medium">{runResult.skippedAssetIds.length}</p>
                </div>
              </div>
            ) : null}
            <DataTableShell total={depreciationEntries.length} page={1} pageSize={10}>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Asset</th>
                    <th className="p-3 text-left">Posting Date</th>
                    <th className="p-3 text-left">Method</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Accumulated</th>
                    <th className="p-3 text-left">Carrying Value</th>
                  </tr>
                </thead>
                <tbody>
                  {depreciationEntries.map((entry) => (
                    <tr key={entry.id} className="border-t">
                      <td className="p-3">{entry.assetId}</td>
                      <td className="p-3 text-muted-foreground">{entry.postingDate}</td>
                      <td className="p-3 text-muted-foreground">{entry.method}</td>
                      <td className="p-3 text-muted-foreground">{formatAmount(entry.amount)}</td>
                      <td className="p-3 text-muted-foreground">{formatAmount(entry.accumulatedDepreciation)}</td>
                      <td className="p-3 text-muted-foreground">{formatAmount(entry.carryingValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableShell>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <DataTableShell total={assetEvents.length} page={1} pageSize={10}>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Asset</th>
                    <th className="p-3 text-left">Journal</th>
                    <th className="p-3 text-left">Attachments</th>
                    <th className="p-3 text-left">Approved By</th>
                    <th className="p-3 text-left">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {assetEvents.map((event) => (
                    <tr key={event.id} className="border-t">
                      <td className="p-3">{event.type}</td>
                      <td className="p-3 text-muted-foreground">{event.assetId}</td>
                      <td className="p-3 text-muted-foreground">{event.journalEntryId}</td>
                      <td className="p-3 text-muted-foreground">{event.attachmentDocumentIds.join(", ")}</td>
                      <td className="p-3 text-muted-foreground">{event.approvedBy}</td>
                      <td className="p-3 text-muted-foreground">{event.createdAt.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableShell>
          </TabsContent>
        </Tabs>
      </WorkspacePanel>

      {selectedAudit ? (
        <WorkspacePanel
          title="Audit Pack Summary"
          description="Evidence footprint generated for selected asset."
        >
          <div className="grid gap-3 sm:grid-cols-4 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Asset</p>
              <p className="font-medium">{selectedAudit.assetId}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">CAPEX status</p>
              <p className="font-medium">{selectedAudit.capexRequest?.status ?? "N/A"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Depreciation entries</p>
              <p className="font-medium">{selectedAudit.depreciationEntries.length}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Lifecycle events</p>
              <p className="font-medium">{selectedAudit.events.length}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Evidence items</p>
              <p className="font-medium">{selectedAudit.evidence.length}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Checksum</p>
              <p className="font-medium">{selectedAudit.checksum}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Signature</p>
              <p className="font-medium">{selectedAudit.signature}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadAuditPack(selectedAudit.assetId, "JSON")}
            >
              Download JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadAuditPack(selectedAudit.assetId, "PDF")}
            >
              Download PDF
            </Button>
          </div>
        </WorkspacePanel>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create CAPEX Request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Asset Description"
              value={capexForm.assetDescription}
              onChange={(event) =>
                setCapexForm({ ...capexForm, assetDescription: event.target.value })
              }
            />
            <Select
              value={capexForm.assetClass}
              onValueChange={(value) =>
                setCapexForm({ ...capexForm, assetClass: value as FixedAsset["assetClass"] })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Asset Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LAND">Land</SelectItem>
                <SelectItem value="BUILDING">Building</SelectItem>
                <SelectItem value="MACHINERY">Machinery</SelectItem>
                <SelectItem value="VEHICLE">Vehicle</SelectItem>
                <SelectItem value="FURNITURE">Furniture</SelectItem>
                <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                <SelectItem value="SOFTWARE">Software</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Requested Amount"
              type="number"
              value={capexForm.requestedAmount}
              onChange={(event) =>
                setCapexForm({ ...capexForm, requestedAmount: Number(event.target.value) })
              }
            />
            <Input
              placeholder="Department"
              value={capexForm.department}
              onChange={(event) =>
                setCapexForm({ ...capexForm, department: event.target.value })
              }
            />
            <Input
              placeholder="Project Code (optional)"
              value={capexForm.projectCode}
              onChange={(event) =>
                setCapexForm({ ...capexForm, projectCode: event.target.value })
              }
            />
            <Input
              placeholder="Location"
              value={capexForm.location}
              onChange={(event) =>
                setCapexForm({ ...capexForm, location: event.target.value })
              }
            />
            <Input
              placeholder="Acquisition Date"
              type="date"
              value={capexForm.acquisitionDate}
              onChange={(event) =>
                setCapexForm({ ...capexForm, acquisitionDate: event.target.value })
              }
            />
            <Input
              placeholder="Useful Life (Years)"
              type="number"
              value={capexForm.usefulLifeYears}
              onChange={(event) =>
                setCapexForm({ ...capexForm, usefulLifeYears: Number(event.target.value) })
              }
            />
            <Input
              placeholder="Residual Value"
              type="number"
              value={capexForm.residualValue}
              onChange={(event) =>
                setCapexForm({ ...capexForm, residualValue: Number(event.target.value) })
              }
            />
            <Select
              value={capexForm.depreciationMethod}
              onValueChange={(value) =>
                setCapexForm({
                  ...capexForm,
                  depreciationMethod: value as DepreciationMethod,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Depreciation Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STRAIGHT_LINE">Straight Line</SelectItem>
                <SelectItem value="DECLINING_BALANCE">Declining Balance</SelectItem>
                <SelectItem value="UNIT_OF_PRODUCTION">Unit of Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={createCapex}>Submit CAPEX and Route</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
