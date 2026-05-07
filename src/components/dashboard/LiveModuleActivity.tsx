import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { cn } from '@/lib/utils';
import { Activity, Zap, Clock } from 'lucide-react';

interface ModuleActivity {
  name: string;
  status: 'STABLE' | 'DEGRADED' | 'DOWN';
  throughput: number;
  latency: number;
  lastChecked: string;
}

interface LiveModuleActivityProps {
  data: ModuleActivity[];
}

export const LiveModuleActivity: React.FC<LiveModuleActivityProps> = ({ data = [] }) => {
  return (
    <WorkspacePanel 
      title="Live Module Telemetry" 
      description="Real-time throughput and latency per domain"
      variant="glass"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.map((module, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{module.name}</span>
              <div className={cn(
                "h-2 w-2 rounded-full shadow-[0_0_8px]",
                module.status === 'STABLE' ? "bg-emerald-500 shadow-emerald-500/50" : 
                module.status === 'DEGRADED' ? "bg-amber-500 shadow-amber-500/50" : 
                "bg-rose-500 shadow-rose-500/50"
              )} />
            </div>
            
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Zap className="h-3 w-3" />
                  <span className="text-[10px] font-bold">Throughput</span>
                </div>
                <p className="text-xl font-black text-slate-900">{module.throughput}<span className="text-[10px] font-medium text-slate-400 ml-1">req/s</span></p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-1.5 text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px] font-bold">Latency</span>
                </div>
                <p className="text-xl font-black text-slate-900">{module.latency}<span className="text-[10px] font-medium text-slate-400 ml-1">ms</span></p>
              </div>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div 
                className={cn(
                  "h-full transition-all duration-1000",
                  module.status === 'STABLE' ? "bg-emerald-500" : "bg-amber-500"
                )}
                style={{ width: `${Math.min(100, module.throughput)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </WorkspacePanel>
  );
};
