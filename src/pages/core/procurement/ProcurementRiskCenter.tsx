import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";
import { useSession } from "@/core/security/session";
import { procurementService } from "@/core/services/procurement/procurementService";
import type {
  GoodsReceiptSyncRecord,
  LegalContractHandoff,
  ProcurementAuditEvent,
  RiskSignal,
  SupplierAccessProvisioning,
} from "@/core/types/procurement/procurement";

const hoursSince = (timestamp: string) =>
  Math.max(0, (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60));

const formatAge = (hours: number) => {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
};

const isLegalSlaBreached = (handoff: LegalContractHandoff) =>
  handoff.status !== "CONTRACT_ACCEPTED" && hoursSince(handoff.createdAt) > 8;

const isInventorySlaBreached = (sync: GoodsReceiptSyncRecord) =>
  sync.status === "PENDING_RECEIPT" && hoursSince(sync.createdAt) > 24;

const isProvisioningSlaBreached = (request: SupplierAccessProvisioning) =>
  request.status === "REQUESTED" && hoursSince(request.createdAt) > 4;

export default function ProcurementRiskCenter() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [signals, setSignals] = useState<RiskSignal[]>([]);
  const [auditEvents, setAuditEvents] = useState<ProcurementAuditEvent[]>([]);
  const [legalHandoffs, setLegalHandoffs] = useState<LegalContractHandoff[]>([]);
  const [goodsReceiptSyncs, setGoodsReceiptSyncs] = useState<GoodsReceiptSyncRecord[]>([]);
  const [supplierAccess, setSupplierAccess] = useState<SupplierAccessProvisioning[]>([]);

  const refresh = useCallback(() => {
    setSignals(procurementService.listRiskSignals(session.tenantId));
    setAuditEvents(procurementService.listAuditEvents(session.tenantId));
    setLegalHandoffs(procurementService.listLegalHandoffs(session.tenantId));
    setGoodsReceiptSyncs(procurementService.listGoodsReceiptSyncs(session.tenantId));
    setSupplierAccess(procurementService.listSupplierAccessProvisioning(session.tenantId));
  }, [session.tenantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(
    () =>
      signals.filter((item) =>
        search
          ? `${item.code} ${item.detail} ${item.entityId}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true,
      ),
    [signals, search],
  );

  const handoffRows = useMemo(() => {
    const legalRows = legalHandoffs
      .filter((item) => item.status !== "CONTRACT_ACCEPTED")
      .map((item) => {
        const ageHours = hoursSince(item.createdAt);
        return {
          id: item.id,
          workspace: "LEGAL",
          reference: item.contractId,
          status: item.status,
          ageLabel: formatAge(ageHours),
          slaBreached: isLegalSlaBreached(item),
          ageHours,
        };
      });
    const inventoryRows = goodsReceiptSyncs
      .filter((item) => item.status === "PENDING_RECEIPT")
      .map((item) => {
        const ageHours = hoursSince(item.createdAt);
        return {
          id: item.id,
          workspace: "INVENTORY",
          reference: item.finalPoId,
          status: item.status,
          ageLabel: formatAge(ageHours),
          slaBreached: isInventorySlaBreached(item),
          ageHours,
        };
      });
    const provisioningRows = supplierAccess
      .filter((item) => item.status === "REQUESTED")
      .map((item) => {
        const ageHours = hoursSince(item.createdAt);
        return {
          id: item.id,
          workspace: "IT",
          reference: `${item.supplierId}/${item.supplierBranchId}`,
          status: item.status,
          ageLabel: formatAge(ageHours),
          slaBreached: isProvisioningSlaBreached(item),
          ageHours,
        };
      });
    return [...legalRows, ...inventoryRows, ...provisioningRows].sort(
      (a, b) => b.ageHours - a.ageHours,
    );
  }, [goodsReceiptSyncs, legalHandoffs, supplierAccess]);

  const handoffSummary = useMemo(() => {
    const legalPending = legalHandoffs.filter((item) => item.status !== "CONTRACT_ACCEPTED").length;
    const inventoryPending = goodsReceiptSyncs.filter((item) => item.status === "PENDING_RECEIPT").length;
    const itPending = supplierAccess.filter((item) => item.status === "REQUESTED").length;
    const breached = handoffRows.filter((item) => item.slaBreached).length;
    return { legalPending, inventoryPending, itPending, breached };
  }, [goodsReceiptSyncs, handoffRows, legalHandoffs, supplierAccess]);

  const runScan = () => {
    procurementService.runRiskScan(session.tenantId, session);
    refresh();
  };

  const setStatus = (riskSignalId: string, status: RiskSignal["status"]) => {
    procurementService.setRiskSignalStatus(session.tenantId, session, riskSignalId, status);
    refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk and Compliance"
        subtitle="Anti-fraud risk monitoring for price anomalies, approval bypass, and supplier risk degradation."
        primaryAction={<Button onClick={runScan}>Run Risk Scan</Button>}
        secondaryActions={
          <Input
            placeholder="Search risk signals"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Risk Signals" description="Open and historical procurement risk alerts.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Signal</th>
                <th className="p-3 text-left">Severity</th>
                <th className="p-3 text-left">Entity</th>
                <th className="p-3 text-left">Detail</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((signal) => (
                <tr key={signal.id} className="border-t">
                  <td className="p-3 font-medium">{signal.code}</td>
                  <td className="p-3 text-muted-foreground">{signal.severity}</td>
                  <td className="p-3 text-muted-foreground">{signal.entityId}</td>
                  <td className="p-3">{signal.detail}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={signal.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {signal.status === "OPEN" ? (
                        <Button size="sm" variant="outline" onClick={() => setStatus(signal.id, "ACKNOWLEDGED")}>
                          Acknowledge
                        </Button>
                      ) : null}
                      {signal.status !== "RESOLVED" ? (
                        <Button size="sm" onClick={() => setStatus(signal.id, "RESOLVED")}>
                          Resolve
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <WorkspacePanel title="Cross-Workspace Handoff SLA" description="Legal, Inventory, and IT queue SLA monitoring.">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Legal pending</p>
            <p className="text-2xl font-semibold">{handoffSummary.legalPending}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Inventory pending receipt</p>
            <p className="text-2xl font-semibold">{handoffSummary.inventoryPending}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">IT provisioning pending</p>
            <p className="text-2xl font-semibold">{handoffSummary.itPending}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">SLA breached handoffs</p>
            <p className="text-2xl font-semibold">{handoffSummary.breached}</p>
          </div>
        </div>
        <DataTableShell total={handoffRows.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Workspace</th>
                <th className="p-3 text-left">Reference</th>
                <th className="p-3 text-left">Queue Status</th>
                <th className="p-3 text-left">Age</th>
                <th className="p-3 text-left">SLA</th>
              </tr>
            </thead>
            <tbody>
              {handoffRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-muted-foreground" colSpan={5}>
                    No cross-workspace handoff backlog.
                  </td>
                </tr>
              ) : (
                handoffRows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-3 font-medium">{row.workspace}</td>
                    <td className="p-3 text-muted-foreground">{row.reference}</td>
                    <td className="p-3">{row.status}</td>
                    <td className="p-3">{row.ageLabel}</td>
                    <td className="p-3">
                      <Badge variant={row.slaBreached ? "destructive" : "outline"}>
                        {row.slaBreached ? "BREACHED" : "WITHIN_SLA"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <WorkspacePanel title="Audit Trail" description="Immutable event history for procurement operations and controls.">
        <DataTableShell total={auditEvents.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Timestamp</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Entity</th>
                <th className="p-3 text-left">Detail</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.map((event) => (
                <tr key={event.id} className="border-t">
                  <td className="p-3 text-muted-foreground">{event.createdAt.slice(0, 16).replace("T", " ")}</td>
                  <td className="p-3 font-medium">{event.action}</td>
                  <td className="p-3 text-muted-foreground">
                    {event.entityType} / {event.entityId}
                  </td>
                  <td className="p-3">{event.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>
    </div>
  );
}
