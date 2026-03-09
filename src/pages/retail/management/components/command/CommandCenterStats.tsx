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
      "border-none shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group overflow-hidden relative bg-white/80 backdrop-blur-xl",
      className,
    )}
  >
    <div
      className={cn("absolute top-0 left-0 w-1.5 h-full opacity-60", color)}
    />
    <CardContent className="p-8">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
            {label}
          </p>
          <h3 className="text-4xl font-black italic tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors uppercase leading-none">
            {value}
          </h3>
          {trend && (
            <div className="flex items-center gap-2 mt-4">
              <div
                className={cn(
                  "flex items-center gap-0.5 px-2 py-1 rounded-lg text-[9px] font-black italic uppercase",
                  trend.isPositive
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-red-500/10 text-red-600",
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {trend.value}
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Global Index
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "p-4 rounded-[1.5rem] bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-700 shadow-sm",
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-1000 pointer-events-none" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <StatCard
        label="Gross Direct Sales"
        value={`Rp ${(totalSales / 1000000).toFixed(1)}M`}
        icon={TrendingUp}
        trend={{ value: "12.5%", isPositive: true }}
        color="bg-blue-600"
      />
      <StatCard
        label="Fleet Volume"
        value={orderCount}
        icon={Receipt}
        trend={{ value: "4.2%", isPositive: true }}
        color="bg-indigo-600"
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
