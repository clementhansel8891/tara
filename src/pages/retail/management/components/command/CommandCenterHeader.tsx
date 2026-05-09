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
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-surface-2/30 p-8 rounded-[2rem] border border-border/50 backdrop-blur-xl shadow-2xl">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-label">
          <LayoutDashboard className="w-4 h-4 text-primary" />
          <span>Genesis Command</span>
          <span className="text-primary/20">/</span>
          <span className="text-muted-foreground">Operational Oversight</span>
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-foreground">
            Retail Command Center
          </h1>
          <Badge variant="success" className="animate-pulse">
            LIVE_FEED
          </Badge>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-label">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-foreground italic">Scope: {locationName || "Global Root"}</span>
          </div>
          <div className="h-4 w-px bg-border/50" />
          <div 
            onClick={() => onExpansionRequest("Multi-Node Context Orchestration")}
            className="flex items-center gap-2 text-label text-foreground hover:text-primary cursor-pointer transition-premium group"
          >
            <span>Switch Context</span>
            <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden 2xl:flex flex-col items-end space-y-2">
          <div className="flex items-center gap-3 text-value">
            <Clock className="w-4 h-4 text-primary" />
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black tracking-[0.4em] text-success/70 uppercase italic">
            <ShieldCheck className="w-3.5 h-3.5 text-success/50" />
            SECURE_UPLINK
          </div>
        </div>

        <Button
          variant="tactical"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-3 group"
        >
          <RefreshCw
            className={cn(
              "w-4 h-4 group-hover:rotate-180 transition-transform duration-700",
              isLoading && "animate-spin text-primary",
            )}
          />
          {isLoading ? "SYNC..." : "FORCE SYNC"}
        </Button>
      </div>
    </div>
  );
};


