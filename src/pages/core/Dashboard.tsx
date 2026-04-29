import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as React from "react";
import { 
  TrendingUp, 
  RefreshCw, 
  Search, 
  Target, 
  Zap, 
  Activity, 
  DollarSign, 
  ArrowUpRight, 
  ShieldCheck, 
  Rocket, 
  Users, 
  PieChart, 
  BarChart3, 
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  LayoutDashboard,
  Filter,
  ActivitySquare,
  Globe,
  Layers,
  Box,
  Fingerprint,
  Monitor,
  Network,
  Cpu,
  Bot,
  Briefcase,
  ClipboardCheck,
  Building2,
  Clock,
  History,
  ShieldAlert,
  ScrollText
} from "lucide-react";
import { StrategicExpansionModal } from "@/components/ui/StrategicExpansionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "@/core/security/session";
import { adminService } from "@/core/services";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperationsView } from "@/components/shared/OperationsView";
import { PageShell } from "@/core/ui/PageShell";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";

const IconMap: Record<string, any> = {
  Briefcase,
  Users,
  AlertTriangle,
  ClipboardCheck,
};

export default function CoreDashboard() {
  const session = useSession();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [expansionOpen, setExpansionOpen] = useState(false);
  const [expansionFeature, setExpansionFeature] = useState("");

  const refresh = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      
      const res = await adminService.getDashboardMetrics(session.tenant_id, session);
      setKpis(res.kpis || []);
      setActivities(res.activities || []);
      
      if (isManual) toast.success("Executive telemetry synchronized.");
    } catch (err) {
      console.error("Dashboard sync failure:", err);
      toast.error("Telemetry failure in executive suite.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.tenant_id, session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredActivities = useMemo(
    () =>
      activities.filter((item) =>
        search
          ? `${item.title} ${item.detail} ${item.status}`
               .toLowerCase()
               .includes(search.toLowerCase())
          : true,
      ),
    [activities, search],
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 bg-indigo-600 rounded-[2.5rem] animate-pulse flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <LayoutDashboard className="h-10 w-10 text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Assembling Executive Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      header={
        <PageHeader
          title="Executive Suite"
          subtitle="Enterprise-wide intelligence and tactical operational telemetry."
          primaryAction={
            <Button onClick={() => setExpansionOpen(true)} className="rounded-[1.5rem] px-8 h-12 gap-2 font-black text-xs uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20">
              <Rocket className="h-4 w-4" /> STRATEGIC EXPANSION
            </Button>
          }
          secondaryActions={
            <Button 
              variant="outline" 
              className="rounded-[1.5rem] px-6 h-12 font-black text-xs uppercase tracking-widest border-slate-200"
              onClick={() => refresh(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          }
        />
      }
    >
      <Tabs defaultValue="executive" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <TabsList className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl h-14 w-full sm:w-auto border border-slate-200/50 dark:border-slate-800/50">
          <TabsTrigger value="executive" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 font-black text-xs uppercase tracking-widest transition-all">
             EXECUTIVE OVERVIEW
          </TabsTrigger>
          <TabsTrigger value="operations" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 font-black text-xs uppercase tracking-widest transition-all">
             TACTICAL OPERATIONS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="space-y-12 m-0">
          {/* KPI Matrix */}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi, i) => (
              <Card key={i} className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden group">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500",
                      kpi.trend === 'up' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"
                    )}>
                      {kpi.icon === 'dollar' ? <DollarSign className="h-7 w-7" /> : <Activity className="h-7 w-7" />}
                    </div>
                    <Badge variant="outline" className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                      kpi.trend === 'up' ? "border-emerald-200 text-emerald-500 bg-emerald-50/50" : "border-indigo-200 text-indigo-500 bg-indigo-50/50"
                    )}>
                      {kpi.change}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">{kpi.title}</p>
                    <h4 className="text-3xl font-black italic tracking-tighter uppercase">{kpi.value}</h4>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-12 xl:grid-cols-[1.5fr_1fr]">
            <WorkspacePanel 
              title="Global Activity Stream" 
              description="Real-time synchronized events across all organizational nodes."
              action={
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    placeholder="SCAN ACTIVITY..." 
                    className="h-11 w-64 pl-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white font-black text-[10px] uppercase tracking-widest transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              }
            >
              <div className="space-y-4 pt-6">
                {filteredActivities.length === 0 ? (
                  <EmptyState 
                    title="No Matching Activity" 
                    description="Our neural index returned zero results for your current query parameters."
                    type="empty"
                  />
                ) : (
                  filteredActivities.map((activity, i) => (
                    <div key={i} className="group flex items-center justify-between p-6 rounded-[2rem] border border-slate-50 hover:border-indigo-100 hover:bg-slate-50/50 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                          {IconMap[activity.icon] ? React.createElement(IconMap[activity.icon], { className: "h-6 w-6" }) : <Activity className="h-6 w-6" />}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-tighter italic">{activity.title}</p>
                          <p className="text-[11px] font-medium text-slate-500">{activity.detail}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{activity.time}</p>
                        <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-slate-100">
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </WorkspacePanel>

            <WorkspacePanel title="System Orchestration" description="Autonomous governance and module health telemetry.">
               <div className="space-y-8 pt-6">
                  <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-600 rounded-full -mr-20 -mt-20 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                     <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-start">
                           <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl">
                              <ShieldCheck className="h-6 w-6 text-indigo-400" />
                           </div>
                           <Badge className="bg-emerald-500 text-white border-none rounded-full px-3 py-1 text-[9px] font-black uppercase animate-pulse">Online</Badge>
                        </div>
                        <div className="space-y-2">
                           <h4 className="text-2xl font-black italic tracking-tighter uppercase">Security Protocol Alpha</h4>
                           <p className="text-xs text-slate-400 font-medium">Mainframe integrity verified. All encryption keys rotated.</p>
                        </div>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest">RUN DIAGNOSTIC</Button>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     {[
                        { label: 'Neural Sync', value: '99.9%', icon: Network, color: 'text-indigo-500' },
                        { label: 'Compute Load', value: '42%', icon: Cpu, color: 'text-amber-500' },
                        { label: 'Audit Trail', value: 'Active', icon: ScrollText, color: 'text-emerald-500' },
                        { label: 'Global Nodes', value: '184', icon: Globe, color: 'text-sky-500' },
                     ].map((stat, i) => (
                        <div key={i} className="p-6 rounded-[2rem] border border-slate-50 bg-white shadow-lg shadow-slate-200/20 space-y-3">
                           <stat.icon className={cn("h-6 w-6", stat.color)} />
                           <div className="space-y-0.5">
                              <p className="text-2xl font-black tracking-tighter italic">{stat.value}</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </WorkspacePanel>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="m-0">
           <OperationsView />
        </TabsContent>
      </Tabs>

      <StrategicExpansionModal 
        isOpen={expansionOpen} 
        onClose={() => setExpansionOpen(false)}
        feature={expansionFeature}
      />
    </PageShell>
  );
}
