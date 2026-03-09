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
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface GlobalKpiRowProps {
  kpis: GlobalKpis;
}

export const GlobalKpiRow: React.FC<GlobalKpiRowProps> = ({ kpis }) => {
  const sparklineWrapper = (data: number[] | undefined, color: string) => {
    if (!data) return null;
    return (
      <div className="h-8 w-full mt-2 opacity-50 text-[0px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.map((v) => ({ v }))}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
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
      accent: "bg-emerald-500/10",
      border: "hover:border-emerald-200",
      sparkline: kpis.sparklineData?.revenue,
    },
    {
      label: "Target Velocity",
      value: `${kpis.revenueVsTarget}%`,
      icon: Target,
      color: "#3b82f6", // blue-500
      accent: "bg-blue-500/10",
      border: "hover:border-blue-200",
      sparkline: kpis.sparklineData?.conversion,
    },
    {
      label: "Order Traffic",
      value: kpis.orderCount,
      icon: ShoppingCart,
      color: "#6366f1", // indigo-500
      accent: "bg-indigo-500/10",
      border: "hover:border-indigo-200",
      sparkline: kpis.sparklineData?.orders,
    },
    {
      label: "Avg Ticket",
      value: `Rp ${(kpis.avgTicketSize / 1000).toFixed(0)}k`,
      icon: CreditCard,
      color: "#64748b", // slate-500
      accent: "bg-slate-500/10",
      border: "hover:border-slate-200",
      sparkline: kpis.sparklineData?.ticket,
    },
    {
      label: "Profit Margin",
      value: `${kpis.grossMarginPercentage}%`,
      icon: Percent,
      color: "#8b5cf6", // violet-500
      accent: "bg-violet-500/10",
      border: "hover:border-violet-200",
    },
    {
      label: "Node Health",
      value: kpis.activeDevices,
      icon: Smartphone,
      color: "#f59e0b", // amber-500
      accent: "bg-amber-500/10",
      border: "hover:border-amber-200",
    },
    {
      label: "Active Shifts",
      value: kpis.openShifts,
      icon: Users,
      color: "#0ea5e9", // sky-500
      accent: "bg-sky-500/10",
      border: "hover:border-sky-200",
    },
    {
      label: "System Alerts",
      value: kpis.criticalAlertsCount,
      icon: AlertTriangle,
      color: "#f43f5e", // rose-500
      accent: "bg-rose-500/10",
      border: "hover:border-rose-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`relative bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 ${item.border} hover:shadow-xl hover:-translate-y-1 cursor-default group flex flex-col justify-between min-h-[160px] overflow-hidden`}
        >
          {/* Subtle Background Glow */}
          <div
            className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 ${item.accent}`}
          />

          <div className="flex items-center justify-between relative z-10">
            <div
              className={`w-12 h-12 rounded-2xl ${item.accent} flex items-center justify-center transition-transform duration-300 group-hover:rotate-6 shadow-sm`}
            >
              <item.icon className={`w-5 h-5`} style={{ color: item.color }} />
            </div>
            {idx < 2 && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">
                  Live
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
              {item.label}
            </p>
            <div className="flex items-end justify-between gap-4">
              <p className="text-3xl font-black italic text-slate-900 tracking-tighter whitespace-nowrap">
                {item.value}
              </p>
              {item.sparkline && (
                <div className="flex-1 max-w-[80px]">
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
