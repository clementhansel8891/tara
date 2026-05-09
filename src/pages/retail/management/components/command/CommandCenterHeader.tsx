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
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-[11px] font-black italic uppercase tracking-[0.4em] text-primary">
          <LayoutDashboard className="w-4 h-4" />
          <span className="italic">Genesis Command</span>
          <span className="text-foreground/10">/</span>
          <span className="text-muted-foreground">Operational Oversight</span>
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black italic tracking-tighter uppercase text-foreground italic">
            Retail Command Center
          </h1>
          <Badge className="bg-success/10 text-success border border-emerald-500/20 font-black italic text-[9px] px-2.5 py-1 tracking-[0.1em] animate-pulse rounded-lg">
            LIVE_FEED
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Scope: {locationName || "Global Root"}</span>
          </div>
          <div className="h-4 w-px bg-secondary/40" />
          <div 
            onClick={() => onExpansionRequest("Multi-Node Context Orchestration")}
            className="flex items-center gap-2 text-foreground hover:text-primary cursor-pointer transition-all group"
          >
            <span>Switch Context</span>
            <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden 2xl:flex flex-col items-end space-y-1 mr-2">
          <div className="flex items-center gap-2.5 text-[11px] font-black italic text-foreground uppercase tracking-[0.1em] italic">
            <Clock className="w-3.5 h-3.5 text-primary" />
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">
            <ShieldCheck className="w-2.5 h-2.5 text-success/50" />
            SECURE
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-10 px-5 rounded-xl border-white/5 bg-white/[0.05] shadow-xl hover:bg-white/[0.1] hover:border-border transition-all font-black italic uppercase text-[9px] tracking-[0.2em] gap-2.5 group text-foreground italic"
        >
          <RefreshCw
            className={cn(
              "w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-700",
              isLoading && "animate-spin text-primary",
            )}
          />
          {isLoading ? "SYNC..." : "FORCE SYNC"}
        </Button>
      </div>
    </div>
  );
};

