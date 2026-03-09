import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const InsightMarker = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <div className="space-y-1.5 flex-1">
    <p className="text-[10px] font-black italic uppercase tracking-widest text-slate-400">
      {label}
    </p>
    <div className="flex items-center gap-2">
      <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", color)} />
      <span className="text-xl font-black italic tracking-tighter text-slate-900">
        {value}
      </span>
    </div>
  </div>
);

export const AIInsightEngine = () => {
  return (
    <Card className="rounded-[3rem] border-none shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
        <Sparkles className="w-32 h-32 text-blue-600" />
      </div>

      <CardHeader className="p-10 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <Zap className="w-6 h-6 text-amber-500" />
              Intelligence Nexus
            </CardTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Predictive Telemetry & Anomaly Analysis
            </p>
          </div>
          <Badge className="bg-slate-900 text-white font-black italic text-[9px] px-3 py-1 tracking-widest uppercase">
            v4.2-NEURAL-READY
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-10 space-y-10">
        {/* Predictive Row */}
        <div className="flex flex-wrap gap-12">
          <InsightMarker
            label="EOD Revenue Forecast"
            value="Rp 842.5M"
            color="bg-blue-600"
          />
          <InsightMarker
            label="Customer Pulse"
            value="98.2%"
            color="bg-emerald-500"
          />
          <InsightMarker
            label="Inventory Run-rate"
            value="14 Days"
            color="bg-amber-500"
          />
        </div>

        {/* Anomaly Detection */}
        <div className="p-6 rounded-[2rem] bg-indigo-600 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <AlertTriangle className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h4 className="text-sm font-black italic uppercase tracking-tight">
                  Anomaly Detected: Branch_Node_04
                </h4>
                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                  Unexpected Load Surge (+42%) vs. Baseline
                </p>
              </div>
            </div>
            <button className="h-10 px-6 rounded-xl bg-white text-indigo-600 font-black italic text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">
              Deploy Resources
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-5">
            <TrendingUp className="w-32 h-32" />
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-4">
          <div className="text-[10px] font-black italic text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
            AI Recommendations
          </div>
          {[
            "Reallocate 3 staff from Zone B to Branch_04 for peak mitigation.",
            "Trigger auto-replenishment for SKU-991; high velocity detected.",
            "Optimize E-commerce fulfillment queue; latency creeping up.",
          ].map((rec, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors group"
            >
              <div className="w-6 h-6 rounded-lg bg-white border flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3 h-3 text-blue-600 group-hover:rotate-45 transition-transform" />
              </div>
              <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">
                {rec}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
