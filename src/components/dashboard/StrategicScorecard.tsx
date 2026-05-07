import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const StrategicScorecard: React.FC = () => {
  const navigate = useNavigate();
  const score = 92;
  const data = [{ value: score }, { value: 100 - score }];

  const actions = [
    { title: 'Approve FY26 Budget', time: '2h ago', priority: 'high' },
    { title: 'New Employee Onboarding', time: '4h ago', priority: 'medium' },
    { title: 'Monthly Audit Verification', time: '1d ago', priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      <WorkspacePanel title="Enterprise Health" variant="dark" className="border-indigo-500/20 bg-gradient-to-br from-slate-900 to-indigo-950">
        <div className="flex flex-col items-center py-4">
          <div className="relative h-40 w-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={75}
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
              <span className="text-4xl font-black text-white">{score}</span>
              <span className="text-[10px] font-black uppercase text-indigo-400">Score</span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs font-medium text-slate-400 px-4">
            Overall company health is <span className="font-bold text-emerald-400">Optimal</span> across all modules.
          </p>
        </div>
      </WorkspacePanel>

      <WorkspacePanel title="Action Items" variant="default">
        <div className="space-y-4">
          {actions.map((action, i) => (
            <div key={i} className="group relative flex items-start gap-3 rounded-2xl border border-slate-50 bg-slate-50/50 p-3 transition-all hover:bg-white hover:shadow-sm">
              <div className={`mt-1 h-2 w-2 rounded-full ${action.priority === 'high' ? 'bg-rose-500' : action.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-900">{action.title}</p>
                <div className="mt-1 flex items-center gap-2 text-[9px] font-bold text-slate-400">
                  <Clock className="h-2.5 w-2.5" /> {action.time}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => navigate('/core/workflow-inbox')}
              >
                <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              </Button>
            </div>
          ))}
          <Button 
            variant="outline" 
            className="w-full rounded-xl text-[10px] font-black uppercase tracking-widest border-slate-200"
            onClick={() => navigate('/core/workflow-inbox')}
          >
            View All Tasks
          </Button>
        </div>
      </WorkspacePanel>
    </div>
  );
};
