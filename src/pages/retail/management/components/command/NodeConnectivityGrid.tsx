import React, { useState, useEffect } from "react";
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
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Network,
  LayoutGrid,
} from "lucide-react";
import { retailInfrastructureService } from "@/core/services/retail/retailInfrastructureService";
import { useSession } from "@/core/security/session";
import type { RetailGatewayNode, RetailLoadBalancer } from "@/core/types/retail/retail";

interface NodeStatusProps {
  name: string;
  type: "BRANCH" | "CHANNEL" | "GATEWAY" | "LOAD_BALANCER";
  status: "ONLINE" | "LOAD" | "SYNCING" | "ERROR" | "ACTIVE" | "STANDBY" | "DOWN";
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
  <div className="flex items-center justify-between p-6 rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all duration-500 group cursor-pointer shadow-lg">
    <div className="flex items-center gap-6">
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110",
          status === "ONLINE" || status === "ACTIVE"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : status === "LOAD" || status === "STANDBY"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : status === "SYNCING"
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400",
        )}
      >
        {type === "BRANCH" ? (
          <Store className="w-7 h-7" />
        ) : type === "CHANNEL" ? (
          <Globe className="w-7 h-7" />
        ) : (
          <Zap className="w-7 h-7" />
        )}
      </div>
      <div>
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-black italic uppercase tracking-tight text-white">
            {name}
          </h4>
          <Badge
            className={cn(
              "text-[9px] font-black italic tracking-[0.2em] px-2.5 h-5 border-none uppercase rounded-lg",
              status === "ONLINE" || status === "ACTIVE"
                ? "bg-emerald-500/20 text-emerald-400"
                : status === "LOAD" || status === "STANDBY"
                  ? "bg-amber-500/20 text-amber-400"
                  : status === "SYNCING"
                    ? "bg-indigo-500/20 text-indigo-400 animate-pulse"
                    : "bg-rose-500/20 text-rose-400",
            )}
          >
            {status}
          </Badge>
        </div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1.5 italic">
          {type}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-12">
      <div className="hidden xl:block w-40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest">
            Load Facet
          </span>
          <span className="text-[10px] font-black italic text-white">
            {health}%
          </span>
        </div>
        <Progress 
          value={health} 
          className="h-1.5 bg-white/5" 
          style={{ '--progress-foreground': (status === 'ONLINE' || status === 'ACTIVE') ? '#10b981' : (status === 'LOAD' || status === 'STANDBY') ? '#f59e0b' : '#6366f1' } as any}
        />
      </div>
      <div className="text-right min-w-[80px]">
        <div className="text-[12px] font-black italic text-white uppercase">
          {metric}
        </div>
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 italic">
          Efficiency
        </div>
      </div>
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  </div>
);

export const NodeConnectivityGrid = ({
  stores,
  channels,
  onExpansionRequest,
}: {
  stores: any[];
  channels: any[];
  onExpansionRequest: (feature: string) => void;
}) => {
  const session = useSession();
  const [gatewayNodes, setGatewayNodes] = useState<RetailGatewayNode[]>([]);
  const [loadBalancers, setLoadBalancers] = useState<RetailLoadBalancer[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'topology'>('grid');

  const fetchInfrastructure = async () => {
    if (!session.tenantId) return;
    setLoading(true);
    try {
      const [nodes, lbs] = await Promise.all([
        retailInfrastructureService.listGatewayNodes(session.tenantId, session),
        retailInfrastructureService.listLoadBalancers(session.tenantId, session)
      ]);
      setGatewayNodes(nodes);
      setLoadBalancers(lbs);
    } catch (error) {
      console.error("[NodeConnectivityGrid] Failed to fetch infrastructure:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfrastructure();
  }, [session.tenantId]);

  return (
    <div className="grid grid-cols-1 gap-10">
      <Card className="rounded-[4rem] border border-white/5 shadow-2xl overflow-hidden bg-white/[0.03] backdrop-blur-3xl group/grid">
        <CardHeader className="p-14 border-b border-white/5 bg-white/[0.01] flex flex-col xl:flex-row xl:items-center justify-between gap-8 space-y-0">
          <div>
            <CardTitle className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-6 text-white">
              <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 group-hover/grid:rotate-6 transition-transform duration-500">
                <ShieldCheck className="w-8 h-8" />
              </div>
              Fleet Consensus
            </CardTitle>
            <CardDescription className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-4 ml-[88px] italic">
              Active Multi-Branch Supervision: {stores.length} Nodes •{" "}
              {channels.length} Digital Hubs • {gatewayNodes.length} Gateways
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex p-2 bg-white/[0.03] rounded-2xl border border-white/5">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                  "px-6 h-12 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all",
                  viewMode === 'grid' ? "bg-white/10 text-white shadow-xl" : "text-slate-500 hover:text-white"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                Grid View
              </button>
              <button 
                onClick={() => {
                  if (viewMode === 'grid') {
                    onExpansionRequest("Infrastructure Mapping Engine");
                  }
                }}
                className={cn(
                  "px-6 h-12 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all",
                  viewMode === 'topology' ? "bg-white/10 text-white shadow-xl" : "text-slate-500 hover:text-white"
                )}
              >
                <Network className="w-4 h-4" />
                Topology
              </button>
            </div>
            <button 
              onClick={fetchInfrastructure}
              disabled={loading}
              className="w-16 h-16 flex items-center justify-center bg-white/5 border border-white/5 rounded-[1.5rem] hover:bg-white/10 transition-all group/refresh shadow-xl disabled:opacity-50"
            >
              <RefreshCw className={cn("w-6 h-6 text-slate-400 group-hover/refresh:rotate-180 transition-transform duration-700", loading && "animate-spin")} />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-14 space-y-6">
          <div className="grid gap-6">
            {/* Primary Physical Nodes */}
            {stores.slice(0, 3).map((store, i) => (
              <NodeRow
                key={store.id}
                name={store.name}
                type="BRANCH"
                status={i === 0 ? "ONLINE" : i === 1 ? "LOAD" : "ONLINE"}
                metric={`${(92 + i).toFixed(1)}%`}
                health={80 + i * 5}
              />
            ))}

            {/* Live Gateway Nodes from Backend */}
            {gatewayNodes.map((node) => (
              <NodeRow
                key={node.id}
                name={node.nodeName}
                type="GATEWAY"
                status={node.status}
                metric={`${node.healthScore}%`}
                health={node.healthScore}
              />
            ))}
          </div>
          
          <div className="py-8 flex items-center gap-8 opacity-40">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-black italic uppercase tracking-[0.4em] text-slate-500 italic">
              Digital Channel Matrix
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid gap-6">
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
          </div>

          <div className="pt-12 flex justify-center">
            <button
              onClick={() => onExpansionRequest("Global Infrastructure Manifest")}
              className="h-16 px-12 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-black italic uppercase tracking-[0.3em] transition-all hover:scale-[1.05] active:scale-[0.98] shadow-[0_20px_40px_rgba(79,70,229,0.3)] flex items-center gap-4"
            >
              Access Global Infrastructure Manifest{" "}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

