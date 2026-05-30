import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { retailService } from "@/core/services/retail/retailService";
import { useSession } from "@/core/security/session";
import type { RetailPromotion } from "@/core/types/retail/retail";
import { Loader2, Plus, Percent, DollarSign, Target } from "lucide-react";

interface CreatePromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (promo: RetailPromotion) => void;
}

export const CreatePromoModal: React.FC<CreatePromoModalProps> = ({ isOpen, onClose, onCreated }) => {
  const session = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    type: "percentage" as RetailPromotion["type"],
    value: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    target: "all" as RetailPromotion["target"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.value) {
      toast({ title: "Validation Error", description: "Title and Value are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const newPromo = await retailService.createPromotion(session.tenant_id!, session, {
        title: formData.title,
        type: formData.type,
        value: Number(formData.value),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        status: "draft",
        target: formData.target,
      });

      toast({ title: "Proposal Issued", description: "Promotion has been added to the governance queue." });
      onCreated(newPromo);
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({ title: "Failed to issue proposal", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-6 border border-white/10 shadow-2xl bg-slate-950/98 backdrop-blur-2xl text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2 text-foreground">
            <Plus className="w-5 h-5 text-primary" /> Issue Promo Proposal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 mb-1 block">Campaign Title</label>
              <Input 
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="h-12 rounded-xl border-white/10 font-bold italic bg-white/[0.03] text-foreground focus:border-primary/50 placeholder:text-muted-foreground/50"
                placeholder="e.g. End of Season Sale"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 mb-1 block">Promo Type</label>
                <select 
                  className="w-full h-12 px-3 rounded-xl border border-white/10 font-bold italic bg-slate-900 text-foreground text-sm outline-none focus:border-primary/50"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as RetailPromotion["type"] })}
                >
                  <option value="percentage" className="bg-slate-900 text-foreground">Percentage (%)</option>
                  <option value="fixed_amount" className="bg-slate-900 text-foreground">Fixed Amount (Rp)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 mb-1 block">Discount Value</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {formData.type === "percentage" ? <Percent className="w-4 h-4" /> : <span className="font-bold text-xs italic">Rp</span>}
                  </div>
                  <Input 
                    type="number"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                    className="h-12 pl-10 rounded-xl border-white/10 font-black italic bg-white/[0.03] text-foreground focus:border-primary/50 placeholder:text-muted-foreground/50"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 mb-1 block">Start Date</label>
                <Input 
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="h-12 rounded-xl border-white/10 font-bold bg-white/[0.03] text-foreground focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 mb-1 block">End Date</label>
                <Input 
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="h-12 rounded-xl border-white/10 font-bold bg-white/[0.03] text-foreground focus:border-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 mb-1 block flex items-center gap-1">
                <Target className="w-3 h-3" /> Target Scope
              </label>
              <select 
                className="w-full h-12 px-3 rounded-xl border border-white/10 font-bold italic bg-slate-900 text-foreground text-sm outline-none focus:border-primary/50"
                value={formData.target}
                onChange={e => setFormData({ ...formData, target: e.target.value as RetailPromotion["target"] })}
              >
                <option value="all" className="bg-slate-900 text-foreground">All Items (Global)</option>
                <option value="category" className="bg-slate-900 text-foreground">Specific Category</option>
                <option value="specific_items" className="bg-slate-900 text-foreground">Specific Items</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider text-xs border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black italic uppercase tracking-wider text-xs shadow-lg shadow-primary/20">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Queue Proposal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
