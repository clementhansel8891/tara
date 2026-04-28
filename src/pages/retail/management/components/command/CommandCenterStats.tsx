import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Receipt,
  Monitor,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon,
} from "lucide-react";

interface StatsProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: string;
  className?: string;
}

const StatCard: React.FC<StatsProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  color,
  className,
}) => (
  <Card
    className={cn(
      "border border-white/5 shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 group overflow-hidden relative bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem]",
      className,
    )}
  >
    <div
      className={cn("absolute top-0 left-0 w-2 h-full opacity-40 group-hover:opacity-100 transition-opacity", color)}
    />
    <CardContent className="p-10">
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-6">
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 italic">
            {label}
          </p>
          <h3 className="text-5xl font-black italic tracking-tighter text-white group-hover:text-indigo-400 transition-colors uppercase leading-none italic">
            {value}
          </h3>
          {trend && (
            <div className="flex items-center gap-4 mt-6">
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black italic uppercase shadow-xl",
                  trend.isPositive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30",
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {trend.value}
              </div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">
                Global Index
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-16 h-16 rounded-[1.5rem] bg-white/5 text-slate-500 border border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6 transition-all duration-700 shadow-2xl",
          )}
        >
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </CardContent>
    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-1000 pointer-events-none" />
  </Card>
);

export const CommandCenterStats = ({
  totalSales,
  orderCount,
  activeTerminals,
  systemStatus,
}: {
  totalSales: number;
  orderCount: number;
  activeTerminals: string;
  systemStatus: string;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
      <StatCard
        label="Gross Direct Sales"
        value={`Rp ${(totalSales / 1000000).toFixed(1)}M`}
        icon={TrendingUp}
        trend={{ value: "12.5%", isPositive: true }}
        color="bg-indigo-600"
      />
      <StatCard
        label="Fleet Volume"
        value={orderCount}
        icon={Receipt}
        trend={{ value: "4.2%", isPositive: true }}
        color="bg-violet-600"
      />
      <StatCard
        label="Terminal Integrity"
        value={activeTerminals}
        icon={Monitor}
        color="bg-emerald-600"
      />
      <StatCard
        label="Edge Latency"
        value={systemStatus}
        icon={Activity}
        color="bg-amber-600"
      />
    </div>
  );
};
