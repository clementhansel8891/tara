import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input as UIInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectItem as UISelectItem,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/core/api/apiClient";
import { useSession } from "@/core/security/session";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Box, Tags, BarChart3, Tag } from "lucide-react";

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateItemDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateItemDialogProps) {
  const session = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    uom: "pcs",
    base_price: 0,
    description: "",
    minStock: 0,
    status: "active",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("/inventory/items", "POST", session, {
        ...formData,
        base_price: Number(formData.base_price),
      });
      toast({
        title: "Item Created",
        description: `${formData.name} has been added to the catalog.`,
      });
      onSuccess();
      onOpenChange(false);
      setFormData({
        sku: "",
        name: "",
        category: "",
        uom: "pcs",
        base_price: 0,
        description: "",
        minStock: 0,
        status: "active",
      });
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create inventory item.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-950 p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="bg-slate-900 p-8 text-white">
            <div className="flex items-center gap-3 text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2">
              <Plus className="h-3 w-3" /> CATALOG_ADDITION
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic">
              New Inventory Item
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold italic">
              Define a new product identity within the logistics engine.
            </DialogDescription>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unique SKU</Label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <UIInput
                    required
                    className="pl-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold"
                    placeholder="e.g. ELE-MAC-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Category</Label>
                <div className="relative">
                  <Tags className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <UIInput
                    required
                    className="pl-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold"
                    placeholder="e.g. Electronics"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Item Identity (Name)</Label>
              <div className="relative">
                <Box className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <UIInput
                  required
                  className="pl-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold"
                  placeholder="e.g. Macbook Pro M3 14-inch"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Base Cost ($)</Label>
                <div className="relative">
                  <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <UIInput
                    type="number"
                    step="0.01"
                    className="pl-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Unit of Measure</Label>
                <UISelect 
                  value={formData.uom} 
                  onValueChange={(val) => setFormData({ ...formData, uom: val })}
                >
                  <UISelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-bold">
                    <UISelectValue />
                  </SelectTrigger>
                  <UISelectContent className="rounded-2xl border-none shadow-2xl">
                    <UISelectItem value="pcs" className="font-bold">Pieces (pcs)</SelectItem>
                    <UISelectItem value="kg" className="font-bold">Kilograms (kg)</SelectItem>
                    <UISelectItem value="units" className="font-bold">Units</SelectItem>
                    <UISelectItem value="box" className="font-bold">Boxes</SelectItem>
                  </SelectContent>
                </UISelect>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Description</Label>
              <Textarea
                className="min-h-[100px] rounded-2xl bg-slate-50 dark:bg-slate-900 border-none font-medium italic"
                placeholder="Technical specifications and logistics notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-6 border-t gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                className="rounded-xl h-12 px-6 font-black text-[10px] uppercase tracking-widest"
                onClick={() => onOpenChange(false)}
              >
                Discard
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="rounded-xl h-12 px-10 font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 shadow-xl"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Execute Creation
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
