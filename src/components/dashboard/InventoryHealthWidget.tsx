import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { Package, AlertTriangle, ArrowRight, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const InventoryHealthWidget: React.FC = () => {
  const navigate = useNavigate();

  const metrics = [
    { label: 'Low Stock SKUs', value: 24, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Total SKUs', value: 1240, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Turnover Rate', value: '4.2x', icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <WorkspacePanel 
      title="Inventory Health" 
      description="Stock levels and supply chain velocity"
      variant="glass"
    >
      <div className="space-y-3">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-xl p-2", m.bg, m.color)}>
                <m.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-600">{m.label}</span>
            </div>
            <span className="text-sm font-black text-slate-900">{m.value}</span>
          </div>
        ))}
      </div>
      <button 
        onClick={() => navigate('/core/inventory/stock')}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-black text-white transition-all hover:bg-slate-800"
      >
        View Full Inventory <ArrowRight className="h-3 w-3" />
      </button>
    </WorkspacePanel>
  );
};

import { cn } from '@/lib/utils';
