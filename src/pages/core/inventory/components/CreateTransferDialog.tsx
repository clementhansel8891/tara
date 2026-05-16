import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input as UIInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Package, MapPin, ArrowRight } from "lucide-react";
import { inventoryService } from "@/core/services/inventory/inventoryService";
import { useSession } from "@/core/security/session";
import { toast } from "@/hooks/use-toast";
import type { InventoryItemMaster } from "@/core/types/inventory/inventory";

interface CreateTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTransferDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTransferDialogProps) {
  const session = useSession();
  const [items, setItems] = useState<InventoryItemMaster[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  const [itemId, setItemId] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadDependencies();
    }
  }, [open]);

  const loadDependencies = async () => {
    setFetching(true);
    try {
      const [itemsData, locationsData] = await Promise.all([
        inventoryService.listItems(session.tenant_id, session, undefined, 1, 100),
        inventoryService.listLocations(session.tenant_id, session),
      ]);
      setItems(itemsData);
      setLocations(locationsData);
    } catch (err: any) {
      console.error("Failed to load transfer dependencies:", err);
      toast({
        title: "Load Error",
        description: "Failed to fetch items or locations.",
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  const reset = () => {
    setItemId("");
    setFromLocation("");
    setToLocation("");
    setQuantity(1);
    setReason("");
    setError(null);
  };

  const handleCreate = async () => {
    if (!itemId || !fromLocation || !toLocation) {
      setError("Please fill in all required fields.");
      return;
    }
    if (fromLocation === toLocation) {
      setError("Source and destination cannot be the same.");
      return;
    }
    if (quantity <= 0) {
      setError("Quantity must be at least 1.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await inventoryService.createStockTransfer(session.tenant_id, session, {
        item_id: itemId,
        from_location_id: fromLocation,
        to_location_id: toLocation,
        quantity,
        reason: reason || "Manual Stock Transfer",
      });
      
      toast({
        title: "Transfer Initiated",
        description: "The stock transfer record has been created successfully.",
      });
      
      onSuccess();
      onOpenChange(false);
      reset();
    } catch (err: any) {
      setError(err?.message || "Failed to create transfer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg bg-slate-950 border-slate-800 rounded-[2rem] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
            Logistics Protocol: New Transfer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Asset to Move
            </Label>
            <Select value={itemId} onValueChange={setItemId} disabled={fetching}>
              <SelectTrigger className="h-14 bg-slate-900/50 border-slate-800 rounded-xl font-bold">
                <SelectValue placeholder={fetching ? "Loading inventory..." : "Select product SKU..."} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-800 bg-slate-950/95 backdrop-blur-xl max-h-80">
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="font-bold">
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 opacity-40" />
                      {item.name} <span className="text-xs opacity-50 ml-1">[{item.sku}]</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Source Node
              </Label>
              <Select value={fromLocation} onValueChange={setFromLocation} disabled={fetching}>
                <SelectTrigger className="h-12 bg-slate-900/50 border-slate-800 rounded-xl font-bold">
                  <SelectValue placeholder="Origin..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-800 bg-slate-950/95 backdrop-blur-xl">
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id} className="font-bold">
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden md:flex justify-center pt-6">
              <ArrowRight className="h-4 w-4 text-primary opacity-30" />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Destination Node
              </Label>
              <Select value={toLocation} onValueChange={setToLocation} disabled={fetching}>
                <SelectTrigger className="h-12 bg-slate-900/50 border-slate-800 rounded-xl font-bold">
                  <SelectValue placeholder="Destination..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-800 bg-slate-950/95 backdrop-blur-xl">
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id} className="font-bold">
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Quantity
              </Label>
              <UIInput
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="h-12 bg-slate-900/50 border-slate-800 rounded-xl font-black text-lg text-center"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Logistics Justification
              </Label>
              <UIInput
                placeholder="e.g. Stock Rebalancing, Production Demand"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-12 bg-slate-900/50 border-slate-800 rounded-xl font-bold"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-0 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl border-slate-800 font-black uppercase tracking-widest text-[10px]"
          >
            Abort
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || fetching}
            className="flex-1 rounded-xl bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-primary/20"
          >
            {loading ? "Authorizing..." : "Execute Transfer Protocol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
