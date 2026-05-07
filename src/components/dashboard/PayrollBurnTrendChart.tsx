import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';

export const PayrollBurnTrendChart: React.FC = () => {
  const navigate = useNavigate();

  // Mocking payroll trend as per plan
  const data = [
    { month: 'Jan', gross: 175000 },
    { month: 'Feb', gross: 178000 },
    { month: 'Mar', gross: 182000 },
    { month: 'Apr', gross: 184000 },
    { month: 'May', gross: 184000 },
    { month: 'Jun', gross: 189000 },
  ];

  return (
    <WorkspacePanel 
      title="Payroll Burn Trend" 
      description="Monthly workforce expenditure trajectory"
      variant="glass"
      className="cursor-pointer"
      onClick={() => navigate('/core/hr/paycycle')}
    >
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} tickFormatter={(val) => `$${val/1000}k`} />
            <Tooltip 
              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="gross" radius={[6, 6, 0, 0]} barSize={24}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === data.length - 1 ? '#4f46e5' : '#c7d2fe'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WorkspacePanel>
  );
};
