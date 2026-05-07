import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EnterpriseHealthWidget: React.FC = () => {
  const score = 92;
  const data = [{ value: score }, { value: 100 - score }];

  return (
    <div className="group relative flex flex-col items-center justify-center rounded-[2.5rem] border border-slate-800 bg-slate-900 p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20 overflow-hidden">
      <div className="absolute top-6 left-7 flex flex-col">
         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Enterprise</span>
         <span className="text-sm font-black text-white">Health Index</span>
      </div>
      
      <div className="relative h-28 w-28 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={50}
              startAngle={90}
              endAngle={450}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="#6366f1" />
              <Cell fill="rgba(255,255,255,0.05)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{score}</span>
          <span className="text-[8px] font-black uppercase text-indigo-400">Score</span>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
         <Activity className="h-3 w-3 text-emerald-400" />
         <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Optimal Environment</span>
      </div>
      
      {/* Glow effect */}
      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
  );
};

export const ActionItemsWidget: React.FC = () => {
  const navigate = useNavigate();
  const actions = [
    { title: 'Approve FY26 Budget', time: '2h ago', priority: 'high' },
    { title: 'New Employee Onboarding', time: '4h ago', priority: 'medium' },
    { title: 'Monthly Audit Verification', time: '1d ago', priority: 'low' },
  ];

  return (
    <div className="flex flex-col h-full rounded-[2.5rem] border border-slate-200 bg-white shadow-xl overflow-hidden">
      <div className="p-8 pb-4">
        <h4 className="text-lg font-black text-slate-900">Action Items</h4>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Critical executive tasks</p>
      </div>
      
      <div className="flex-1 px-8 space-y-4">
        {actions.map((action, i) => (
          <div key={i} className="group relative flex items-start gap-4 rounded-2xl border border-slate-50 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md cursor-pointer">
            <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${action.priority === 'high' ? 'bg-rose-500' : action.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
            <div className="flex-1">
              <p className="text-xs font-black text-slate-900">{action.title}</p>
              <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <Clock className="h-3 w-3" /> {action.time}
              </div>
            </div>
            <CheckCircle2 className="h-5 w-5 self-center text-slate-200 group-hover:text-indigo-600 transition-colors" />
          </div>
        ))}
      </div>

      <div className="p-8 pt-4">
        <Button 
          variant="outline" 
          className="w-full rounded-2xl h-14 text-xs font-black uppercase tracking-[0.2em] border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-[0.98] shadow-sm"
          onClick={() => navigate('/core/workflow')}
        >
          VIEW ALL TASKS
        </Button>
      </div>
    </div>
  );
};

export const StrategicScorecard: React.FC = () => {
  return (
    <div className="space-y-6">
      <EnterpriseHealthWidget />
      <ActionItemsWidget />
    </div>
  );
};
