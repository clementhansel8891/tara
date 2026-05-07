import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Store, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Shift {
  id: string;
  store: string;
  status: string;
  cashier: string;
  openTime: string;
  closeTime?: string;
  reconciled: boolean;
}

interface RetailShiftMatrixProps {
  data: Shift[];
}

export const RetailShiftMatrix: React.FC<RetailShiftMatrixProps> = ({ data = [] }) => {
  const navigate = useNavigate();

  return (
    <WorkspacePanel 
      title="Retail Shift Oversight" 
      description="Live status of cashiers and reconciliation"
      variant="glass"
      className="cursor-pointer"
      onClick={() => navigate('/m/retail/management')}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((shift, i) => (
          <div key={i} className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-tight text-slate-500">{shift.store}</span>
              </div>
              <Badge variant="outline" className={cn(
                "h-5 rounded-full px-2 text-[8px] font-black uppercase border-none",
                shift.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
              )}>
                {shift.status}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900">{shift.cashier}</p>
                <div className="flex items-center gap-1 text-[9px] font-medium text-slate-400">
                  <Clock className="h-2.5 w-2.5" /> Opened {new Date(shift.openTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between border-t border-slate-50 pt-3">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Reconciled</span>
              {shift.reconciled ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
              )}
            </div>
          </div>
        ))}
      </div>
    </WorkspacePanel>
  );
};
