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

interface FinancialTrajectoryChartProps {
  data: { month: string; revenue: number; expenses: number; profit?: number }[];
}

export const FinancialTrajectoryChart: React.FC<FinancialTrajectoryChartProps> = ({ data }) => {
  const formattedData = data.map(d => ({
    ...d,
    profit: d.revenue - d.expenses
  }));

  return (
    <WorkspacePanel 
      title="Financial Trajectory" 
      description="Revenue vs Operating Expenses vs Gross Profit"
      variant="glass"
      action={
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold">3M</Button>
          <Button variant="secondary" size="sm" className="h-7 text-[10px] font-bold bg-indigo-50 text-indigo-600 border-indigo-100">6M</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold">12M</Button>
        </div>
      }
    >
      <div className="h-[300px] w-100%">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: 12, fontWeight: 600 }}
            />
            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
            <Area type="monotone" dataKey="revenue" fill="url(#colorRevenue)" stroke="#4f46e5" strokeWidth={3} />
            <Bar dataKey="expenses" barSize={20} fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={0.3} />
            <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </WorkspacePanel>
  );
};
