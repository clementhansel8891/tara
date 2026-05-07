import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Clock, BadgeDollarSign } from 'lucide-react';

interface HrCapitalWidgetProps {
  distribution: { department: string; count: number; color: string }[];
}

export const HrCapitalWidget: React.FC<HrCapitalWidgetProps> = ({ distribution }) => {
  const navigate = useNavigate();

  return (
    <WorkspacePanel 
      title="HR Capital & Workforce" 
      description="Distribution and performance metrics"
      variant="glass"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="count"
              >
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/50 p-3 transition-colors hover:bg-indigo-50 cursor-pointer" onClick={() => navigate('/core/hr/scheduling')}>
            <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500">Attendance</p>
              <p className="text-sm font-black text-slate-900">94.2%</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/50 p-3 transition-colors hover:bg-emerald-50 cursor-pointer" onClick={() => navigate('/core/hr/talent')}>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500">Open Roles</p>
              <p className="text-sm font-black text-slate-900">12</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
        <div className="flex flex-col cursor-pointer" onClick={() => navigate('/core/hr/paycycle')}>
          <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
            <BadgeDollarSign className="h-3 w-3" /> Payroll Burn
          </p>
          <p className="text-lg font-black text-rose-600">$184k<span className="text-[10px] font-bold text-muted-foreground ml-1">/mo</span></p>
        </div>
        <div className="flex flex-col cursor-pointer" onClick={() => navigate('/core/hr/people')}>
          <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> Total Staff
          </p>
          <p className="text-lg font-black text-indigo-600">{distribution.reduce((acc, curr) => acc + curr.count, 0)}</p>
        </div>
      </div>
    </WorkspacePanel>
  );
};
