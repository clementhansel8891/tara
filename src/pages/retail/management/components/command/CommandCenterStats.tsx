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
      "border border-white/5 shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 group overflow-hidden relative bg-white/[0.03] backdrop-blur-3xl rounded-2xl",
      className,
    )}
  >
    <div
      className={cn("absolute top-0 left-0 w-2 h-full opacity-40 group-hover:opacity-100 transition-opacity", color)}
    />
    <CardContent className="p-5">
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
            {label}
          </p>
          <h3 className="text-2xl font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors uppercase leading-none italic">
            {value}
          </h3>
          {trend && (
            <div className="flex items-center gap-3 mt-4">
              <div
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black italic uppercase shadow-xl",
                  trend.isPositive
                    ? "bg-success/20 text-success border border-emerald-500/30"
                    : "bg-destructive/20 text-rose-400 border border-rose-500/30",
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {trend.value}
              </div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">
                Index
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl bg-secondary/40 text-muted-foreground border border-border flex items-center justify-center group-hover:bg-primary group-hover:text-foreground group-hover:rotate-6 transition-all duration-700 shadow-2xl",
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-1000 pointer-events-none" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <StatCard
        label="Gross Direct Sales"
        value={`Rp ${(totalSales / 1000000).toFixed(1)}M`}
        icon={TrendingUp}
        trend={{ value: "12.5%", isPositive: true }}
        color="bg-primary"
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
        color="bg-success"
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
