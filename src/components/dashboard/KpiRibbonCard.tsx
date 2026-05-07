import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface KpiRibbonCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  sparklineData?: number[];
  icon: string;
  navigateTo?: string;
  currency?: boolean;
}

export const KpiRibbonCard: React.FC<KpiRibbonCardProps> = ({
  label,
  value,
  delta,
  trend = 'flat',
  sparklineData = [30, 40, 35, 50, 49, 60, 70, 91],
  icon,
  navigateTo,
  currency
}) => {
  const navigate = useNavigate();
  const IconComponent = (Icons as any)[icon] || Icons.HelpCircle;

  const trendStyles = {
    up: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    down: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    flat: "text-amber-400 bg-amber-500/10 border-amber-500/20"
  };

  const trendIcons = {
    up: ArrowUpRight,
    down: ArrowDownRight,
    flat: Minus
  };

  const TrendIcon = trendIcons[trend];
  const chartData = sparklineData.map((val, i) => ({ value: val, index: i }));

  return (
    <div 
      onClick={() => navigateTo && navigate(navigateTo)}
      className={cn(
        "group relative flex flex-col gap-6 rounded-[2.5rem] border border-slate-800 bg-slate-900 p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20",
        navigateTo && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("rounded-2xl p-4 transition-colors duration-500", trendStyles[trend], "group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/20")}>
          <IconComponent className="h-6 w-6" />
        </div>
        <div className="h-10 w-20 opacity-40 group-hover:opacity-100 transition-opacity duration-700">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={trend === 'up' ? '#10b981' : trend === 'down' ? '#f43f5e' : '#f59e0b'} 
                strokeWidth={2.5} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <h3 className="text-4xl font-black tracking-tighter text-white">
          {currency ? (typeof value === 'number' ? `$${(value / 1000).toFixed(1)}k` : value) : value}
        </h3>
      </div>

      <div className="flex items-center gap-3">
        <div className={cn("flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black border", trendStyles[trend])}>
          <TrendIcon className="h-3 w-3" />
          {delta || (trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '0%')}
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">vs last period</span>
      </div>

      {/* Premium background glow */}
      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
  );
};
