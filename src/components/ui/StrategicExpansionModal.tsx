import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Construction, 
  ShieldCheck, 
  Layers,
  Cpu,
  Sparkles,
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategicExpansionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  expectedDeployment?: string;
}

export function StrategicExpansionModal({ 
  isOpen, 
  onOpenChange, 
  featureName,
  expectedDeployment = "DEPLOYMENT Q4-26"
}: StrategicExpansionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-[3.5rem] border border-white/10 bg-slate-950 p-0 overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.2)]">
        {/* Animated Accent Line */}
        <div className="h-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/40 animate-[shimmer_2s_infinite] -translate-x-full" />
        </div>
        
        <div className="p-14 space-y-12 relative overflow-hidden">
          {/* Blueprint Background Grid */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />
          
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <Badge className="bg-indigo-600/20 text-indigo-400 font-black text-[11px] uppercase tracking-[0.3em] border border-indigo-500/30 px-4 py-2 rounded-xl italic">
                Phase 2 Architecture
              </Badge>
              <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] italic animate-pulse">
                <Construction className="h-4 w-4" /> Feature Under Calibration
              </div>
            </div>
            <DialogTitle className="text-5xl font-black tracking-tighter uppercase italic leading-none text-white mb-4">
              {featureName}
            </DialogTitle>
            <DialogDescription className="text-lg font-medium italic leading-relaxed text-slate-400 mt-2 tracking-tight">
              "This tactical node is undergoing high-fidelity calibration for integration into the global Zenvix matrix."
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-10 relative z-10">
            {/* Visual Roadmap Nodes */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { icon: Layers, label: "Topology", status: "VERIFIED", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                { icon: Cpu, label: "Engine", status: "CALIBRATING", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
                { icon: Network, label: "Network", status: "PENDING", color: "text-slate-500", bg: "bg-white/[0.02]", border: "border-white/5" },
              ].map((node, i) => (
                <div key={i} className={cn("p-8 rounded-[2.5rem] border shadow-2xl flex flex-col items-center gap-4 transition-all duration-500 hover:scale-110 hover:-translate-y-2 group/node", node.bg, node.border)}>
                   <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shadow-2xl transition-transform duration-700 group-hover/node:rotate-12", node.bg)}>
                      <node.icon className={cn("h-8 w-8", node.color)} />
                   </div>
                   <div className="text-center space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">{node.label}</p>
                      <p className={cn("text-[9px] font-black uppercase tracking-widest italic animate-pulse", node.color)}>{node.status}</p>
                   </div>
                </div>
              ))}
            </div>

            {/* Neural Advisory Note */}
            <div className="rounded-[3rem] border border-white/10 bg-white/[0.03] p-10 group overflow-hidden relative shadow-inner">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
               <div className="flex items-start gap-6 relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-white/[0.05] flex items-center justify-center shadow-2xl shrink-0 group-hover:rotate-[15deg] transition-all duration-500 border border-white/10">
                     <Sparkles className="h-7 w-7 text-indigo-400 fill-indigo-400/20" />
                  </div>
                  <div className="space-y-3">
                     <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Tactical Insight</p>
                     <p className="text-sm font-medium italic leading-relaxed text-slate-400 tracking-tight">
                        The <strong className="text-white">{featureName}</strong> protocol is being optimized for <strong className="text-indigo-400">99.9% operational yield</strong>. Deployment is authorized for the <span className="text-indigo-400 font-black">{expectedDeployment}</span> cycle.
                     </p>
                  </div>
               </div>
            </div>
          </div>
          
          <DialogFooter className="relative z-10 pt-6">
            <Button 
               className="w-full h-20 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 font-black text-sm uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(79,70,229,0.4)] gap-4 group transition-all duration-500 hover:scale-105 active:scale-95 text-white italic"
               onClick={() => onOpenChange(false)}
            >
              <ShieldCheck className="h-6 w-6" /> ACKNOWLEDGE STRATEGIC DEPLOYMENT
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
