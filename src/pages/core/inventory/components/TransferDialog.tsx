import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryService } from "@/core/services/inventory/inventoryService";
import { useSession } from "@/core/security/session";
import type { InventoryStockBalance, InventoryItemMaster } from "@/core/types/inventory/inventory";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBalance: { balance: InventoryStockBalance; item: InventoryItemMaster } | null;
  onSuccess: () => void;
}

export function TransferDialog({ open, onOpenChange, selectedBalance, onSuccess }: TransferDialogProps) {
  const session = useSession();
  const [quantity, setQuantity] = useState(0);
  const [toLocation, setToLocation] = useState("");
  const [toDepartment, setToDepartment] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!selectedBalance) return;
    setLoading(true);
    try {
      await inventoryService.recordTransfer(session.tenantId, session, {
        itemId: selectedBalance.item.id,
        fromLocationCode: selectedBalance.balance.locationCode,
        fromDepartmentCode: selectedBalance.balance.departmentCode,
        toLocationCode: toLocation,
        toDepartmentCode: toDepartment,
        quantity,
        reason,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Transfer failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>Item</Label>
            <div className="rounded bg-muted p-2 text-sm font-medium">
              {selectedBalance?.item.name} ({selectedBalance?.item.sku})
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>From</Label>
            <div className="text-sm text-muted-foreground">
              {selectedBalance?.balance.locationCode} {selectedBalance?.balance.departmentCode && ` - ${selectedBalance.balance.departmentCode}`}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="to-location">Destination Location</Label>
              <Input 
                id="to-location" 
                placeholder="Loc Code" 
                value={toLocation} 
                onChange={e => setToLocation(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="to-dept">Destination Dept</Label>
              <Input 
                id="to-dept" 
                placeholder="Dept Code" 
                value={toDepartment} 
                onChange={e => setToDepartment(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="qty">Quantity to Transfer</Label>
            <Input 
              id="qty" 
              type="number" 
              value={quantity} 
              onChange={e => setQuantity(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Input 
              id="reason" 
              placeholder="e.g. Replenishment" 
              value={reason} 
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleTransfer} disabled={loading}>
            {loading ? "Processing..." : "Execute Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
