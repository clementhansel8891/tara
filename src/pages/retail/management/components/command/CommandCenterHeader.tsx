import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  MapPin,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const CommandCenterHeader = ({
  locationName,
  onRefresh,
  isLoading,
  onExpansionRequest,
}: {
  locationName: string;
  onRefresh: () => void;
  isLoading: boolean;
  onExpansionRequest: (feature: string) => void;
}) => {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-[11px] font-black italic uppercase tracking-[0.4em] text-indigo-400">
          <LayoutDashboard className="w-4 h-4" />
          <span className="italic">Genesis Command</span>
          <span className="text-white/10">/</span>
          <span className="text-slate-600">Operational Oversight</span>
        </div>
        <div className="flex items-center gap-6">
          <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white italic">
            Retail Command Center
          </h1>
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black italic text-[10px] px-3 py-1 tracking-[0.2em] animate-pulse rounded-lg">
            LIVE_FEED
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <span>Scope: {locationName || "Global Root"}</span>
          </div>
          <div className="h-4 w-px bg-white/5" />
          <div 
            onClick={() => onExpansionRequest("Multi-Node Context Orchestration")}
            className="flex items-center gap-2 text-white hover:text-indigo-400 cursor-pointer transition-all group"
          >
            <span>Switch Context</span>
            <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden 2xl:flex flex-col items-end space-y-2 mr-4">
          <div className="flex items-center gap-3 text-[12px] font-black italic text-white uppercase tracking-[0.1em] italic">
            <Clock className="w-4 h-4 text-indigo-400" />
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">
            <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
            Security Shield Active
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-16 px-10 rounded-2xl border-white/5 bg-white/[0.05] shadow-2xl hover:bg-white/[0.1] hover:border-white/10 transition-all font-black italic uppercase text-[11px] tracking-[0.3em] gap-4 group text-white italic"
        >
          <RefreshCw
            className={cn(
              "w-5 h-5 group-hover:rotate-180 transition-transform duration-700",
              isLoading && "animate-spin text-indigo-400",
            )}
          />
          {isLoading ? "Synchronizing..." : "Force Global Sync"}
        </Button>
      </div>
    </div>
  );
};

