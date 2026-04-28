import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ShieldAlert,
  DollarSign,
  Server,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedItemProps {
  type: "FINANCE" | "INFRA" | "SECURITY" | "RETAIL";
  message: string;
  timestamp: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

const FeedItem: React.FC<FeedItemProps> = ({
  type,
  message,
  timestamp,
  priority,
}) => (
  <div className="flex items-start gap-5 p-6 rounded-[2rem] bg-white/[0.03] backdrop-blur-3xl border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all duration-500 group cursor-pointer shadow-lg relative overflow-hidden">
    <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    <div
      className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-all duration-500 group-hover:scale-110 shadow-2xl",
        type === "FINANCE"
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          : type === "INFRA"
            ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            : type === "SECURITY"
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400",
      )}
    >
      {type === "FINANCE" ? (
        <DollarSign className="w-6 h-6" />
      ) : type === "INFRA" ? (
        <Server className="w-6 h-6" />
      ) : type === "SECURITY" ? (
        <ShieldAlert className="w-6 h-6" />
      ) : (
        <ShoppingBag className="w-6 h-6" />
      )}
    </div>

    <div className="flex-1 min-w-0 relative z-10">
      <div className="flex items-center justify-between mb-2">
        <Badge
          className={cn(
            "text-[9px] font-black italic tracking-[0.2em] border-none px-2.5 h-5 rounded-lg uppercase",
            priority === "HIGH"
              ? "bg-rose-500/20 text-rose-400"
              : priority === "MEDIUM"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-slate-500/20 text-slate-400",
          )}
        >
          {priority}
        </Badge>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
          {timestamp}
        </span>
      </div>
      <p className="text-[12px] font-medium text-slate-400 leading-tight italic truncate group-hover:text-clip group-hover:whitespace-normal group-hover:text-white transition-colors">
        {message}
      </p>
    </div>

    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600 transition-colors self-center">
      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
    </div>
  </div>
);

export const GlobalActivityFeed = ({
  onExpansionRequest
}: {
  onExpansionRequest: (feature: string) => void;
}) => {
  return (
    <Card className="rounded-[4rem] border border-white/5 bg-white/[0.03] backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col h-full group/feed">
      <CardHeader className="p-14 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <CardTitle className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-6 text-white italic">
              <Activity className="w-8 h-8 text-indigo-400 shadow-2xl animate-pulse" />
              Telemetry Feed
            </CardTitle>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] italic">
              Global Synchronization Log
            </p>
          </div>
          <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-xl">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black italic uppercase text-emerald-400 tracking-[0.2em] italic">
              Synchronized
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-10 flex-1 overflow-y-auto space-y-4 custom-scrollbar bg-transparent">
        {[
          {
            type: "SECURITY",
            priority: "HIGH",
            message:
              "Unauthorized hardware node connection attempt blocked at Branch_03.",
            timestamp: "14:52:10",
          },
          {
            type: "FINANCE",
            priority: "MEDIUM",
            message:
              "Settlement Batch #291 reconciled with central bank ledger.",
            timestamp: "14:50:05",
          },
          {
            type: "RETAIL",
            priority: "LOW",
            message:
              "New seasonal promotion 'Ramadan Glow' deployed to 42 terminals.",
            timestamp: "14:48:22",
          },
          {
            type: "INFRA",
            priority: "HIGH",
            message:
              "Edge Gateway latency at Branch_12 exceeded threshold (450ms).",
            timestamp: "14:45:12",
          },
          {
            type: "FINANCE",
            priority: "HIGH",
            message:
              "Anomalous transaction value detected (Rp 150M) - Awaiting HOD approval.",
            timestamp: "14:42:00",
          },
          {
            type: "RETAIL",
            priority: "MEDIUM",
            message:
              "Stock replenishment triggered for Node_04 (Electronics Category).",
            timestamp: "14:40:15",
          },
          {
            type: "SECURITY",
            priority: "MEDIUM",
            message:
              "Policy update: Biometric auth enforced for high-value returns.",
            timestamp: "14:38:10",
          },
          {
            type: "INFRA",
            priority: "LOW",
            message:
              "Scheduled maintenance: Branch_09 Edge Node update at 22:00.",
            timestamp: "14:35:05",
          },
        ].map((item, i) => (
          <FeedItem key={i} {...(item as any)} />
        ))}
      </CardContent>

      <div className="p-12 border-t border-white/5 bg-white/[0.01]">
        <button 
          onClick={() => onExpansionRequest("Deep Audit Virtual Vault")}
          className="w-full h-16 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black italic text-[12px] uppercase tracking-[0.3em] transition-all shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 flex items-center justify-center gap-4 italic"
        >
          Access Deep Audit Vault <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
};

