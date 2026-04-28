import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Activity, Map, ArrowUpRight, Monitor, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { retailService } from "@/core/services/retail/retailService";
import { useSession } from "@/core/security/session";
import type { RetailStore, RetailShift } from "@/core/types/retail/retail";

const HeatmapItem = ({
  name,
  load,
  staff,
  online,
  onExpansionRequest,
}: {
  name: string;
  load: number;
  staff: string;
  online: boolean;
  onExpansionRequest: (feature: string) => void;
}) => (
  <div className="p-8 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-3xl border border-white/5 shadow-2xl hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all duration-500 group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all duration-1000" />
    <div className="flex items-center justify-between mb-8 relative z-10">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-[1.25rem] flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-2xl",
            online
              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
              : "bg-white/5 border-white/10 text-slate-500",
          )}
        >
          <Monitor className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-black italic uppercase tracking-tight text-white">
            {name}
          </h4>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 italic">
            {staff} Assets
          </p>
        </div>
      </div>
      <Badge
        className={cn(
          "text-[9px] font-black italic tracking-[0.2em] border-none px-3 h-6 rounded-lg uppercase",
          load > 85
            ? "bg-rose-500/20 text-rose-400"
            : load > 60
              ? "bg-amber-500/20 text-amber-400"
              : "bg-emerald-500/20 text-emerald-400",
        )}
      >
        {load > 85 ? "CRITICAL" : load > 60 ? "HIGH-LOAD" : "STABLE"}
      </Badge>
    </div>

    <div className="space-y-4 relative z-10">
      <div className="flex items-center justify-between text-[10px] font-black italic uppercase tracking-widest">
        <span className="text-slate-500">Resource Saturation</span>
        <span className="text-white italic">{load}%</span>
      </div>
      <Progress
        value={load}
        className="h-2 bg-white/5"
        style={{ '--progress-foreground': load > 85 ? '#f43f5e' : load > 60 ? '#f59e0b' : '#10b981' } as any}
      />
    </div>

    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
      <div className="flex -space-x-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-950 flex items-center justify-center overflow-hidden shadow-2xl transition-transform hover:scale-110 hover:z-20"
          >
            <div className="w-full h-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-black text-indigo-400 italic">
              U{i}
            </div>
          </div>
        ))}
      </div>
      <button 
        onClick={() => onExpansionRequest(`Staffing Deck: ${name}`)}
        className="text-[10px] font-black italic text-indigo-400 uppercase tracking-[0.3em] hover:text-white transition-all flex items-center gap-2 group/btn italic"
      >
        Staffing Deck <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
      </button>
    </div>
  </div>
);

export const ResourceHeatmap = ({ 
  stores,
  onExpansionRequest 
}: { 
  stores: any[];
  onExpansionRequest: (feature: string) => void;
}) => {
  const session = useSession();
  const [shifts, setShifts] = useState<RetailShift[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchShifts = async () => {
    if (!session.tenantId) return;
    setLoading(true);
    try {
      // Fetch all shifts for the tenant
      const allShifts = await retailService.listShifts(session.tenantId, session);
      // Filter only open shifts
      const activeOnes = allShifts.filter(s => s.status === "open");
      setShifts(activeOnes);
    } catch (error) {
      console.error("[ResourceHeatmap] Failed to fetch shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
    const interval = setInterval(fetchShifts, 60000); // Check every min
    return () => clearInterval(interval);
  }, [session.tenantId]);

  const getStoreSaturation = (storeId: string) => {
    const activeAtStore = shifts.filter(s => s.storeId === storeId).length;
    const target = 10; // Default threshold
    const load = Math.min(Math.round((activeAtStore / target) * 100), 100);
    return {
      count: activeAtStore,
      target,
      load
    };
  };

  return (
    <Card className="rounded-[4rem] border border-white/5 shadow-2xl bg-white/[0.03] backdrop-blur-3xl overflow-hidden group/heatmap">
      <CardHeader className="p-14 border-b border-white/5 flex flex-row items-center justify-between group/header">
        <div className="space-y-3">
          <CardTitle className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-6 text-white">
            <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 group-hover/header:rotate-6 transition-transform duration-500">
              <Users className="w-8 h-8" />
            </div>
            Human-Asset Saturation
          </CardTitle>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-4 ml-[88px] italic">
            Staffing Efficiency vs. Real-time Node Load • {shifts.length} Active Personnel
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchShifts}
            disabled={loading}
            className="w-14 h-14 flex items-center justify-center bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5 text-slate-400", loading && "animate-spin")} />
          </button>
          <div className="p-4 rounded-full bg-white/5 border border-white/10 shadow-2xl group-hover/heatmap:scale-110 transition-transform duration-500">
            <Activity className="w-7 h-7 text-indigo-400 animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {stores.slice(0, 6).map((store) => {
            const stats = getStoreSaturation(store.id);
            return (
              <HeatmapItem
                key={store.id}
                name={store.name}
                load={stats.load}
                staff={`${stats.count}/${stats.target}`}
                online={true}
                onExpansionRequest={onExpansionRequest}
              />
            );
          })}
        </div>

        <div className="mt-14 p-12 rounded-[3.5rem] bg-slate-900/50 border border-white/5 text-white flex flex-col xl:flex-row items-center justify-between gap-12 relative overflow-hidden group/force backdrop-blur-3xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none group-hover/force:scale-110 transition-transform duration-1000">
            <Map className="w-full h-full scale-110" />
          </div>
          <div className="relative z-10 space-y-3 text-center xl:text-left">
            <h4 className="text-3xl font-black italic uppercase tracking-tighter">
              Global Force Disposition
            </h4>
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.4em] italic">
              Cross-Branch Resource Balance: {shifts.length > 0 ? "OPTIMAL" : "AWAITING DATA"}
            </p>
          </div>
          <button 
            onClick={() => onExpansionRequest("Automated Personnel Balancing Engine")}
            className="relative z-10 w-full xl:w-auto h-16 px-12 rounded-2xl bg-indigo-600 text-white font-black italic text-[12px] uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95"
          >
            Auto-Balance Personnel
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

