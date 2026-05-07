import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface MarketingRoiChartProps {
  data: { week: string; adSpend: number; sales: number; roi?: number }[];
}

export const MarketingRoiChart: React.FC<MarketingRoiChartProps> = ({ data = [] }) => {
  const navigate = useNavigate();

  const formattedData = data.map(d => ({
    ...d,
    roi: d.adSpend > 0 ? (d.sales / d.adSpend) : 0
  }));

  return (
    <WorkspacePanel 
      title="Marketing Campaign ROI" 
      description="Advertising spend vs Gross sales efficiency"
      variant="glass"
      className="cursor-pointer"
      onClick={() => navigate('/core/marketing/analytics')}
    >
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} tickFormatter={(val) => `$${val/1000}k`} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} tickFormatter={(val) => `${val}x`} />
            <Tooltip 
              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
            <Bar yAxisId="left" dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
            <Line yAxisId="left" type="monotone" dataKey="adSpend" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} />
            <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#10b981' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </WorkspacePanel>
  );
};
