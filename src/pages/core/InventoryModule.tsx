import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/core/ui/PageShell";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { useSession } from "@/core/security/session";
import { procurementService } from "@/core/services/procurement/procurementService";
import { AlertTriangle, ClipboardCheck, PackageSearch, Truck } from "lucide-react";

const policyItems = [
  {
    id: "pol-1",
    label: "Safety stock thresholds",
    detail: "Minimum cover by location and category.",
    status: "Enforced",
  },
  {
    id: "pol-2",
    label: "Cycle count cadence",
    detail: "Weekly for fast-movers, monthly for long-tail.",
    status: "Scheduled",
  },
  {
    id: "pol-3",
    label: "Spoilage controls",
    detail: "Auto-flag items approaching expiry.",
    status: "Active",
  },
];

const exceptionsQueue = [
  {
    id: "exc-1",
    title: "Negative stock detected",
    detail: "Retail Store #14 — SKU COF-221",
    severity: "High",
    age: "18 minutes ago",
  },
  {
    id: "exc-2",
    title: "Cycle count variance",
    detail: "Warehouse East — SKU DRY-442",
    severity: "Medium",
    age: "2 hours ago",
  },
  {
    id: "exc-3",
    title: "Slow-moving stock alert",
    detail: "Cafe Cluster North — 24 items idle 45 days",
    severity: "Low",
    age: "Today, 07:10",
  },
];

const transferRequests = [
  {
    id: "tr-1",
    origin: "Warehouse East",
    destination: "Retail Store #14",
    items: "82 units",
    status: "Awaiting dispatch",
  },
  {
    id: "tr-2",
    origin: "Central Storage",
    destination: "Cafe Cluster North",
    items: "36 units",
    status: "In review",
  },
];

export default function InventoryModule() {
  const session = useSession();
  const [, setVersion] = useState(0);
  const procurementReceipts = procurementService.listGoodsReceiptSyncs(session.tenantId);

  return (
    <PageShell
      header={
        <PageHeader
          title="Inventory Governance"
          subtitle="Policy enforcement, exception monitoring, and audit-ready oversight."
          primaryAction={<Button>New transfer request</Button>}
          secondaryActions={<Button variant="outline">Export audit pack</Button>}
        />
      }
    >
      <div className="space-y-6">
        <WorkspacePanel
          title="Procurement goods receipt sync"
          description="Expected PO deliveries synchronized from Procurement release."
        >
          <div className="space-y-3">
            {procurementReceipts.length === 0 ? (
              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                No procurement delivery sync records yet.
              </p>
            ) : (
              procurementReceipts.slice(0, 8).map((sync) => (
                <div key={sync.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      PO {sync.finalPoId} | Branch {sync.branchCode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {sync.status} | Issues: {sync.issueCount}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        procurementService.updateGoodsReceiptSyncStatus(
                          session.tenantId,
                          session,
                          sync.id,
                          {
                            status: "SYNCED",
                            issueCount: 0,
                            invoiceMismatch: false,
                          },
                        );
                        setVersion((prev) => prev + 1);
                      }}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        procurementService.updateGoodsReceiptSyncStatus(
                          session.tenantId,
                          session,
                          sync.id,
                          {
                            status: "MISMATCH_REPORTED",
                            issueCount: Math.max(sync.issueCount, 1),
                            invoiceMismatch: sync.invoiceMismatch,
                          },
                        );
                        setVersion((prev) => prev + 1);
                      }}
                    >
                      Report mismatch
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Stock policy overview"
          description="Governance controls applied across all inventories."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {policyItems.map((policy) => (
              <div key={policy.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {policy.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{policy.detail}</p>
                  </div>
                  <Badge variant="secondary">{policy.status}</Badge>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <ClipboardCheck className="h-4 w-4" />
                  Policy active
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <WorkspacePanel
            title="Inventory exceptions"
            description="Issues requiring reconciliation or action."
          >
            <div className="space-y-4">
              {exceptionsQueue.map((exception) => (
                <div key={exception.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {exception.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exception.detail}
                      </p>
                    </div>
                    <Badge variant="outline">{exception.severity}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {exception.age}
                    </div>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Transfer requests"
            description="Pending stock transfers across locations."
          >
            <div className="space-y-4">
              {transferRequests.map((request) => (
                <div key={request.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {request.origin} → {request.destination}
                      </p>
                      <p className="text-xs text-muted-foreground">{request.items}</p>
                    </div>
                    <Badge variant="secondary">{request.status}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Transfer workflow
                    </div>
                    <Button size="sm" variant="outline">
                      Open
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PackageSearch className="h-4 w-4" />
                  Create a new inter-warehouse transfer request
                </div>
                <Button size="sm">Create</Button>
              </div>
            </div>
          </WorkspacePanel>
        </div>
      </div>
    </PageShell>
  );
}
