import React from 'react';
import { Package, AlertTriangle, ArrowRight, BarChart2, Boxes } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const InventoryHealthWidget: React.FC = () => {
  const navigate = useNavigate();

  const metrics = [
    { label: 'Low Stock SKUs', value: 24, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { label: 'Total SKUs', value: 1240, icon: Package, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { label: 'Turnover Rate', value: '4.2x', icon: BarChart2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  return (
    <div className="flex flex-col h-full rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10 group overflow-hidden relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 border border-white/10 group-hover:text-white transition-colors">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.15em] text-white">Inventory Health</h4>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Stock levels & velocity</p>
          </div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
           <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map((m, i) => (
          <div key={i} className={cn(
            "flex items-center justify-between rounded-2xl border p-4 transition-all hover:bg-white/5",
            m.bg, m.border
          )}>
            <div className="flex items-center gap-4">
              <div className={cn("rounded-xl p-2 bg-slate-950 border border-white/5", m.color)}>
                <m.icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.label}</span>
            </div>
            <span className="text-xl font-black text-white">{m.value}</span>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => navigate('/core/inventory/stock')}
        className="mt-6 w-full py-4 rounded-2xl border border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-[0.98]"
      >
        ANALYSIS CONSOLE
      </button>
      
      {/* Subtle corner glow */}
      <div className="absolute -bottom-16 -right-16 h-32 w-32 bg-indigo-500/5 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
  );
};
