import React from "react";
import { DollarSign, ShoppingBag, Users, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MetricsGridProps {
  stats: {
    totalSales: number;
    orderCount: number;
    avgTicket: number;
    activeDevices: number;
  };
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ stats }) => {
  const metrics = [
    {
      label: "Gross Revenue",
      val: `Rp ${(stats.totalSales / 1000000).toFixed(1)}M`,
      sub: "Daily Accumulation",
      icon: DollarSign,
      color: "blue",
    },
    {
      label: "Volume Index",
      val: stats.orderCount.toString(),
      sub: `${(stats.avgTicket / 1000).toFixed(0)}k Avg Ticket`,
      icon: ShoppingBag,
      color: "indigo",
    },
    {
      label: "Human Assets",
      val: "12 Online",
      sub: `${stats.activeDevices} Active Terminals`,
      icon: Users,
      color: "emerald",
    },
    {
      label: "Policy Guard",
      val: "PLATINUM",
      sub: "0 Violations Logged",
      icon: ShieldCheck,
      color: "amber",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((m, i) => (
        <Card
          key={i}
          className="rounded-[2rem] p-6 bg-white border-slate-200 shadow-xl group hover:border-blue-200 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start mb-8">
            <div
              className={cn(
                "p-4 rounded-2xl",
                m.color === "blue" && "bg-blue-50 text-blue-600",
                m.color === "indigo" && "bg-indigo-50 text-indigo-600",
                m.color === "emerald" && "bg-emerald-50 text-emerald-600",
                m.color === "amber" && "bg-amber-50 text-amber-600",
              )}
            >
              <m.icon className="w-5 h-5" />
            </div>
            <Badge className="bg-slate-50 text-slate-400 font-bold italic text-[8px] uppercase tracking-widest border-none">
              Vitals
            </Badge>
          </div>
          <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 mb-1">
            {m.label}
          </div>
          <div className="text-3xl font-black italic tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors uppercase">
            {m.val}
          </div>
          <div className="text-[10px] font-bold italic text-slate-400 mt-2 uppercase">
            {m.sub}
          </div>
        </Card>
      ))}
    </div>
  );
};
