import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface AlertsRiskMatrixProps {
  data: { module: string; critical: number; high: number; medium: number; low: number }[];
}

export const AlertsRiskMatrix: React.FC<AlertsRiskMatrixProps> = ({ data = [] }) => {
  const navigate = useNavigate();

  const mockData = [
    { module: 'Retail', critical: 2, high: 5, medium: 8, low: 12 },
    { module: 'Finance', critical: 0, high: 2, medium: 4, low: 6 },
    { module: 'HR', critical: 1, high: 3, medium: 5, low: 7 },
    { module: 'IT', critical: 0, high: 1, medium: 2, low: 4 },
    { module: 'Inventory', critical: 3, high: 6, medium: 9, low: 11 }
  ];

  const activeData = data.length > 0 ? data : mockData;

  const handleBarClick = (payload: any) => {
    const module = payload.module;
    const routes: Record<string, string> = {
      'Retail': '/m/retail/management',
      'Finance': '/core/finance',
      'HR': '/core/hr',
      'IT': '/core/it/health',
      'Inventory': '/core/inventory'
    };
    if (routes[module]) navigate(routes[module]);
  };

  return (
    <WorkspacePanel 
      title="Alerts Risk Matrix" 
      description="Active issues by module and severity"
      variant="glass"
    >
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activeData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="module" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
            <Bar dataKey="critical" stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} onClick={handleBarClick} className="cursor-pointer" />
            <Bar dataKey="high" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} onClick={handleBarClick} className="cursor-pointer" />
            <Bar dataKey="medium" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} onClick={handleBarClick} className="cursor-pointer" />
            <Bar dataKey="low" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} onClick={handleBarClick} className="cursor-pointer" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WorkspacePanel>
  );
};
