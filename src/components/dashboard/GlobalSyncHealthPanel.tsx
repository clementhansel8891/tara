import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { RefreshCcw, AlertTriangle, CheckCircle2, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalSyncHealthPanelProps {
  data: {
    pending: number;
    failed: number;
    lastSyncAt: string;
    latencyMin: number;
    isHealthy: boolean;
  };
}

export const GlobalSyncHealthPanel: React.FC<GlobalSyncHealthPanelProps> = ({ data }) => {
  return (
    <WorkspacePanel 
      title="Global Sync Fabric" 
      description="Database replication and outbox event integrity"
      variant="glass"
    >
      <div className="flex items-center gap-8 py-2">
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            "flex h-20 w-20 items-center justify-center rounded-full border-8",
            data.isHealthy ? "border-emerald-500/20 text-emerald-500" : "border-rose-500/20 text-rose-500"
          )}>
            <Cloud className="h-8 w-8" />
          </div>
          <span className="text-[10px] font-black uppercase text-slate-400">{data.isHealthy ? 'Healthy' : 'Sync Delay'}</span>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="space-y-1 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-black uppercase">Pending Events</span>
              <RefreshCcw className="h-3 w-3 animate-spin-slow" />
            </div>
            <p className="text-2xl font-black text-slate-900">{data.pending}</p>
          </div>

          <div className="space-y-1 rounded-2xl bg-rose-50 p-4">
            <div className="flex items-center justify-between text-rose-500">
              <span className="text-[10px] font-black uppercase">Failed Events</span>
              <AlertTriangle className="h-3 w-3" />
            </div>
            <p className="text-2xl font-black text-rose-900">{data.failed}</p>
          </div>

          <div className="col-span-2 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500">Latency: <span className="text-slate-900">{data.latencyMin}m</span></span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Last heartbeat: {new Date(data.lastSyncAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </WorkspacePanel>
  );
};
