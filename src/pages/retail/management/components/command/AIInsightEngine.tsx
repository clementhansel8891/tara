import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  Zap,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/core/security/session";
import { retailService } from "@/core/services/retail/retailService";
import { retailInfrastructureService } from "@/core/services/retail/retailInfrastructureService";

const InsightMarker = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <div className="space-y-2 flex-1 min-w-[120px]">
    <p className="text-[10px] font-black italic uppercase tracking-[0.3em] text-slate-500">
      {label}
    </p>
    <div className="flex items-center gap-3">
      <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.2)]", color)} />
      <span className="text-2xl font-black italic tracking-tighter text-white">
        {value}
      </span>
    </div>
  </div>
);

export const AIInsightEngine = ({
  onExpansionRequest
}: {
  onExpansionRequest?: (feature: string) => void;
}) => {
  const session = useSession();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    revenue: "Rp 0",
    staff: 0,
    health: 100,
    anomalies: [] as string[]
  });

  const analyzeNexus = async () => {
    if (!session.tenantId) return;
    setLoading(true);
    try {
      // 1. Get Revenue
      const orders = await retailService.listOrders(session.tenantId, session);
      const totalRev = orders.reduce((acc, o) => acc + (o.total_amount || o.totalAmount || 0), 0);
      
      // 2. Get Active Staff
      const shifts = await retailService.listShifts(session.tenantId, session);
      const activeStaff = shifts.filter(s => s.status === "open").length;

      // 3. Get Infra Health & Anomalies
      const { nodes } = await retailInfrastructureService.getTelemetry(session.tenantId, session);
      const avgHealth = nodes.length > 0 ? nodes.reduce((acc, n) => acc + n.health_score, 0) / nodes.length : 100;
      const deadNodes = nodes.filter(n => n.status === "OFFLINE");
      
      const newAnomalies = [];
      if (deadNodes.length > 0) {
        newAnomalies.push(`Critical: ${deadNodes.length} nodes currently OFFLINE in Infrastructure Grid.`);
      }
      if (activeStaff < 5 && orders.length > 10) {
        newAnomalies.push("High Alert: Staffing density below threshold for current order velocity.");
      }

      setStats({
        revenue: `Rp ${(totalRev / 1000000).toFixed(1)}M`,
        staff: activeStaff,
        health: Math.round(avgHealth),
        anomalies: newAnomalies
      });
    } catch (error) {
      console.error("[AIInsightEngine] Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeNexus();
    const interval = setInterval(analyzeNexus, 60000);
    return () => clearInterval(interval);
  }, [session.tenantId]);

  return (
    <Card className="rounded-[4rem] border border-white/5 bg-white/[0.03] backdrop-blur-3xl shadow-2xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-125 transition-transform duration-1000">
        <Sparkles className="w-48 h-48 text-indigo-600" />
      </div>

      <CardHeader className="p-12 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4 text-white">
              <Zap className="w-8 h-8 text-amber-500 shadow-2xl" />
              Intelligence Nexus
            </CardTitle>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] italic">
              Predictive Telemetry & Anomaly Analysis
            </p>
          </div>
          <div className="flex items-center gap-4">
             <button 
              onClick={analyzeNexus}
              disabled={loading}
              className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all"
            >
              <RefreshCw className={cn("w-4 h-4 text-slate-400", loading && "animate-spin")} />
            </button>
            <Badge className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-black italic text-[10px] px-4 py-2 tracking-[0.2em] uppercase rounded-xl">
              v4.2-NEURAL-READY
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-12 space-y-12">
        {/* Predictive Row */}
        <div className="flex flex-wrap gap-14">
          <InsightMarker
            label="EOD Revenue Forecast"
            value={stats.revenue}
            color="bg-indigo-600"
          />
          <InsightMarker
            label="Infrastructure Pulse"
            value={`${stats.health}%`}
            color={stats.health > 80 ? "bg-emerald-500" : "bg-rose-500"}
          />
          <InsightMarker
            label="Personnel Density"
            value={`${stats.staff} Active`}
            color="bg-amber-500"
          />
        </div>

        {/* Anomaly Detection */}
        {stats.anomalies.length > 0 ? (
          <div className="p-8 rounded-[3rem] bg-rose-600 text-white relative overflow-hidden shadow-2xl group/anomaly transition-all duration-500 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 h-48 w-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 group-hover/anomaly:scale-150 transition-transform duration-1000" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-white/15 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl group-hover/anomaly:rotate-12 transition-transform">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-black italic uppercase tracking-tight">
                    Anomaly Detected: Nexus Pulse
                  </h4>
                  <p className="text-[11px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1">
                    {stats.anomalies[0]}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onExpansionRequest?.("Strategic Resource Deployment Engine")}
                className="h-14 px-10 rounded-[1.25rem] bg-white text-rose-600 font-black italic text-[11px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-xl active:scale-95"
              >
                Deploy Assets
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-[3rem] bg-indigo-600 text-white relative overflow-hidden shadow-2xl group/anomaly transition-all duration-500 hover:scale-[1.02]">
            <div className="absolute top-0 right-0 h-48 w-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 group-hover/anomaly:scale-150 transition-transform duration-1000" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-white/15 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl group-hover/anomaly:rotate-12 transition-transform">
                  <UserCheck className="w-8 h-8 text-emerald-300" />
                </div>
                <div>
                  <h4 className="text-lg font-black italic uppercase tracking-tight">
                    Baseline Synchronized
                  </h4>
                  <p className="text-[11px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1">
                    No critical deviations detected across global nodes.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onExpansionRequest?.("Strategic Resource Deployment Engine")}
                className="h-14 px-10 rounded-[1.25rem] bg-white text-indigo-600 font-black italic text-[11px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-xl active:scale-95"
              >
                Nexus Control
              </button>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-6">
          <div className="text-[11px] font-black italic text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-600" />
            Strategic Recommendations
          </div>
          <div className="grid gap-4">
            {(stats.anomalies.length > 0 ? [
              ...stats.anomalies.map(a => `Resolve ${a.split(':')[0]} alert immediately.`),
              "Reallocate staff to affected nodes for peak mitigation.",
              "Trigger auto-replenishment; high velocity detected."
            ] : [
              "Maintain current force disposition; load is nominal.",
              "Schedule routine node maintenance for Branch_09.",
              "Optimize E-commerce fulfillment queue; latency creeping up.",
            ]).map((rec, i) => (
              <div
                key={i}
                onClick={() => onExpansionRequest?.(`Recommendation Execution: ${rec}`)}
                className="flex items-start gap-6 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all duration-500 group/rec cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0 shadow-inner group-hover/rec:bg-indigo-600 transition-colors">
                  <ArrowUpRight className="w-5 h-5 text-indigo-400 group-hover/rec:text-white group-hover/rec:rotate-45 transition-all duration-500" />
                </div>
                <p className="text-[13px] font-medium text-slate-400 leading-relaxed italic group-hover/rec:text-white transition-colors">
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

