import React from 'react';
import { WorkspacePanel } from '@/core/ui/WorkspacePanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ActivityItem } from '@/types/dashboard.types';
import { useNavigate } from 'react-router-dom';
import { Activity as ActivityIcon } from 'lucide-react';

interface GlobalEventFeedProps {
  activities: ActivityItem[];
}

export const GlobalEventFeed: React.FC<GlobalEventFeedProps> = ({ activities = [] }) => {
  const navigate = useNavigate();

  const getSeverityStyles = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const handleItemClick = (module?: string) => {
    const routes: Record<string, string> = {
      'RETAIL': '/m/retail/management',
      'FINANCE': '/core/finance',
      'HR': '/core/hr',
      'IT': '/core/it/health',
      'SYSTEM': '/core/it'
    };
    if (module && routes[module.toUpperCase()]) navigate(routes[module.toUpperCase()]);
  };

  return (
    <WorkspacePanel 
      title="Global Event Telemetry" 
      description="Real-time multi-tenant activity stream"
      variant="glass"
    >
      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {activities.length > 0 ? activities.map((activity, i) => (
            <div 
              key={i} 
              onClick={() => handleItemClick(activity.module)}
              className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md cursor-pointer"
            >
              <div className={cn("mt-1 h-3 w-3 rounded-full shrink-0", activity.severity === 'critical' ? 'bg-rose-500 animate-pulse' : activity.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500')} />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-900">{activity.title}</p>
                  <span className="text-[10px] font-bold text-slate-400">{formatDistanceToNow(new Date(activity.time))} ago</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">{activity.detail}</p>
                <div className="flex items-center gap-2 pt-1">
                  {activity.module && (
                    <Badge variant="outline" className="h-5 rounded-full px-2 text-[9px] font-black uppercase">
                      {activity.module}
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn("h-5 rounded-full px-2 text-[9px] font-black uppercase border-none", getSeverityStyles(activity.severity))}>
                    {activity.status}
                  </Badge>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-2 flex h-[300px] flex-col items-center justify-center text-center">
              <div className="rounded-full bg-slate-100 p-4">
                <ActivityIcon className="h-8 w-8 text-slate-300" />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-400">System Ready</p>
              <p className="text-xs text-slate-400">Awaiting incoming events</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </WorkspacePanel>
  );
};

import { Activity as ActivityIcon } from 'lucide-react';
