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
      "glass-card group overflow-hidden relative border-border/50",
      className,
    )}
  >
    <div
      className={cn("absolute top-0 left-0 w-1.5 h-full opacity-60 group-hover:opacity-100 transition-opacity", color)}
    />
    <CardContent className="p-8">
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4">
          <p className="text-label text-muted-foreground">
            {label}
          </p>
          <h3 className="text-4xl font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors uppercase leading-none">
            {value}
          </h3>
          {trend && (
            <div className="flex items-center gap-3 pt-2">
              <Badge variant={trend.isPositive ? "success" : "destructive"}>
                {trend.isPositive ? (
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                )}
                {trend.value}
              </Badge>
              <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] italic">
                VS_PREV_NODE
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-14 h-14 rounded-2xl bg-surface-2 text-muted-foreground border border-border/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-6 transition-premium shadow-xl",
          )}
        >
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </CardContent>
    <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-premium pointer-events-none" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
      <StatCard
        label="Gross Direct Sales"
        value={`Rp ${(totalSales / 1000000).toFixed(1)}M`}
        icon={TrendingUp}
        trend={{ value: "12.5%", isPositive: true }}
        color="bg-primary shadow-[0_0_20px_rgba(var(--primary),0.4)]"
      />
      <StatCard
        label="Fleet Volume"
        value={orderCount}
        icon={Receipt}
        trend={{ value: "4.2%", isPositive: true }}
        color="bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
      />
      <StatCard
        label="Terminal Integrity"
        value={activeTerminals}
        icon={Monitor}
        color="bg-success shadow-[0_0_20px_rgba(var(--success),0.4)]"
      />
      <StatCard
        label="Edge Latency"
        value={systemStatus}
        icon={Activity}
        color="bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
      />
    </div>
  );
};

