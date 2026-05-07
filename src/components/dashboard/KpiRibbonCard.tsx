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

  const trendColors = {
    up: "text-emerald-500 bg-emerald-50",
    down: "text-rose-500 bg-rose-50",
    flat: "text-amber-500 bg-amber-50"
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
        "group relative flex flex-col gap-4 rounded-[2.5rem] border bg-white/80 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10",
        navigateTo && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("rounded-2xl p-3", trendColors[trend])}>
          <IconComponent className="h-6 w-6" />
        </div>
        <div className="h-12 w-24 opacity-50 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={trend === 'up' ? '#10b981' : trend === 'down' ? '#f43f5e' : '#f59e0b'} 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        <h3 className="text-3xl font-black text-foreground">
          {currency ? (typeof value === 'number' ? `$${(value / 1000).toFixed(1)}k` : value) : value}
        </h3>
      </div>

      <div className="flex items-center gap-2">
        <div className={cn("flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold", trendColors[trend])}>
          <TrendIcon className="h-3 w-3" />
          {delta || (trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '0%')}
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">vs last period</span>
      </div>

      {/* Decorative background circle */}
      <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10" />
    </div>
  );
};
