import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { cn } from '@/lib/utils';

interface ComplianceItem {
  region: string;
  tax: number;
  labor: number;
  data: number;
  audit: number;
}

const data: ComplianceItem[] = [
  { region: 'Jakarta', tax: 98, labor: 95, data: 92, audit: 100 },
  { region: 'Surabaya', tax: 94, labor: 88, data: 96, audit: 91 },
  { region: 'Bandung', tax: 82, labor: 91, data: 85, audit: 88 },
  { region: 'Medan', tax: 99, labor: 96, data: 89, audit: 94 },
];

export const ComplianceHeatmap: React.FC = () => {
  const getCellColor = (value: number) => {
    if (value >= 95) return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
    if (value >= 90) return 'bg-emerald-400/10 text-emerald-600 border-emerald-400/20';
    if (value >= 85) return 'bg-amber-400/10 text-amber-600 border-amber-400/20';
    return 'bg-rose-400/10 text-rose-600 border-rose-400/20';
  };

  return (
    <WorkspacePanel 
      title="Compliance Heatmap" 
      description="Regulatory and governance adherence by region"
      variant="glass"
    >
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left border-separate border-spacing-2">
          <thead>
            <tr>
              <th className="p-1 text-[10px] font-black uppercase text-slate-400">Region</th>
              <th className="p-1 text-[10px] font-black uppercase text-slate-400 text-center">Tax</th>
              <th className="p-1 text-[10px] font-black uppercase text-slate-400 text-center">Labor</th>
              <th className="p-1 text-[10px] font-black uppercase text-slate-400 text-center">Data</th>
              <th className="p-1 text-[10px] font-black uppercase text-slate-400 text-center">Audit</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td className="p-1">
                  <span className="text-[10px] font-bold text-slate-600">{row.region}</span>
                </td>
                {[row.tax, row.labor, row.data, row.audit].map((val, j) => (
                  <td key={j} className="p-0">
                    <div className={cn(
                      "flex h-10 w-full items-center justify-center rounded-lg border text-[11px] font-black",
                      getCellColor(val)
                    )}>
                      {val}%
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WorkspacePanel>
  );
};
