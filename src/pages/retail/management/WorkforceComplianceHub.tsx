import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  ShieldAlert, 
  Users, 
  Scale, 
  Terminal, 
  Activity, 
  ShieldCheck, 
  RefreshCw, 
  ArrowUpRight, 
  TrendingUp, 
  AlertCircle,
  Search,
  MoreVertical,
  Zap,
  CheckCircle2,
  Lock,
  Eye,
  FileSearch,
  History,
  Workflow,
  GanttChartSquare,
  Shield,
  Fingerprint,
  ChevronRight,
  Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useSession } from "@/core/security/session";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PageShell } from "@/core/ui/PageShell";
import { PageHeader } from "@/core/ui/PageHeader";

export default function WorkforceComplianceHub() {
  const session = useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"compliance" | "workforce" | "forensics">("compliance");

  const refresh = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      if (isManual) toast.success("Compliance integrity verified.");
    } catch (err) {
      console.error("Compliance sync failure:", err);
      toast.error("Telemetry failure in compliance suite.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-8">
          <div className="relative h-24 w-24">
             <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl animate-pulse" />
             <div className="relative h-full w-full bg-primary rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/40 border border-white/10">
                <ShieldCheck className="h-12 w-12 text-primary-foreground" />
             </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Scanning Governance Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      header={
        <PageHeader
          title="Workforce & Compliance Hub"
          subtitle="Enterprise governance, labor optimization, and deep forensic auditing."
          primaryAction={
            <Button className="rounded-[1.2rem] px-8 h-12 gap-3 font-black text-xs uppercase tracking-widest bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-500/30 transition-all hover:scale-105 active:scale-95">
              <ShieldAlert className="h-4 w-4" /> TRIGGER AUDIT
            </Button>
          }
          secondaryActions={
            <Button 
              variant="outline" 
              className="rounded-[1.2rem] px-6 h-12 font-black text-xs uppercase tracking-widest border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white transition-all"
              onClick={() => refresh(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          }
        />
      }
    >
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        {/* Tier 1: Governance Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-card border-none shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Shield className="w-16 h-16 text-primary" />
            </div>
            <CardContent className="p-8">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Compliance Score</div>
              <div className="text-3xl font-black italic tracking-tighter flex items-end gap-2">
                98.2 <span className="text-sm font-bold text-emerald-500 mb-1">ELITE</span>
              </div>
              <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-emerald-500 uppercase">
                <CheckCircle2 className="w-3 h-3" />
                Reg-Z Protocol Active
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl relative overflow-hidden group">
            <CardContent className="p-8">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Labor Efficiency</div>
              <div className="text-3xl font-black italic tracking-tighter text-blue-500">88.5%</div>
              <Progress value={88.5} className="h-1.5 mt-4" />
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl relative overflow-hidden group">
            <CardContent className="p-8">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Access Anomalies</div>
              <div className="text-3xl font-black italic tracking-tighter text-rose-500">0</div>
              <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-emerald-500 uppercase">
                <Lock className="w-3 h-3" />
                Zero-Trust Shielded
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none shadow-xl relative overflow-hidden group">
            <CardContent className="p-8">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Audit Interval</div>
              <div className="text-3xl font-black italic tracking-tighter">6H</div>
              <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-primary uppercase">
                <Activity className="w-3 h-3" />
                Continuous Sync
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tier 2: Navigation Hub */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between glass-card p-6 rounded-[2.5rem]">
           <div className="relative w-full md:w-[400px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search logs, personnel, or audit codes..." 
                className="pl-12 h-12 bg-secondary/50 border-none rounded-xl font-bold text-xs uppercase tracking-widest"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-4 bg-secondary/30 p-1.5 rounded-2xl">
              {(["compliance", "workforce", "forensics"] as const).map(tab => (
                <Button 
                  key={tab}
                  variant={activeTab === tab ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-xl px-6 h-9 font-black text-[10px] uppercase tracking-widest transition-all",
                    activeTab === tab && "shadow-lg shadow-primary/20"
                  )}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </Button>
              ))}
           </div>
        </div>

        {/* Tier 3: Command Center Display */}
        {activeTab === "compliance" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-8">
                <Card className="glass-card border-none shadow-2xl rounded-[3rem] overflow-hidden">
                   <div className="p-8 border-b border-border/50 flex items-center justify-between bg-secondary/20">
                      <div className="flex items-center gap-3">
                         <Scale className="h-6 w-6 text-primary" />
                         <h3 className="font-black italic uppercase tracking-tighter text-xl">Governance Scorecard</h3>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] px-3 py-1 uppercase tracking-widest">VERIFIED</Badge>
                   </div>
                   <div className="p-8 space-y-8">
                      {[
                        { name: 'Financial Integrity', score: 99.8, status: 'EXCELLENT', icon: DollarSignIcon },
                        { name: 'Labor Regulation', score: 96.2, status: 'STABLE', icon: Users },
                        { name: 'Data Sovereignty', score: 98.4, status: 'SHIELDED', icon: Lock },
                        { name: 'Operational Safety', score: 92.1, status: 'OPTIMIZING', icon: Activity }
                      ].map(item => (
                        <div key={item.name} className="space-y-3 group">
                           <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <item.icon className="h-5 w-5" />
                                 </div>
                                 <div>
                                    <p className="font-black text-xs italic uppercase">{item.name}</p>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{item.status}</p>
                                 </div>
                              </div>
                              <span className="text-xl font-black italic tracking-tighter text-primary">{item.score}%</span>
                           </div>
                           <Progress value={item.score} className="h-1.5" />
                        </div>
                      ))}
                   </div>
                </Card>
             </div>

             <div className="space-y-8">
                <Card className="glass-card border-none shadow-2xl rounded-[3rem] p-10 bg-slate-950 text-white relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                   <div className="relative z-10 space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="h-14 w-14 bg-rose-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                            <Fingerprint className="h-7 w-7 text-rose-500" />
                         </div>
                         <div>
                            <h4 className="font-black text-xl uppercase tracking-tighter italic text-rose-500">Security Pulse</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Zero-Trust Matrix</p>
                         </div>
                      </div>
                      <p className="text-sm font-medium italic opacity-70 leading-relaxed italic">
                        "Biometric and GPS validation protocols are active. All personnel handshakes are currently <strong>100% verified</strong>."
                      </p>
                      <Button className="w-full h-16 bg-rose-600 text-white hover:bg-rose-700 border-none rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95">
                         VIEW SECURITY LOGS
                      </Button>
                   </div>
                </Card>

                <Card className="glass-card border-none shadow-2xl rounded-[3rem] p-8">
                   <div className="space-y-6">
                      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground italic flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Optimization Trends
                      </h4>
                      <div className="h-[150px] flex items-end gap-3 justify-between">
                         {[60, 80, 45, 90, 70, 85].map((h, i) => (
                           <div key={i} className="flex-1 bg-primary/10 rounded-lg relative group">
                              <div 
                                style={{ height: `${h}%` }} 
                                className="absolute bottom-0 w-full bg-primary rounded-lg transition-all duration-1000 group-hover:bg-primary/80" 
                              />
                           </div>
                         ))}
                      </div>
                   </div>
                </Card>
             </div>
          </div>
        )}

        {activeTab === "workforce" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <Card className="glass-card border-none shadow-2xl rounded-[3rem] p-10">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="font-black italic uppercase tracking-tighter text-2xl">Labor Distribution Matrix</h3>
                   <GanttChartSquare className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-6">
                   {[
                     { area: 'Retail Operations', staff: 42, efficiency: 94 },
                     { area: 'Logistics Node A', staff: 12, efficiency: 88 },
                     { area: 'Corporate HQ', staff: 28, efficiency: 91 }
                   ].map(area => (
                     <div key={area.area} className="p-6 bg-secondary/30 rounded-[2rem] border border-border/50 group hover:border-primary/50 transition-all">
                        <div className="flex justify-between items-center mb-4">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center text-primary">
                                 <Users className="h-5 w-5" />
                              </div>
                              <h4 className="font-black text-xs uppercase tracking-widest italic">{area.area}</h4>
                           </div>
                           <Badge className="bg-primary/10 text-primary border-none">{area.staff} Personnel</Badge>
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                              <span>Efficiency Index</span>
                              <span className="text-primary">{area.efficiency}%</span>
                           </div>
                           <Progress value={area.efficiency} className="h-1" />
                        </div>
                     </div>
                   ))}
                </div>
             </Card>

             <div className="space-y-8">
                <Card className="glass-card border-none shadow-2xl rounded-[3rem] p-10 bg-indigo-950 text-white relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                   <div className="relative z-10 space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20">
                            <Workflow className="h-7 w-7 text-indigo-400" />
                         </div>
                         <div>
                            <h4 className="font-black text-xl uppercase tracking-tighter italic text-indigo-400">Shift Orchestrator</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">AI Labor Allocation</p>
                         </div>
                      </div>
                      <p className="text-sm font-medium italic opacity-70 leading-relaxed italic">
                        "Predictive staffing model recommends increasing floor coverage by <strong>12% for the next 24h</strong> window."
                      </p>
                      <Button className="w-full h-16 bg-indigo-600 text-white hover:bg-indigo-700 border-none rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95">
                         AUTHORIZE REALLOCATION
                      </Button>
                   </div>
                </Card>

                <div className="grid grid-cols-2 gap-8">
                   <Card className="glass-card border-none shadow-xl rounded-[2.5rem] p-8 text-center bg-secondary/30">
                      <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">OT Rate</p>
                      <p className="text-3xl font-black italic text-primary">2.4%</p>
                   </Card>
                   <Card className="glass-card border-none shadow-xl rounded-[2.5rem] p-8 text-center bg-secondary/30">
                      <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Attendance</p>
                      <p className="text-3xl font-black italic text-emerald-500">99.1%</p>
                   </Card>
                </div>
             </div>
          </div>
        )}

        {activeTab === "forensics" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <Card className="lg:col-span-8 glass-card border-none shadow-2xl rounded-[3rem] overflow-hidden flex flex-col bg-slate-950 text-emerald-500 font-mono">
                <div className="p-8 border-b border-white/10 bg-black/40 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Terminal className="h-5 w-5" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic">Forensic Event Stream</h3>
                   </div>
                   <div className="flex gap-2">
                      <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                   </div>
                </div>
                <div className="flex-1 p-8 space-y-3 overflow-y-auto max-h-[500px] text-[10px]">
                   {[
                     { time: '21:42:01', msg: '[ACCESS] USER_ID: 4421 VERIFIED VIA BIOMETRIC HANDSHAKE @ NODE_JKT_01', type: 'info' },
                     { time: '21:40:15', msg: '[SECURITY] FIREWALL PACKET INSPECTION COMPLETE - 0 DROPPED', type: 'success' },
                     { time: '21:38:42', msg: '[AUDIT] LEDGER PARITY CHECK: SUCCESSFUL FOR TXN_9921_A', type: 'success' },
                     { time: '21:35:12', msg: '[SYSTEM] RE-SYNCING GOVERNANCE NODES WITH GLOBAL MATRIX', type: 'warn' },
                     { time: '21:32:00', msg: '[INFO] DEEP SCAN INITIATED ON RETAIL_SUBSIDIARY_04', type: 'info' }
                   ].map((log, i) => (
                     <div key={i} className="flex gap-4 opacity-80 hover:opacity-100 transition-opacity">
                        <span className="text-slate-500 shrink-0">[{log.time}]</span>
                        <span className={cn(
                          log.type === 'warn' ? 'text-amber-500' : 
                          log.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                        )}>{log.msg}</span>
                     </div>
                   ))}
                   <div className="flex gap-1.5 items-center animate-pulse pt-2">
                      <span className="w-1.5 h-3 bg-emerald-500" />
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-50">LISTENING FOR EVENTS...</span>
                   </div>
                </div>
             </Card>

             <div className="lg:col-span-4 space-y-8">
                <Card className="glass-card border-none shadow-2xl rounded-[3rem] p-10">
                   <div className="space-y-6">
                      <div className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-primary">
                         <FileSearch className="h-6 w-6" />
                      </div>
                      <h4 className="text-xl font-black italic tracking-tighter uppercase">Forensic Query Engine</h4>
                      <p className="text-muted-foreground font-medium italic text-xs leading-relaxed italic">
                        Perform deep-packet inspection and ledger reconciliation across the entire organizational graph.
                      </p>
                      <Input placeholder="Query Protocol..." className="h-12 bg-secondary/50 border-none rounded-xl font-mono text-[10px]" />
                      <Button className="w-full h-12 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20">
                         EXECUTE SEARCH
                      </Button>
                   </div>
                </Card>

                <Card className="glass-card border-none shadow-2xl rounded-[3rem] p-8 text-center bg-emerald-500/5">
                   <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
                   <h4 className="font-black text-xs uppercase tracking-widest text-emerald-600 mb-1">Integrity Confirmed</h4>
                   <p className="text-[8px] font-bold text-emerald-600/60 uppercase">Last Global Audit: 12m ago</p>
                </Card>
             </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function DollarSignIcon({ className }: any) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
