import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { inventoryService } from "@/core/services/inventory/inventoryService";
import { useSession } from "@/core/security/session";

interface BatchIntakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BatchIntakeDialog({ open, onOpenChange, onSuccess }: BatchIntakeDialogProps) {
  const session = useSession();
  const [items, setItems] = useState([{ itemId: "", locationId: "", departmentId: "", quantity: 0, unitCost: 0, reason: "Batch Intake" }]);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { itemId: "", locationId: "", departmentId: "", quantity: 0, unitCost: 0, reason: "Batch Intake" }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[idx] as any)[field] = value;
    setItems(newItems);
  };

  const handleBatchIntake = async () => {
    setLoading(true);
    try {
      await inventoryService.batchRecordIntake(session.tenantId, session, items);
      onSuccess();
      onOpenChange(false);
      setItems([{ itemId: "", locationId: "", departmentId: "", quantity: 0, unitCost: 0, reason: "Batch Intake" }]);
    } catch (err) {
      console.error("Batch intake failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Stock Intake</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-xs uppercase">
                <th className="p-2 text-left">Product ID</th>
                <th className="p-2 text-left">Loc / Dept</th>
                <th className="p-2 text-left w-20">Qty</th>
                <th className="p-2 text-left w-24">Cost</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">
                    <Input 
                      placeholder="SKU or ID" 
                      value={item.itemId} 
                      onChange={e => updateItem(idx, "itemId", e.target.value)}
                    />
                  </td>
                  <td className="p-2 space-y-1">
                    <Input 
                      placeholder="Loc" 
                      value={item.locationId} 
                      onChange={e => updateItem(idx, "locationId", e.target.value)}
                    />
                    <Input 
                      placeholder="Dept" 
                      value={item.departmentId} 
                      onChange={e => updateItem(idx, "departmentId", e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number" 
                      value={item.quantity} 
                      onChange={e => updateItem(idx, "quantity", Number(e.target.value))}
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number" 
                      value={item.unitCost} 
                      onChange={e => updateItem(idx, "unitCost", Number(e.target.value))}
                    />
                  </td>
                  <td className="p-2">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={addItem}>
            <Plus className="h-4 w-4" /> Add Row
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleBatchIntake} disabled={loading}>
            {loading ? "Processing..." : "Confirm Batch Intake"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
