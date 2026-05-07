import React from 'react';
import { 
  ComposedChart, 
  Area, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FinancialTrajectoryChartProps {
  data: { month: string; revenue: number; expenses: number; profit?: number }[];
  period: string;
  onPeriodChange: (period: string) => void;
}

export const FinancialTrajectoryChart: React.FC<FinancialTrajectoryChartProps> = ({ 
  data, 
  period,
  onPeriodChange 
}) => {
  const formattedData = data.map(d => ({
    ...d,
    profit: d.revenue - d.expenses
  }));

  return (
    <div className="flex flex-col h-full rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">Financial Trajectory</h4>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Revenue vs OpEx vs Gross Profit</p>
        </div>
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
          {['3M', '6M', '12M'].map((p) => (
            <Button 
              key={p}
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-8 px-5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300",
                period === p 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
              onClick={() => onPeriodChange(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenuePremium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 800, fill: '#475569', textTransform: 'uppercase' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 800, fill: '#475569' }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                borderRadius: '1.5rem', 
                border: '1px solid rgba(255,255,255,0.1)', 
                boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
                padding: '1rem'
              }}
              itemStyle={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              height={40} 
              iconType="circle" 
              wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              fill="url(#colorRevenuePremium)" 
              stroke="#6366f1" 
              strokeWidth={4} 
              animationDuration={1500}
            />
            <Bar 
              dataKey="expenses" 
              barSize={16} 
              fill="#475569" 
              radius={[4, 4, 0, 0]} 
              opacity={0.4} 
              animationDuration={2000}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              stroke="#10b981" 
              strokeWidth={4} 
              dot={{ r: 5, fill: '#10b981', strokeWidth: 3, stroke: '#0f172a' }} 
              activeDot={{ r: 8, strokeWidth: 0 }}
              animationDuration={2500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
