import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { inventoryService } from "@/core/services/inventory/inventoryService";
import { useSession } from "@/core/security/session";
import type { InventoryStockBalance, InventoryItemMaster } from "@/core/types/inventory/inventory";

interface BatchTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  balances: InventoryStockBalance[];
  onSuccess: () => void;
}

export function BatchTransferDialog({ open, onOpenChange, selectedIds, balances, onSuccess }: BatchTransferDialogProps) {
  const session = useSession();
  const [toLocation, setToLocation] = useState("");
  const [toDepartment, setToDepartment] = useState("");
  const [reason, setReason] = useState("Batch Internal Transfer");
  const [loading, setLoading] = useState(false);

  const selectedBalances = balances.filter(b => selectedIds.includes(b.id));

  const handleBatchTransfer = async () => {
    setLoading(true);
    try {
      // For each item, we perform a transfer. 
      // In a real prod app, we might want a dedicated batch-transfer endpoint in the backend.
      // For now, we'll loop to ensure correctness with existing transactional logic.
      await Promise.all(
        selectedBalances.map(b => 
          inventoryService.recordTransfer(session.tenantId, session, {
            itemId: b.itemId,
            fromLocationCode: b.locationCode,
            fromDepartmentCode: b.departmentCode,
            toLocationCode: toLocation,
            toDepartmentCode: toDepartment,
            quantity: b.quantity, // Transfer all for batch transfer
            reason,
          })
        )
      );
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Batch transfer failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Batch Stock Transfer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded bg-muted p-2 text-xs">
            <p className="font-semibold mb-1">Items to Move ({selectedIds.length}):</p>
            <ul className="list-disc ml-4 opacity-80 max-h-24 overflow-y-auto">
              {selectedBalances.map(b => (
                 <li key={b.id}>{b.itemId} from {b.locationCode}</li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="batch-to-loc">Destination Location</Label>
              <Input 
                id="batch-to-loc" 
                placeholder="Loc Code" 
                value={toLocation} 
                onChange={e => setToLocation(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="batch-to-dept">Destination Dept</Label>
              <Input 
                id="batch-to-dept" 
                placeholder="Dept Code" 
                value={toDepartment} 
                onChange={e => setToDepartment(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="batch-reason">Reason</Label>
            <Input 
              id="batch-reason" 
              placeholder="e.g. Consolidation" 
              value={reason} 
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleBatchTransfer} disabled={loading || !toLocation}>
            {loading ? "Moving..." : "Perform Bulk Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
