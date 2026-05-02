import { useEffect, useState } from "react";
import { 
  Activity, 
  Zap, 
  Database, 
  HardDrive, 
  Globe, 
  ShieldCheck, 
  AlertTriangle,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Settings2,
  RefreshCcw,
  BarChart3,
  Network
} from "lucide-react";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "@/core/security/session";
import { itService, type SystemHealth as SystemHealthType } from "@/core/services/it/itService";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export default function SystemHealth() {
  const session = useSession();
  const [healthData, setHealthData] = useState<SystemHealthType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      try {
        const data = await itService.getSystemHealth(session.tenant_id, session);
        setHealthData(data);
      } catch (err) {
        console.error("Failed to fetch system health", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [session.tenant_id, session, version]);

  const filtered = (Array.isArray(healthData) ? healthData : []).filter((evt) =>
    search ? evt.component.toLowerCase().includes(search.toLowerCase()) : true,
  );

  const kpis = [
    { label: "Global Latency", value: "24ms", trend: -12, icon: Zap, color: "text-indigo-500" },
    { label: "Active Nodes", value: "482", trend: 4, icon: Network, color: "text-emerald-500" },
    { label: "Storage Load", value: "68%", trend: 2, icon: HardDrive, color: "text-amber-500" },
    { label: "DB IOPS", value: "12.4k", trend: 8, icon: Database, color: "text-rose-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em]">
            <Activity className="h-3 w-3" /> System Health Matrix
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">
            Infrastructure Pulse
          </h1>
          <p className="text-sm text-slate-500 font-medium">Real-time telemetry and granular resource orchestration.</p>
        </div>

        <div className="flex items-center gap-3">
           <Button 
            variant="outline" 
            onClick={() => setVersion(v => v + 1)}
            className="rounded-2xl border-slate-200 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest px-6 h-12 gap-2"
           >
             <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
           </Button>
           <Button className="rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest px-6 h-12 shadow-xl shadow-indigo-500/20 gap-2">
             <Settings2 className="h-4 w-4" /> Global Config
           </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
             <div className="flex justify-between items-start">
                <div className={cn("p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 group-hover:scale-110 transition-transform duration-500", kpi.color)}>
                   <kpi.icon className="h-6 w-6" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest",
                  kpi.trend < 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                   {kpi.trend < 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                   {Math.abs(kpi.trend)}%
                </div>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
                <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">{kpi.value}</h3>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
         <WorkspacePanel 
          title="Infrastructure Event Log" 
          description="Tactical sequence of LAN-first system events."
          className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-xl"
         >
           <div className="mb-6 flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Search className="h-4 w-4 text-slate-400 ml-3" />
              <Input 
                placeholder="Filter telemetry sequence..." 
                className="border-none bg-transparent focus-visible:ring-0 text-[10px] font-black uppercase tracking-widest"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>

           <DataTableShell total={filtered.length} page={1} pageSize={10}>
             <table className="w-full text-sm">
               <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                 <tr>
                   <th className="p-4 text-left font-black tracking-widest">Component</th>
                   <th className="p-4 text-left font-black tracking-widest">Status</th>
                   <th className="p-4 text-left font-black tracking-widest">Latency</th>
                   <th className="p-4 text-left font-black tracking-widest">Hash Checked</th>
                 </tr>
               </thead>
               <tbody>
                 {loading ? (
                   <tr><td colSpan={4} className="p-12 text-center">
                     <Activity className="h-8 w-8 text-indigo-500 animate-pulse mx-auto mb-4" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing telemetry...</p>
                   </td></tr>
                 ) : filtered.length === 0 ? (
                   <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">No health events in current sequence.</td></tr>
                 ) : (
                   filtered.map((evt) => (
                     <tr key={evt.id} className="border-t border-slate-100 dark:border-slate-800 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                       <td className="p-4">
                          <div className="flex items-center gap-3">
                             <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Cpu className="h-4 w-4 text-slate-500" />
                             </div>
                             <span className="font-black text-[11px] uppercase tracking-wider text-slate-900 dark:text-white">{evt.component}</span>
                          </div>
                       </td>
                       <td className="p-4">
                         <Badge
                           className={cn(
                             "rounded-lg px-3 py-1 text-[8px] font-black uppercase tracking-widest border-none shadow-sm",
                             evt.status === "healthy" ? "bg-emerald-500/10 text-emerald-600" : 
                             evt.status === "warning" ? "bg-amber-500/10 text-amber-600" : 
                             "bg-rose-500/10 text-rose-600"
                           )}
                         >
                           {evt.status}
                         </Badge>
                       </td>
                       <td className="p-4">
                          <div className="flex items-center gap-2">
                             <span className={cn(
                               "h-1.5 w-1.5 rounded-full",
                               evt.latencyMs < 50 ? "bg-emerald-500" : "bg-rose-500"
                             )} />
                             <span className="text-xs font-mono font-bold text-slate-500">{evt.latencyMs}ms</span>
                          </div>
                       </td>
                       <td className="p-4 text-slate-400 text-[10px] font-mono">
                         {new Date(evt.checkedAt).toLocaleTimeString()}
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </DataTableShell>
         </WorkspacePanel>

         <div className="space-y-8">
            <WorkspacePanel title="Granular Telemetry" description="Partitioned resource load metrics.">
               <div className="space-y-6 pt-4">
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Database className="h-3 w-3 text-rose-500" /> Tenant DB Partition</span>
                        <span className="text-slate-400">84.2 GB / 100 GB</span>
                     </div>
                     <Progress value={84} className="h-2 bg-slate-100 dark:bg-slate-800" />
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic leading-relaxed">
                        Partition auto-scaling triggered. Optimization required in 12.4GB.
                     </p>
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-2"><HardDrive className="h-3 w-3 text-amber-500" /> Storage Load Balance</span>
                        <span className="text-slate-400">42% Balanced</span>
                     </div>
                     <div className="grid grid-cols-5 gap-1 h-3">
                        {[1,1,1,0,0].map((v, i) => (
                           <div key={i} className={cn("rounded-sm", v ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800")} />
                        ))}
                     </div>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic leading-relaxed">
                        LUN 04 responding with high IOPS wait (14ms).
                     </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Globe className="h-3 w-3 text-indigo-500" /> Network Mesh Density</span>
                        <Badge variant="outline" className="text-[8px] font-black uppercase">Ultra-Low</Badge>
                     </div>
                     <div className="flex items-center justify-between gap-2 h-12">
                        {[40, 60, 45, 80, 50, 90, 70, 85, 60].map((h, i) => (
                           <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-lg relative overflow-hidden h-full">
                              <div className="absolute bottom-0 left-0 w-full bg-indigo-500 transition-all duration-1000" style={{ height: `${h}%` }} />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </WorkspacePanel>

            <div className="p-8 rounded-[2.5rem] bg-indigo-600 shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
               <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
               <div className="relative z-10 space-y-4">
                  <ShieldCheck className="h-10 w-10 text-white opacity-40" />
                  <div className="space-y-1">
                     <h4 className="text-xl font-black tracking-tight text-white uppercase italic">Audit Readiness</h4>
                     <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-relaxed">
                        System health logs are immutable and synced with Audit Hub.
                     </p>
                  </div>
                  <Button className="w-full rounded-2xl bg-white text-indigo-600 font-black text-[10px] uppercase tracking-widest py-6 hover:bg-slate-50 transition-colors">
                     Download Compliance Report
                  </Button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
