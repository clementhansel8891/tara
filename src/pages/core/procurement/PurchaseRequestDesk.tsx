import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";
import { useSession } from "@/core/security/session";
import { procurementService } from "@/core/services/procurement/procurementService";
import type { DraftPurchaseOrder, Requisition } from "@/core/types/procurement/procurement";

export default function PurchaseRequestDesk() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [selectedRequisitionId, setSelectedRequisitionId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Machinery");
  const [branchCode, setBranchCode] = useState("JKT");
  const [budgetClass, setBudgetClass] = useState<Requisition["budgetClass"]>("OPEX");
  const [amount, setAmount] = useState("0");
  const [contractRequired, setContractRequired] = useState<"YES" | "NO">("YES");
  const [supplierId, setSupplierId] = useState("");
  const [supplierBranchId, setSupplierBranchId] = useState("");
  const [lineSku, setLineSku] = useState("");
  const [lineDescription, setLineDescription] = useState("");
  const [lineQuantity, setLineQuantity] = useState("1");
  const [linePrice, setLinePrice] = useState("0");
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [draftPos, setDraftPos] = useState<DraftPurchaseOrder[]>([]);
  const suppliers = procurementService.listSupplierMasters(session.tenantId);
  const branches = procurementService.listSupplierBranches(session.tenantId);

  const refresh = useCallback(() => {
    setRequisitions(procurementService.listRequisitions(session.tenantId));
    setDraftPos(procurementService.listDraftPurchaseOrders(session.tenantId));
  }, [session.tenantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(
    () =>
      requisitions.filter((item) =>
        search
          ? `${item.id} ${item.title} ${item.requesterDept}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true,
      ),
    [requisitions, search],
  );

  const createRequisition = () => {
    procurementService.createRequisition(session.tenantId, session, {
      title,
      description,
      category,
      branchCode,
      budgetClass,
      amount: Number(amount || "0"),
      contractRequired: contractRequired === "YES",
    });
    setRequestDialogOpen(false);
    setTitle("");
    setDescription("");
    setCategory("Machinery");
    setAmount("0");
    refresh();
  };

  const approveRequesterHod = (requisitionId: string) => {
    procurementService.approveRequesterHod(session.tenantId, session, requisitionId);
    refresh();
  };

  const buildDraftPo = () => {
    procurementService.buildDraftPurchaseOrder(session.tenantId, session, {
      requisitionId: selectedRequisitionId,
      supplierId,
      supplierBranchId,
      contractType: "SPOT",
      lineItems: [
        {
          productSku: lineSku || "GEN-ITEM",
          description: lineDescription || "Procurement line item",
          quantity: Number(lineQuantity || "1"),
          uom: "EA",
          unitPrice: Number(linePrice || "0"),
        },
      ],
    });
    setDraftDialogOpen(false);
    setSelectedRequisitionId("");
    setSupplierId("");
    setSupplierBranchId("");
    setLineSku("");
    setLineDescription("");
    setLineQuantity("1");
    setLinePrice("0");
    refresh();
  };

  const approveDraft = (draftId: string) => {
    procurementService.approveDraftByProcurementHod(session.tenantId, session, draftId);
    refresh();
  };

  const setFinal = (requisitionId: string, approver: "REQUESTER_HOD" | "PROCUREMENT_HOD" | "FINANCE_HOD") => {
    procurementService.setFinalApproval(session.tenantId, session, requisitionId, approver);
    refresh();
  };

  const runRiskScan = () => {
    procurementService.runRiskScan(session.tenantId, session);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requisition Desk"
        subtitle="Department requests with mandatory requester HOD gate and staged procurement approvals."
        primaryAction={<Button onClick={() => setRequestDialogOpen(true)}>Create Requisition</Button>}
        secondaryActions={
          <Input
            placeholder="Search requisitions"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Requisition Queue" description="End-to-end request pipeline before PO release.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Request</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Branch</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.id}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">{item.requesterDept}</td>
                  <td className="p-3 text-muted-foreground">{item.branchCode}</td>
                  <td className="p-3 text-muted-foreground">{item.amount.toLocaleString()}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={item.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {item.status === "PENDING_REQUESTER_HOD" ? (
                        <Button size="sm" variant="outline" onClick={() => approveRequesterHod(item.id)}>
                          Approve Requester HOD
                        </Button>
                      ) : null}
                      {(item.status === "APPROVED_REQUESTER_HOD" || item.status === "DRAFT_PO_PREPARED") ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequisitionId(item.id);
                            setDraftDialogOpen(true);
                          }}
                        >
                          Build Draft PO
                        </Button>
                      ) : null}
                      {(item.status === "LEGAL_APPROVED" || item.status === "FINAL_APPROVAL_PENDING") ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setFinal(item.id, "REQUESTER_HOD")}>
                            Final Requester HOD
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setFinal(item.id, "PROCUREMENT_HOD")}>
                            Final Procurement HOD
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setFinal(item.id, "FINANCE_HOD")}>
                            Final Finance HOD
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <WorkspacePanel title="Draft PO Gate" description="Procurement HOD draft gate and quote readiness check.">
        <DataTableShell total={draftPos.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Draft PO</th>
                <th className="p-3 text-left">Requisition</th>
                <th className="p-3 text-left">Supplier</th>
                <th className="p-3 text-left">Quoted Total</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {draftPos.map((draft) => (
                <tr key={draft.id} className="border-t">
                  <td className="p-3 font-medium">{draft.id}</td>
                  <td className="p-3 text-muted-foreground">{draft.requisitionId}</td>
                  <td className="p-3 text-muted-foreground">{draft.supplierId}</td>
                  <td className="p-3 text-muted-foreground">{draft.quotedTotal.toLocaleString()}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={draft.status} />
                  </td>
                  <td className="p-3">
                    {draft.status === "DRAFT" ? (
                      <Button size="sm" variant="outline" onClick={() => approveDraft(draft.id)}>
                        Approve Draft Gate
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <WorkspacePanel title="Governance Controls" description="Anti-fraud scan and approval-control checks.">
        <div className="flex gap-2">
          <Button variant="outline" onClick={runRiskScan}>
            Run Risk Scan
          </Button>
        </div>
      </WorkspacePanel>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Requisition</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Textarea placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Category" value={category} onChange={(event) => setCategory(event.target.value)} />
              <Input placeholder="Branch Code" value={branchCode} onChange={(event) => setBranchCode(event.target.value.toUpperCase())} />
              <Select value={budgetClass} onValueChange={(value) => setBudgetClass(value as Requisition["budgetClass"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Budget Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEX">OPEX</SelectItem>
                  <SelectItem value="CAPEX">CAPEX</SelectItem>
                  <SelectItem value="EMERGENCY">EMERGENCY</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
              <Select value={contractRequired} onValueChange={(value) => setContractRequired(value as "YES" | "NO")}>
                <SelectTrigger>
                  <SelectValue placeholder="Contract Required" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES">Contract Required</SelectItem>
                  <SelectItem value="NO">No Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={createRequisition}>Create and Route</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={draftDialogOpen} onOpenChange={setDraftDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Build Draft PO</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={supplierBranchId} onValueChange={setSupplierBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Supplier Branch" />
              </SelectTrigger>
              <SelectContent>
                {branches
                  .filter((branch) => (supplierId ? branch.supplierId === supplierId : true))
                  .map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.branchCode} - {branch.branchName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Line SKU" value={lineSku} onChange={(event) => setLineSku(event.target.value)} />
              <Input
                placeholder="Line Description"
                value={lineDescription}
                onChange={(event) => setLineDescription(event.target.value)}
              />
              <Input
                placeholder="Quantity"
                type="number"
                value={lineQuantity}
                onChange={(event) => setLineQuantity(event.target.value)}
              />
              <Input
                placeholder="Unit Price"
                type="number"
                value={linePrice}
                onChange={(event) => setLinePrice(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={buildDraftPo}>Create Draft PO</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

