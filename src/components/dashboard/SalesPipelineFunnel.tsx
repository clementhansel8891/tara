import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { useNavigate } from 'react-router-dom';

export const SalesPipelineFunnel: React.FC = () => {
  const navigate = useNavigate();

  const stages = [
    { label: 'Leads', value: 450, width: '100%', color: 'bg-indigo-600' },
    { label: 'Qualified', value: 280, width: '80%', color: 'bg-indigo-500' },
    { label: 'Proposal', value: 120, width: '60%', color: 'bg-indigo-400' },
    { label: 'Negotiation', value: 45, width: '40%', color: 'bg-indigo-300' },
    { label: 'Won', value: 32, width: '20%', color: 'bg-emerald-500' },
  ];

  return (
    <WorkspacePanel 
      title="Sales Funnel" 
      description="Conversion from lead to closed-won"
      variant="glass"
      className="cursor-pointer"
      onClick={() => navigate('/core/sales/pipeline')}
    >
      <div className="flex flex-col items-center gap-2 py-2">
        {stages.map((s, i) => (
          <div key={i} className="group relative flex w-full flex-col items-center">
            <div 
              style={{ width: s.width }} 
              className={`h-8 ${s.color} rounded-lg shadow-sm transition-all group-hover:brightness-110 flex items-center justify-center px-4`}
            >
              <span className="text-[10px] font-black text-white truncate">{s.label}</span>
            </div>
            <span className="mt-1 text-[10px] font-black text-slate-900">{s.value}</span>
            {i < stages.length - 1 && (
              <div className="h-2 w-px bg-slate-200" />
            )}
          </div>
        ))}
      </div>
    </WorkspacePanel>
  );
};
