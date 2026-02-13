import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";
import { useSession } from "@/core/security/session";
import { procurementService } from "@/core/services/procurement/procurementService";
import type { DraftPurchaseOrder, FinalPurchaseOrder, Requisition } from "@/core/types/procurement/procurement";

export default function PoReleaseDesk() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const [quoteReference, setQuoteReference] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [drafts, setDrafts] = useState<DraftPurchaseOrder[]>([]);
  const [finalPos, setFinalPos] = useState<FinalPurchaseOrder[]>([]);

  const refresh = useCallback(() => {
    setRequisitions(procurementService.listRequisitions(session.tenantId));
    setDrafts(procurementService.listDraftPurchaseOrders(session.tenantId));
    setFinalPos(procurementService.listFinalPurchaseOrders(session.tenantId));
  }, [session.tenantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredRequisitions = useMemo(
    () =>
      requisitions.filter((item) =>
        search
          ? `${item.id} ${item.title} ${item.status}`.toLowerCase().includes(search.toLowerCase())
          : true,
      ),
    [requisitions, search],
  );

  const filteredDrafts = useMemo(
    () =>
      drafts.filter((item) =>
        search
          ? `${item.id} ${item.requisitionId} ${item.status}`.toLowerCase().includes(search.toLowerCase())
          : true,
      ),
    [drafts, search],
  );

  const filteredFinalPos = useMemo(
    () =>
      finalPos.filter((item) =>
        search
          ? `${item.id} ${item.requisitionId} ${item.status}`.toLowerCase().includes(search.toLowerCase())
          : true,
      ),
    [finalPos, search],
  );

  const confirmQuote = () => {
    if (!selectedDraftId) return;
    procurementService.confirmSupplierQuote(session.tenantId, session, {
      draftPoId: selectedDraftId,
      quoteReference: quoteReference || `Q-${Date.now()}`,
      quoteNotes,
    });
    setQuoteDialogOpen(false);
    setSelectedDraftId("");
    setQuoteReference("");
    setQuoteNotes("");
    refresh();
  };

  const releasePo = (requisitionId: string) => {
    procurementService.releasePurchaseOrder(session.tenantId, session, requisitionId);
    refresh();
  };

  const recordReceipt = (finalPoId: string) => {
    procurementService.recordReceipt(session.tenantId, session, {
      finalPoId,
      deliveryOnTime: true,
      quantityAccuracy: 96,
      qualityScore: 92,
      issueCount: 0,
      invoiceMismatch: false,
    });
    refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="PO Release Desk"
        subtitle="Supplier quote confirmation, final gate checks, PO release, and receipt posting."
        secondaryActions={
          <Input
            placeholder="Search requisition, draft, or PO"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[240px]"
          />
        }
      />

      <WorkspacePanel title="Supplier Quote Gate" description="Procurement HOD approved drafts require supplier quote confirmation.">
        <DataTableShell total={filteredDrafts.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Draft PO</th>
                <th className="p-3 text-left">Requisition</th>
                <th className="p-3 text-left">Quoted Total</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrafts.map((draft) => (
                <tr key={draft.id} className="border-t">
                  <td className="p-3 font-medium">{draft.id}</td>
                  <td className="p-3 text-muted-foreground">{draft.requisitionId}</td>
                  <td className="p-3 text-muted-foreground">{draft.quotedTotal.toLocaleString()}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={draft.status} />
                  </td>
                  <td className="p-3">
                    {draft.status === "PROCUREMENT_HOD_APPROVED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDraftId(draft.id);
                          setQuoteDialogOpen(true);
                        }}
                      >
                        Confirm Supplier Quote
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <WorkspacePanel title="Final Approval and Release" description="Release is allowed only when final multi-HOD approvals are complete.">
        <DataTableShell total={filteredRequisitions.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Requisition</th>
                <th className="p-3 text-left">Branch</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequisitions.map((request) => (
                <tr key={request.id} className="border-t">
                  <td className="p-3 font-medium">{request.id}</td>
                  <td className="p-3 text-muted-foreground">{request.branchCode}</td>
                  <td className="p-3 text-muted-foreground">{request.amount.toLocaleString()}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={request.status} />
                  </td>
                  <td className="p-3">
                    {request.status === "FINAL_APPROVED" ? (
                      <Button size="sm" onClick={() => releasePo(request.id)}>
                        Release PO
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <WorkspacePanel title="Execution Monitoring" description="Released PO execution and receipt capture updates supplier rating engine.">
        <DataTableShell total={filteredFinalPos.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Final PO</th>
                <th className="p-3 text-left">Requisition</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFinalPos.map((po) => (
                <tr key={po.id} className="border-t">
                  <td className="p-3 font-medium">{po.id}</td>
                  <td className="p-3 text-muted-foreground">{po.requisitionId}</td>
                  <td className="p-3 text-muted-foreground">{po.totalAmount.toLocaleString()}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={po.status} />
                  </td>
                  <td className="p-3">
                    {po.status === "RELEASED" || po.status === "DELIVERING" ? (
                      <Button size="sm" variant="outline" onClick={() => recordReceipt(po.id)}>
                        Record Receipt
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Supplier Quote Confirmation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Quote Reference"
              value={quoteReference}
              onChange={(event) => setQuoteReference(event.target.value)}
            />
            <Input
              placeholder="Quote Notes"
              value={quoteNotes}
              onChange={(event) => setQuoteNotes(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={confirmQuote}>Confirm Quote</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

