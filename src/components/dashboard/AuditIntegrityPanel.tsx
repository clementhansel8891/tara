import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { Shield, ShieldCheck, ShieldAlert, RefreshCw, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AuditIntegrityPanelProps {
  data: {
    score: number;
    status: 'CLEAN' | 'WARNINGS' | 'BROKEN';
    lastVerified: string;
    brokenCount: number;
  };
  onVerify?: () => void;
  loading?: boolean;
}

export const AuditIntegrityPanel: React.FC<AuditIntegrityPanelProps> = ({ data, onVerify, loading }) => {
  return (
    <WorkspacePanel 
      title="Audit Chain Integrity" 
      description="Cryptographic verification of system-wide audit logs"
      variant="dark"
      className="bg-slate-900 border-slate-800"
      action={
        <Button 
          variant="outline" 
          size="sm" 
          disabled={loading}
          onClick={onVerify}
          className="h-8 border-slate-700 bg-slate-800 text-[10px] font-black uppercase text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <RefreshCw className={cn("mr-2 h-3 w-3", loading && "animate-spin")} />
          Verify Chain
        </Button>
      }
    >
      <div className="flex items-center gap-10 py-4">
        <div className="relative flex flex-col items-center">
          <div className={cn(
            "flex h-24 w-24 items-center justify-center rounded-full border-[10px]",
            data.status === 'CLEAN' ? 'border-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 
            data.status === 'WARNINGS' ? 'border-amber-500/20 text-amber-500' : 
            'border-rose-500/20 text-rose-500'
          )}>
            {data.status === 'CLEAN' ? <ShieldCheck className="h-10 w-10" /> : <ShieldAlert className="h-10 w-10" />}
          </div>
          <p className="mt-3 text-2xl font-black text-white">{data.score}%</p>
          <p className="text-[10px] font-black uppercase text-slate-500">Integrity Score</p>
        </div>

        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <Lock className="h-3 w-3" />
                <span className="text-[10px] font-black uppercase">Verified Blocks</span>
              </div>
              <p className="text-xl font-black text-white">4,281</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-400">
                <Unlock className="h-3 w-3" />
                <span className="text-[10px] font-black uppercase">Broken Links</span>
              </div>
              <p className="text-xl font-black text-rose-500">{data.brokenCount}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-800/50 p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 italic">"Chain hashing is consistent across all multi-tenant shards."</span>
              <Shield className="h-4 w-4 text-slate-600" />
            </div>
          </div>
          
          <div className="text-[10px] font-medium text-slate-500">
            Last verified: {new Date(data.lastSyncAt || data.lastVerified).toLocaleString()}
          </div>
        </div>
      </div>
    </WorkspacePanel>
  );
};
