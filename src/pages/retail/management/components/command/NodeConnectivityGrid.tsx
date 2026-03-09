import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Store,
  Globe,
  Zap,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NodeStatusProps {
  name: string;
  type: "BRANCH" | "CHANNEL" | "GATEWAY";
  status: "ONLINE" | "LOAD" | "SYNCING" | "ERROR";
  metric: string;
  health: number;
}

const NodeRow: React.FC<NodeStatusProps> = ({
  name,
  type,
  status,
  metric,
  health,
}) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all group cursor-pointer">
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "p-2.5 rounded-xl border",
          status === "ONLINE"
            ? "bg-emerald-50 border-emerald-100 text-emerald-600"
            : status === "LOAD"
              ? "bg-amber-50 border-amber-100 text-amber-600"
              : status === "SYNCING"
                ? "bg-blue-50 border-blue-100 text-blue-600"
                : "bg-red-50 border-red-100 text-red-600",
        )}
      >
        {type === "BRANCH" ? (
          <Store className="w-5 h-5" />
        ) : type === "CHANNEL" ? (
          <Globe className="w-5 h-5" />
        ) : (
          <Zap className="w-5 h-5" />
        )}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-black italic uppercase tracking-tight text-slate-900">
            {name}
          </h4>
          <Badge
            className={cn(
              "text-[8px] font-black italic tracking-widest px-1.5 h-4 border-none uppercase",
              status === "ONLINE"
                ? "bg-emerald-500"
                : status === "LOAD"
                  ? "bg-amber-500"
                  : status === "SYNCING"
                    ? "bg-blue-500 animate-pulse"
                    : "bg-red-500",
            )}
          >
            {status}
          </Badge>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
          {type}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-8">
      <div className="hidden md:block w-32">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-black italic text-slate-400 uppercase">
            Load Facet
          </span>
          <span className="text-[9px] font-black italic text-slate-900">
            {health}%
          </span>
        </div>
        <Progress value={health} className="h-1 bg-slate-100" />
      </div>
      <div className="text-right">
        <div className="text-[10px] font-black italic text-slate-900 uppercase">
          {metric}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Efficiency
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
    </div>
  </div>
);

export const NodeConnectivityGrid = ({
  stores,
  channels,
}: {
  stores: any[];
  channels: any[];
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-10">
      <Card className="rounded-[3.5rem] border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardHeader className="p-10 border-b bg-slate-50/20 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              Fleet Consensus Engine
            </CardTitle>
            <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 ml-[64px]">
              Active Multi-Branch Supervision: {stores.length} Nodes •{" "}
              {channels.length} Digital Hubs
            </CardDescription>
          </div>
          <button className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-2xl transition-all group">
            <RefreshCw className="w-5 h-5 text-slate-400 group-hover:rotate-180 transition-transform duration-700" />
          </button>
        </CardHeader>
        <CardContent className="p-10 space-y-4">
          {stores.slice(0, 4).map((store, i) => (
            <NodeRow
              key={store.id}
              name={store.name}
              type="BRANCH"
              status={i === 0 ? "ONLINE" : i === 1 ? "LOAD" : "ONLINE"}
              metric={`${(92 + i).toFixed(1)}%`}
              health={80 + i * 5}
            />
          ))}
          <div className="py-2 flex items-center gap-4 opacity-50">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[9px] font-black italic uppercase tracking-widest text-slate-400">
              Digital Channel Matrix
            </span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          {channels.slice(0, 3).map((channel, i) => (
            <NodeRow
              key={channel.id}
              name={channel.name}
              type="CHANNEL"
              status={channel.status === "active" ? "ONLINE" : "SYNCING"}
              metric="99.9%"
              health={99}
            />
          ))}
          <div className="pt-8 flex justify-center">
            <button
              onClick={() => navigate("/m/retail/management/infrastructure")}
              className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black italic uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl flex items-center gap-3"
            >
              Access Global Infrastructure Manifest{" "}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
