import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Smartphone, Monitor, Cpu, Battery, Wifi, WifiOff } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'ALERT';
  lastSeen: string;
  battery?: number;
}

interface DeviceNetworkTableProps {
  data: Device[];
}

export const DeviceNetworkTable: React.FC<DeviceNetworkTableProps> = ({ data = [] }) => {
  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'POS': return Smartphone;
      case 'KIOSK': return Monitor;
      default: return Cpu;
    }
  };

  return (
    <WorkspacePanel 
      title="Hardware & IoT Network" 
      description="Live status of edge devices and terminals"
      variant="glass"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-3 text-[10px] font-black uppercase text-slate-400">Device</th>
              <th className="pb-3 text-[10px] font-black uppercase text-slate-400">Location</th>
              <th className="pb-3 text-[10px] font-black uppercase text-slate-400">Status</th>
              <th className="pb-3 text-[10px] font-black uppercase text-slate-400 text-right">Energy</th>
            </tr>
          </thead>
          <tbody>
            {data.map((device, i) => {
              const Icon = getIcon(device.type);
              return (
                <tr key={i} className="group border-b border-slate-50 last:border-none">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-slate-100 p-2 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-900">{device.name}</p>
                        <p className="text-[9px] font-medium text-slate-400">{device.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-[10px] font-bold text-slate-500">{device.location}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      {device.status === 'ONLINE' ? (
                        <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <WifiOff className="h-3.5 w-3.5 text-rose-500" />
                      )}
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        device.status === 'ONLINE' ? 'text-emerald-500' : 'text-rose-500'
                      )}>
                        {device.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    {device.battery !== undefined && (
                      <div className="flex items-center justify-end gap-1.5">
                        <Battery className={cn(
                          "h-3 w-3",
                          device.battery < 20 ? 'text-rose-500' : 'text-slate-400'
                        )} />
                        <span className="text-[10px] font-black text-slate-600">{device.battery}%</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </WorkspacePanel>
  );
};
