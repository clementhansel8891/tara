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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Barcode, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  PackagePlus,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UnknownBarcodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  barcode: string;
  onReportAnomaly: (barcode: string) => void;
  onCreateNew: (itemData: any) => void;
  categoryOptions: { id: string; name: string }[];
}

export const UnknownBarcodeDialog: React.FC<UnknownBarcodeDialogProps> = ({
  isOpen,
  onClose,
  barcode,
  onReportAnomaly,
  onCreateNew,
  categoryOptions,
}) => {
  const [step, setStep] = useState<"choice" | "create">("choice");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const reset = () => {
    setStep("choice");
    setName("");
    setCategoryId("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = () => {
    onCreateNew({
      name,
      category_id: categoryId,
      barcode,
      sku: barcode, // Default SKU to barcode for quick entry
      unit: "pcs",
      module_tags: ["inventory"],
    });
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
        {/* Animated Background Header */}
        <div className="relative h-32 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-60 h-60 bg-amber-200 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-white">
            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl mb-2">
              <Barcode className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black italic uppercase tracking-widest">Unknown Barcode</h2>
          </div>
        </div>

        <div className="p-8">
          {step === "choice" ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-slate-500 font-medium text-sm">
                  The barcode <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{barcode}</span> was not found in the master list.
                </p>
                <p className="text-[10px] uppercase font-black tracking-tighter text-amber-600">Action Required to Proceed</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setStep("create")}
                  className="group relative flex items-center gap-4 p-5 rounded-[1.5rem] border-2 border-slate-100 bg-white hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left"
                >
                  <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <PackagePlus className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 text-sm italic uppercase">Add as New Item</h3>
                    <p className="text-xs text-slate-400 font-medium leading-tight">Register this item immediately for future tracking.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onReportAnomaly(barcode);
                    handleClose();
                  }}
                  className="group relative flex items-center gap-4 p-5 rounded-[1.5rem] border-2 border-slate-100 bg-white hover:border-amber-500 hover:shadow-xl hover:shadow-amber-50 transition-all text-left"
                >
                  <div className="bg-amber-50 p-3 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 text-sm italic uppercase">Report Anomaly</h3>
                    <p className="text-xs text-slate-400 font-medium leading-tight">Flag this barcode as unrecognized for manual review.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-200 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Item Name</Label>
                  <Input 
                    autoFocus
                    placeholder="e.g. Red Bull 250ml"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-xl border-slate-100 font-bold focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</Label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-12 rounded-xl border border-slate-100 bg-white px-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  >
                    <option value="">Select Category...</option>
                    {categoryOptions.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  <p className="text-[10px] font-bold text-indigo-700 leading-tight">
                    This item will be saved with barcode <span className="font-mono">{barcode}</span> and submitted for approval after audit.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1 rounded-xl font-bold"
                  onClick={() => setStep("choice")}
                >
                  Back
                </Button>
                <Button 
                  className="flex-[2] rounded-xl font-black italic uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                  disabled={!name || !categoryId}
                  onClick={handleCreate}
                >
                  Save & Add
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
