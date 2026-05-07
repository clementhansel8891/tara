import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { useNavigate } from 'react-router-dom';

export const ArApWaterfallChart: React.FC = () => {
  const navigate = useNavigate();
  
  // Mocking aging data as per plan
  const data = [
    { bucket: 'Current', ar: 45000, ap: 32000 },
    { bucket: '1-30d', ar: 28000, ap: 15000 },
    { bucket: '31-60d', ar: 12000, ap: 8000 },
    { bucket: '61-90d', ar: 5000, ap: 12000 },
    { bucket: '90d+', ar: 8000, ap: 4000 },
  ];

  return (
    <WorkspacePanel 
      title="AR/AP Aging Waterfall" 
      description="Accounts Receivable vs Payable Aging Buckets"
      variant="glass"
    >
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
            <YAxis 
              dataKey="bucket" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="ar" fill="#10b981" radius={[0, 4, 4, 0]} onClick={() => navigate('/core/finance/receivables')} />
            <Bar dataKey="ap" fill="#f43f5e" radius={[0, 4, 4, 0]} onClick={() => navigate('/core/finance/payables')} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex justify-around border-t pt-4">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase text-muted-foreground">Net Working Cap</p>
          <p className="text-lg font-black text-emerald-600">+$27.0k</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase text-muted-foreground">Collection Ratio</p>
          <p className="text-lg font-black text-indigo-600">92.4%</p>
        </div>
      </div>
    </WorkspacePanel>
  );
};
