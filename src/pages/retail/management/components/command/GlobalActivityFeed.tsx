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
  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 hover:bg-white backdrop-blur-sm border border-slate-100 hover:border-blue-200 transition-all group cursor-pointer">
    <div
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
        type === "FINANCE"
          ? "bg-emerald-50 border-emerald-100 text-emerald-600"
          : type === "INFRA"
            ? "bg-blue-50 border-blue-100 text-blue-600"
            : type === "SECURITY"
              ? "bg-red-50 border-red-100 text-red-600"
              : "bg-amber-50 border-amber-100 text-amber-600",
      )}
    >
      {type === "FINANCE" ? (
        <DollarSign className="w-5 h-5" />
      ) : type === "INFRA" ? (
        <Server className="w-5 h-5" />
      ) : type === "SECURITY" ? (
        <ShieldAlert className="w-5 h-5" />
      ) : (
        <ShoppingBag className="w-5 h-5" />
      )}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <Badge
          className={cn(
            "text-[8px] font-black italic tracking-widest border-none px-1.5 h-4",
            priority === "HIGH"
              ? "bg-red-500 text-white"
              : priority === "MEDIUM"
                ? "bg-amber-500 text-white"
                : "bg-slate-500 text-white",
          )}
        >
          {priority}
        </Badge>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
          {timestamp}
        </span>
      </div>
      <p className="text-[11px] font-bold text-slate-700 leading-tight italic truncate group-hover:text-clip group-hover:whitespace-normal">
        {message}
      </p>
    </div>

    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all self-center" />
  </div>
);

export const GlobalActivityFeed = () => {
  return (
    <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-50/50 backdrop-blur-xl overflow-hidden flex flex-col h-full">
      <CardHeader className="p-10 border-b bg-white/80">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-600" />
              Live Telemetry Feed
            </CardTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Global Synchronization Log (All Nodes)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black italic uppercase text-slate-900">
              Synchronized
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
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

      <div className="p-8 border-t bg-white/50 backdrop-blur-sm">
        <button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black italic text-[11px] uppercase tracking-widest transition-colors flex items-center justify-center gap-3">
          Access Deep Audit Vault <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
};
