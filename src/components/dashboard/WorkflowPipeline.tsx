import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, User, ArrowRight, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface WorkflowItem {
  id: string;
  type: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  assignee?: string;
  timeElapsed: string;
}

interface WorkflowPipelineProps {
  data: WorkflowItem[];
}

export const WorkflowPipeline: React.FC<WorkflowPipelineProps> = ({ data = [] }) => {
  const navigate = useNavigate();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'IN_PROGRESS': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'COMPLETED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 border border-white/10 group-hover:text-white transition-colors">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.15em] text-white">Operational Pipeline</h4>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Active multi-step business processes</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/core/workflow')}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          title="Go to Workflow Inbox"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {data.length > 0 ? (
          data.map((item, i) => (
            <div key={i} className="group relative flex items-center gap-4 rounded-2xl border border-white/5 bg-white/2 p-4 transition-all hover:bg-white/5 cursor-pointer">
              <div className={cn("h-12 w-1 rounded-full", item.status === 'PENDING' ? 'bg-amber-500' : 'bg-blue-500')} />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-400 transition-colors">{item.type}</span>
                  <div className={cn("rounded-full px-2 py-0.5 text-[8px] font-black border tracking-widest uppercase", getStatusStyle(item.status))}>
                    {item.status}
                  </div>
                </div>
                <p className="text-xs font-black text-white">{item.title}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-600">
                    <Clock className="h-3 w-3" /> {item.timeElapsed}
                  </div>
                  {item.assignee && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-600">
                      <User className="h-3 w-3" /> {item.assignee}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-4 opacity-40">
             <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10">
                <Clock className="h-8 w-8 text-slate-600" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">No active processes</p>
          </div>
        )}
      </div>

      <button 
        className="mt-6 w-full py-4 rounded-2xl border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-[0.98]"
        onClick={() => navigate('/core/workflow')}
      >
        ACCESS CONTROL CENTER
      </button>
    </div>
  );
};
