import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export const OperationalChecklist: React.FC = () => {
  const [items, setItems] = React.useState([
    { id: '1', label: 'Verify Nightly Backup Integrity', completed: true },
    { id: '2', label: 'Review Pending Staff Leave Requests', completed: false },
    { id: '3', label: 'Sync Retail Inventory with Master Ledger', completed: false },
    { id: '4', label: 'Audit High-Value Transactions (> $10k)', completed: false },
    { id: '5', label: 'Monitor IoT Sensor Gateway Latency', completed: true },
  ]);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const completedCount = items.filter(i => i.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <WorkspacePanel 
      title="Daily Operational Checklist" 
      description="Mission-critical tasks for management oversight"
      variant="glass"
    >
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-500">Execution Progress</span>
          <span className="text-xs font-black text-indigo-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={cn(
              "group flex items-center gap-3 rounded-xl border border-transparent p-1 transition-all",
              item.completed && "opacity-60"
            )}
          >
            <Checkbox 
              id={item.id} 
              checked={item.completed} 
              onCheckedChange={() => toggleItem(item.id)}
              className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <label 
              htmlFor={item.id} 
              className={cn(
                "cursor-pointer text-[11px] font-bold transition-all",
                item.completed ? "text-slate-400 line-through" : "text-slate-700"
              )}
            >
              {item.label}
            </label>
          </div>
        ))}
      </div>
    </WorkspacePanel>
  );
};
