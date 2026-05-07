import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, FileText, CheckCircle, Truck } from 'lucide-react';

export const ProcurementPipelineWidget: React.FC = () => {
  const navigate = useNavigate();

  const stages = [
    { label: 'Draft', value: 5, icon: FileText, color: 'text-slate-400' },
    { label: 'Review', value: 12, icon: ShoppingCart, color: 'text-amber-500' },
    { label: 'Approved', value: 8, icon: CheckCircle, color: 'text-indigo-600' },
    { label: 'Delivered', value: 24, icon: Truck, color: 'text-emerald-500' },
  ];

  return (
    <WorkspacePanel 
      title="Procurement Pipeline" 
      description="Active purchase requests and fulfillment"
      variant="glass"
      className="cursor-pointer"
      onClick={() => navigate('/core/procurement/prs')}
    >
      <div className="relative mt-2">
        <div className="absolute left-0 top-6 h-0.5 w-full bg-slate-100" />
        <div className="relative flex justify-between">
          {stages.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-white shadow-md">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground">{s.label}</p>
                <p className="text-sm font-black text-slate-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between">
          <span className="text-[10px] font-black uppercase text-muted-foreground">Open PO Value</span>
          <span className="text-xs font-black text-indigo-600">$432,500</span>
        </div>
      </div>
    </WorkspacePanel>
  );
};
