import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Activity, Map, ArrowUpRight, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const HeatmapItem = ({
  name,
  load,
  staff,
  online,
}: {
  name: string;
  load: number;
  staff: string;
  online: boolean;
}) => (
  <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border",
            online
              ? "bg-blue-50 border-blue-100 text-blue-600"
              : "bg-slate-50 border-slate-100 text-slate-400",
          )}
        >
          <Monitor className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-black italic uppercase tracking-tight text-slate-900">
            {name}
          </h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {staff} Assets
          </p>
        </div>
      </div>
      <Badge
        className={cn(
          "text-[8px] font-black italic tracking-widest border-none px-2",
          load > 85
            ? "bg-red-500 text-white"
            : load > 60
              ? "bg-amber-500 text-white"
              : "bg-emerald-500 text-white",
        )}
      >
        {load > 85 ? "CRITICAL" : load > 60 ? "HIGH-LOAD" : "STABLE"}
      </Badge>
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between text-[9px] font-black italic uppercase">
        <span className="text-slate-400">Resource Saturation</span>
        <span className="text-slate-900">{load}%</span>
      </div>
      <Progress
        value={load}
        className={cn(
          "h-1.5",
          load > 85
            ? "bg-red-100"
            : load > 60
              ? "bg-amber-100"
              : "bg-emerald-100",
        )}
      />
    </div>

    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
      <div className="flex -space-x-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center overflow-hidden"
          >
            <div className="w-full h-full bg-blue-600/10 flex items-center justify-center text-[8px] font-black text-blue-600">
              U{i}
            </div>
          </div>
        ))}
      </div>
      <button className="text-[9px] font-black italic text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
        Staffing Deck <ArrowUpRight className="w-2.5 h-2.5" />
      </button>
    </div>
  </div>
);

export const ResourceHeatmap = ({ stores }: { stores: any[] }) => {
  return (
    <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-50/50 backdrop-blur-md overflow-hidden">
      <CardHeader className="p-10 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-600" />
            Human-Asset Saturation
          </CardTitle>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Staffing Efficiency vs. Real-time Node Load
          </p>
        </div>
        <div className="p-3 rounded-full bg-white border shadow-sm">
          <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.slice(0, 3).map((store, i) => (
            <HeatmapItem
              key={store.id}
              name={store.name}
              load={i === 0 ? 92 : i === 1 ? 45 : 78}
              staff={i === 0 ? "12/12" : i === 1 ? "8/10" : "15/15"}
              online={true}
            />
          ))}
        </div>

        <div className="mt-10 p-8 rounded-[2.5rem] bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <Map className="w-full h-full scale-110" />
          </div>
          <div className="relative z-10 space-y-2 text-center md:text-left">
            <h4 className="text-lg font-black italic uppercase tracking-tighter">
              Global Force Disposition
            </h4>
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]">
              Cross-Branch Resource Balance: OPTIMAL
            </p>
          </div>
          <button className="relative z-10 w-full md:w-auto h-14 px-10 rounded-2xl bg-blue-600 text-white font-black italic text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-xl">
            Auto-Balance Personnel
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
