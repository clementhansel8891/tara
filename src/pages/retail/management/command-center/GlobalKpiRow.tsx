import React from "react";
import { GlobalKpis } from "@/core/types/retail/analytics";
import {
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Users,
  Smartphone,
  AlertTriangle,
  Target,
  Percent,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface GlobalKpiRowProps {
  kpis: GlobalKpis;
}

export const GlobalKpiRow: React.FC<GlobalKpiRowProps> = ({ kpis }) => {
  const sparklineWrapper = (data: number[] | undefined, color: string) => {
    if (!data) return null;
    return (
      <div className="h-10 w-full mt-2 opacity-50">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={(Array.isArray(data) ? data : []).map((v) => ({ v }))}>
            <defs>
              <linearGradient id={`color-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color-${color})`}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const items = [
    {
      label: "Live Revenue",
      value: `Rp ${(kpis.totalRevenueToday / 1000000).toFixed(1)}M`,
      icon: TrendingUp,
      color: "#10b981", // emerald-500
      accent: "bg-success/20",
      border: "hover:border-emerald-500/30",
      sparkline: kpis.sparklineData?.revenue,
    },
    {
      label: "Target Velocity",
      value: `${kpis.revenueVsTarget}%`,
      icon: Target,
      color: "#6366f1", // indigo-500
      accent: "bg-primary/20",
      border: "hover:border-indigo-500/30",
      sparkline: kpis.sparklineData?.conversion,
    },
    {
      label: "Order Traffic",
      value: kpis.orderCount,
      icon: ShoppingCart,
      color: "#3b82f6", // blue-500
      accent: "bg-primary/20",
      border: "hover:border-blue-500/30",
      sparkline: kpis.sparklineData?.orders,
    },
    {
      label: "Avg Ticket",
      value: `Rp ${(kpis.avgTicketSize / 1000).toFixed(0)}k`,
      icon: CreditCard,
      color: "#94a3b8", // slate-400
      accent: "bg-muted/40/20",
      border: "hover:border-slate-400/30",
      sparkline: kpis.sparklineData?.ticket,
    },
    {
      label: "Profit Margin",
      value: `${kpis.grossMarginPercentage}%`,
      icon: Percent,
      color: "#8b5cf6", // violet-500
      accent: "bg-violet-500/20",
      border: "hover:border-violet-500/30",
    },
    {
      label: "Node Health",
      value: kpis.activeDevices,
      icon: Smartphone,
      color: "#f59e0b", // amber-500
      accent: "bg-amber-500/20",
      border: "hover:border-amber-500/30",
    },
    {
      label: "Active Shifts",
      value: kpis.openShifts,
      icon: Users,
      color: "#0ea5e9", // sky-500
      accent: "bg-sky-500/20",
      border: "hover:border-sky-500/30",
    },
    {
      label: "System Alerts",
      value: kpis.criticalAlertsCount,
      icon: AlertTriangle,
      color: "#f43f5e", // rose-500
      accent: "bg-destructive/20",
      border: "hover:border-rose-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {(Array.isArray(items) ? items : []).map((item, idx) => (
        <div
          key={idx}
          className={`relative bg-white/[0.03] backdrop-blur-3xl p-4 rounded-xl border border-white/5 shadow-xl transition-all duration-500 ${item.border} hover:bg-white/[0.05] hover:-translate-y-0.5 cursor-default group flex flex-col justify-between min-h-[130px] overflow-hidden`}
        >
          {/* Subtle Background Glow */}
          <div
            className={`absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10 blur-[50px] transition-all duration-700 group-hover:scale-150 ${item.accent}`}
          />

          <div className="flex items-center justify-between relative z-10">
            <div
              className={`w-9 h-9 rounded-lg ${item.accent} flex items-center justify-center transition-all duration-500 group-hover:rotate-6 border border-white/5 shadow-lg`}
            >
              <item.icon className={`w-4 h-4`} style={{ color: item.color }} />
            </div>
            {idx < 2 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/10 border border-emerald-500/20 animate-pulse">
                <div className="w-1 h-1 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[7px] font-black text-success uppercase tracking-widest italic">
                  LIVE
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col relative z-10">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5 italic">
              {item.label}
            </p>
            <div className="flex items-end justify-between gap-3">
              <p className="text-lg font-black italic text-foreground tracking-tighter whitespace-nowrap">
                {item.value}
              </p>
              {item.sparkline && (
                <div className="flex-1 max-w-[60px]">
                  {sparklineWrapper(item.sparkline, item.color)}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
