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
import { FeedbackAlert } from "@/core/tools/FeedbackAlert";
import { useSession } from "@/core/security/session";
import { procurementService } from "@/core/services/procurement/procurementService";
import type { SupplierPortalMessage, SupplierMaster, SupplierBranch } from "@/core/types/procurement/procurement";

export default function SupplierPortalDesk() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [supplierBranchId, setSupplierBranchId] = useState("");
  const [type, setType] = useState<SupplierPortalMessage["type"]>("GENERAL");
  const [direction, setDirection] = useState<SupplierPortalMessage["direction"]>("OUTBOUND");
  const [content, setContent] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [messages, setMessages] = useState<SupplierPortalMessage[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierMaster[]>([]);
  const [branches, setBranches] = useState<SupplierBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearStatus = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [msg, sup, br] = await Promise.all([
        procurementService.listPortalMessages(session.tenantId, session),
        procurementService.listSupplierMasters(session.tenantId, session),
        procurementService.listSupplierBranches(session.tenantId, session),
      ]);
      setMessages(msg);
      setSuppliers(sup);
      setBranches(br);
    } catch (err) {
      setErrorMessage("Failed to load portal data.");
    } finally {
      setLoading(false);
    }
  }, [session.tenantId, session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(
    () =>
      messages.filter((item) =>
        search
          ? `${item.type} ${item.content} ${item.supplierId}`.toLowerCase().includes(search.toLowerCase())
          : true,
      ),
    [messages, search],
  );

  const createMessage = async () => {
    if (!supplierId || !supplierBranchId || !content.trim()) return;
    try {
      await procurementService.createPortalMessage(session.tenantId, session, {
        supplierId,
        supplierBranchId,
        direction,
        type,
        content,
        attachmentName: attachmentName || undefined,
      });
      setStatusMessage("Portal message sent to supplier.");
      setDialogOpen(false);
      setContent("");
      setAttachmentName("");
      refresh();
    } catch (err) {
      setErrorMessage("Failed to send portal message.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Portal"
        subtitle="Bi-directional supplier communication for quote, invoice, proof, and dispute exchange."
        primaryAction={<Button onClick={() => setDialogOpen(true)}>Create Portal Message</Button>}
        secondaryActions={
          <Input
            placeholder="Search portal messages"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <FeedbackAlert message={statusMessage} error={errorMessage} onClear={clearStatus} />

      <WorkspacePanel title="Portal Inbox" description="Auditable supplier interaction timeline.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Timestamp</th>
                <th className="p-3 text-left">Supplier</th>
                <th className="p-3 text-left">Branch</th>
                <th className="p-3 text-left">Direction</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Content</th>
                <th className="p-3 text-left">Attachment</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-3 text-center italic">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-3 text-center text-muted-foreground">No portal messages found.</td></tr>
              ) : (
                filtered.map((message) => (
                  <tr key={message.id} className="border-t">
                    <td className="p-3 text-muted-foreground">{message.createdAt.slice(0, 16).replace("T", " ")}</td>
                    <td className="p-3 text-muted-foreground">{message.supplierId}</td>
                    <td className="p-3 text-muted-foreground">{message.supplierBranchId}</td>
                    <td className="p-3 text-muted-foreground">{message.direction}</td>
                    <td className="p-3 text-muted-foreground">{message.type}</td>
                    <td className="p-3">{message.content}</td>
                    <td className="p-3 text-muted-foreground">{message.attachmentName ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Supplier Portal Message</DialogTitle>
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
              <Select value={direction} onValueChange={(value) => setDirection(value as SupplierPortalMessage["direction"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTBOUND">OUTBOUND</SelectItem>
                  <SelectItem value="INBOUND">INBOUND</SelectItem>
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={(value) => setType(value as SupplierPortalMessage["type"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUOTE">QUOTE</SelectItem>
                  <SelectItem value="INVOICE">INVOICE</SelectItem>
                  <SelectItem value="DELIVERY_PROOF">DELIVERY_PROOF</SelectItem>
                  <SelectItem value="DISPUTE">DISPUTE</SelectItem>
                  <SelectItem value="GENERAL">GENERAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Content" value={content} onChange={(event) => setContent(event.target.value)} />
            <Input
              placeholder="Attachment Name (optional)"
              value={attachmentName}
              onChange={(event) => setAttachmentName(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={createMessage}>Send Message</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

