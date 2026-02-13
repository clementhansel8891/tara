import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";
import { useSession } from "@/core/security/session";
import { procurementService } from "@/core/services/procurement/procurementService";
import type { ContractRecord, Requisition } from "@/core/types/procurement/procurement";

export default function ContractDesk() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requisitionId, setRequisitionId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);

  const suppliers = procurementService.listSupplierMasters(session.tenantId);

  const refresh = useCallback(() => {
    setContracts(procurementService.listContracts(session.tenantId));
    setRequisitions(procurementService.listRequisitions(session.tenantId));
  }, [session.tenantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredContracts = useMemo(
    () =>
      contracts.filter((item) =>
        search
          ? `${item.id} ${item.requisitionId} ${item.supplierId}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true,
      ),
    [contracts, search],
  );

  const upsertContract = () => {
    if (!requisitionId || !supplierId) return;
    procurementService.upsertContractForRequisition(session.tenantId, session, {
      requisitionId,
      supplierId,
      notes,
      attachmentIds: [],
    });
    setDialogOpen(false);
    setRequisitionId("");
    setSupplierId("");
    setNotes("");
    refresh();
  };

  const approveLegal = (contractId: string) => {
    procurementService.approveLegalContract(session.tenantId, session, contractId);
    refresh();
  };

  const sign = (contractId: string, party: "SUPPLIER" | "PROCUREMENT_HOD" | "FINANCE_HOD") => {
    procurementService.signContractParty(session.tenantId, session, contractId, party);
    refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract Desk"
        subtitle="Legal collaboration, signature control, and procurement contract governance."
        primaryAction={<Button onClick={() => setDialogOpen(true)}>Create Contract Packet</Button>}
        secondaryActions={
          <Input
            placeholder="Search contracts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Contract Governance" description="Track legal review and mandatory signatures before PO release.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filteredContracts.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Contract</th>
                <th className="p-3 text-left">Requisition</th>
                <th className="p-3 text-left">Supplier</th>
                <th className="p-3 text-left">Version</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="border-t">
                  <td className="p-3 font-medium">{contract.id}</td>
                  <td className="p-3 text-muted-foreground">{contract.requisitionId}</td>
                  <td className="p-3 text-muted-foreground">{contract.supplierId}</td>
                  <td className="p-3 text-muted-foreground">v{contract.version}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={contract.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {contract.status === "LEGAL_REVIEW" ? (
                        <Button size="sm" variant="outline" onClick={() => approveLegal(contract.id)}>
                          Approve Legal
                        </Button>
                      ) : null}
                      {contract.status === "LEGAL_APPROVED" ? (
                        <>
                          {!contract.signedBySupplier ? (
                            <Button size="sm" variant="outline" onClick={() => sign(contract.id, "SUPPLIER")}>
                              Supplier Sign
                            </Button>
                          ) : null}
                          {!contract.signedByProcurementHod ? (
                            <Button size="sm" variant="outline" onClick={() => sign(contract.id, "PROCUREMENT_HOD")}>
                              Procurement HOD Sign
                            </Button>
                          ) : null}
                          {!contract.signedByFinanceHod ? (
                            <Button size="sm" variant="outline" onClick={() => sign(contract.id, "FINANCE_HOD")}>
                              Finance HOD Sign
                            </Button>
                          ) : null}
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

      <WorkspacePanel title="Signature Completeness" description="Mandatory signatures: Supplier + Procurement HOD + Finance HOD.">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Legal Approved</p>
            <p className="text-lg font-semibold">
              {contracts.filter((item) => item.status === "LEGAL_APPROVED" || item.status === "SIGNED").length}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Signed</p>
            <p className="text-lg font-semibold">{contracts.filter((item) => item.status === "SIGNED").length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Pending Legal Review</p>
            <p className="text-lg font-semibold">{contracts.filter((item) => item.status === "LEGAL_REVIEW").length}</p>
          </div>
        </div>
      </WorkspacePanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create or Update Contract Packet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={requisitionId} onValueChange={setRequisitionId}>
              <SelectTrigger>
                <SelectValue placeholder="Requisition" />
              </SelectTrigger>
              <SelectContent>
                {requisitions.map((request) => (
                  <SelectItem key={request.id} value={request.id}>
                    {request.id} - {request.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Textarea placeholder="Contract Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            <div className="flex justify-end gap-2">
              <Button onClick={upsertContract}>Save Contract Packet</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

