import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inventoryService } from "@/core/services/inventory/inventoryService";
import { useSession } from "@/core/security/session";
import type { InventoryStockBalance, InventoryItemMaster } from "@/core/types/inventory/inventory";

interface AdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBalance: { balance: InventoryStockBalance; item: InventoryItemMaster } | null;
  onSuccess: () => void;
}

export function AdjustmentDialog({ open, onOpenChange, selectedBalance, onSuccess }: AdjustmentDialogProps) {
  const session = useSession();
  const [delta, setDelta] = useState(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdjust = async () => {
    if (!selectedBalance) return;
    setLoading(true);
    try {
      await inventoryService.requestAdjustment(session.tenantId, session, {
        itemId: selectedBalance.item.id,
        locationCode: selectedBalance.balance.locationCode,
        departmentCode: selectedBalance.balance.departmentCode,
        requestedDelta: delta,
        reason,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Adjustment failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Stock Adjustment Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>Item</Label>
            <div className="rounded bg-muted p-2 text-sm">
              {selectedBalance?.item.name} ({selectedBalance?.item.sku})
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="delta">Quantity Delta (Negative to Subtract)</Label>
            <Input 
              id="delta" 
              type="number" 
              value={delta} 
              onChange={e => setDelta(Number(e.target.value))}
            />
            <p className="text-[10px] text-muted-foreground italic">
              Current: {selectedBalance?.balance.quantity.toLocaleString()} → New: {(selectedBalance?.balance.quantity || 0) + delta}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="adj-reason">Reason for Adjustment</Label>
            <Input 
              id="adj-reason" 
              placeholder="e.g. Damascus Damage, Cycle Count Correction" 
              value={reason} 
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdjust} disabled={loading || delta === 0}>
            {loading ? "Submitting..." : "Submit Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
