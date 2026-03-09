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
}: {
  locationName: string;
  onRefresh: () => void;
  isLoading: boolean;
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-black italic uppercase tracking-[0.3em] text-blue-600">
          <LayoutDashboard className="w-3 h-3" />
          <span>Genesis Command</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">Operational Oversight</span>
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-slate-900">
            Retail Command Center
          </h1>
          <Badge className="bg-emerald-500 font-black italic text-[9px] px-2 py-0.5 tracking-widest animate-pulse">
            LIVE_FEED
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            <span>Scope: {locationName || "Global Root"}</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 font-black italic text-slate-900 cursor-pointer hover:text-blue-600 transition-colors">
            <span>Switch Context</span>
            <ChevronDown className="w-3 h-3" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex flex-col items-end mr-6 space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black italic text-slate-900 uppercase">
            <Clock className="w-3 h-3 text-blue-600" />
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
          <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
            Security Shield Active
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-14 px-8 rounded-[1.25rem] border-slate-200 bg-white shadow-sm hover:shadow-md transition-all font-black italic uppercase text-xs tracking-widest gap-3 group"
        >
          <RefreshCw
            className={cn(
              "w-4 h-4 group-hover:rotate-180 transition-transform duration-500",
              isLoading && "animate-spin",
            )}
          />
          {isLoading ? "Synchronizing..." : "Force Global Sync"}
        </Button>
      </div>
    </div>
  );
};
