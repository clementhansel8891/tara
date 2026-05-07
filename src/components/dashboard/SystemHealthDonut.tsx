import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface SystemHealthDonutProps {
  data: { name: string; value: number; color: string }[];
}

export const SystemHealthDonut: React.FC<SystemHealthDonutProps> = ({ data }) => {
  const navigate = useNavigate();
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const optimal = data.find(d => d.name === 'Optimal')?.value || 0;
  const percentage = total > 0 ? Math.round((optimal / total) * 100) : 0;

  return (
    <WorkspacePanel 
      title="Core Integrity" 
      description="Service uptime and synchronization status"
      variant="glass"
      className="cursor-pointer"
      onClick={() => navigate('/core/it/health')}
    >
      <div className="relative h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-black text-slate-900">{percentage}%</p>
          <p className="text-[10px] font-black uppercase text-emerald-500">Stable</p>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs font-bold text-slate-600">{optimal} / {total} services active</p>
      </div>
    </WorkspacePanel>
  );
};
