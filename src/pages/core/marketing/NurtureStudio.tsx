import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  Workflow, 
  Play, 
  Pause, 
  Settings2, 
  Plus, 
  Clock, 
  Mail, 
  MessageSquare, 
  Zap, 
  ArrowDown, 
  Trash2,
  Edit2,
  ChevronRight,
  Sparkles,
  Target,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Activity,
  Layers,
  Box,
  Fingerprint,
  ChevronDown,
  ArrowUpRight,
  MoreVertical,
  ActivitySquare,
  Network
} from "lucide-react";
import { StrategicExpansionModal } from "@/components/ui/StrategicExpansionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/core/security/session";
import { marketingService } from "@/core/services/marketing/marketingService";
import type { NurtureWorkflow } from "@/core/types/marketing/marketing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TRIGGERS: NurtureWorkflow["trigger"][] = [
  "NEW_LEAD",
  "SCORE_BELOW_THRESHOLD",
  "REENGAGEMENT",
];

export default function NurtureStudio() {
  const session = useSession();
  const [selectedWorkflow, setSelectedWorkflow] = useState<NurtureWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workflows, setWorkflows] = useState<NurtureWorkflow[]>([]);
  const [expansionOpen, setExpansionOpen] = useState(false);
  const [expansionFeature, setExpansionFeature] = useState("");

  const refresh = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      const w = await marketingService.listWorkflows(session.tenant_id, session);
      setWorkflows(w);
      if (w.length > 0 && !selectedWorkflow) {
         setSelectedWorkflow(w[0]);
      }
      if (isManual) toast.success("Automation registry synchronized.");
    } catch (err) {
      console.error("Failed to fetch nurture workflows:", err);
      toast.error("Telemetry failure in automation suite.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.tenant_id, selectedWorkflow]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpdateStatus = async (id: string, status: "ACTIVE" | "PAUSED") => {
    try {
      setRefreshing(true);
      await marketingService.updateWorkflowStatus(session.tenant_id, session, id, status);
      toast.success(`Protocol ${status} executed for workflow.`);
      refresh(true);
    } catch (err) {
      toast.error("Authorization protocol failure.");
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 bg-indigo-600 rounded-[2.5rem] animate-pulse flex items-center justify-center shadow-2xl shadow-indigo-500/20">
             <Workflow className="h-10 w-10 text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Booting Growth Orchestrator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-1000 max-w-[1600px] mx-auto pb-24 h-screen overflow-hidden flex flex-col">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 shrink-0">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-indigo-600 text-white border-none font-black px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">Strategic Studio</Badge>
            <div className="flex items-center gap-1.5 text-indigo-500 font-bold text-xs uppercase tracking-widest">
               <Activity className="h-4 w-4 animate-pulse" />
               Engine V4.2.0 Online
            </div>
          </div>
          <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-br from-slate-900 via-slate-700 to-indigo-900 dark:from-white dark:to-slate-400 bg-clip-text text-transparent text-left italic">Nurture Studio</h1>
          <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed italic text-left">"Orchestrate event-driven growth workflows with total operational command."</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-800 border-none shadow-xl hover:scale-110 transition-all"
            onClick={() => refresh(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-6 w-6 text-indigo-600", refreshing && "animate-spin")} />
          </Button>
          <Button 
            className="h-[4.5rem] px-10 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-500/30 font-black text-sm gap-3 group transition-all hover:scale-105 active:scale-95"
            onClick={() => {
              setExpansionFeature("Rule Initialization Wizard");
              setExpansionOpen(true);
            }}
          >
            <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" /> 
            INITIALIZE RULE
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10 flex-1 min-h-0">
        {/* Left: Automation Registry */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">
           <Card className="flex-1 rounded-[3rem] border-none shadow-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden flex flex-col">
              <CardHeader className="p-8 pb-4 border-b border-white/10 dark:border-slate-800/10 flex flex-row items-center justify-between">
                 <div className="space-y-1">
                    <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3 uppercase italic">
                       <Layers className="h-5 w-5 text-indigo-600" />
                       Active Protocols
                    </CardTitle>
                 </div>
                 <Badge variant="outline" className="rounded-full font-black text-[9px] px-2 py-0 h-5 border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-widest">{workflows.length} RULES</Badge>
              </CardHeader>
              <ScrollArea className="flex-1">
                 <div className="p-3 space-y-2">
                    {(Array.isArray(workflows) ? workflows : []).map((wf) => (
                      <button
                        key={wf.id}
                        onClick={() => setSelectedWorkflow(wf)}
                        className={cn(
                          "w-full flex items-center gap-5 p-5 rounded-[2rem] text-left transition-all duration-300 group relative overflow-hidden",
                          selectedWorkflow?.id === wf.id 
                            ? "bg-white dark:bg-slate-800 shadow-2xl shadow-indigo-500/10 translate-x-2 border-l-4 border-l-indigo-600" 
                            : "hover:bg-white/50 dark:hover:bg-slate-800/50 hover:translate-x-1"
                        )}
                      >
                         <div className={cn(
                           "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-110",
                           wf.status === 'ACTIVE' ? "bg-indigo-600 text-white shadow-indigo-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                         )}>
                            <Zap className="h-7 w-7" />
                         </div>
                         <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                               <p className="text-sm font-black uppercase tracking-tight group-hover:text-indigo-600 transition-colors italic leading-none truncate pr-2">{wf.name}</p>
                               <Badge className={cn(
                                 "text-[8px] font-black uppercase tracking-widest px-2 py-0 h-4 border-none shadow-sm",
                                 wf.status === 'ACTIVE' ? "bg-emerald-500 text-white shadow-emerald-500/10" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                               )}>
                                 {wf.status}
                               </Badge>
                            </div>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] italic opacity-60">
                               {wf.trigger.replace('_', ' ')}
                            </p>
                         </div>
                         <ChevronRight className={cn("h-4 w-4 transition-transform", selectedWorkflow?.id === wf.id ? "text-indigo-600 translate-x-1" : "text-slate-200")} />
                      </button>
                    ))}
                 </div>
              </ScrollArea>
           </Card>

           <Card className="rounded-[3rem] border-none shadow-2xl bg-indigo-900 text-white p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-40 w-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform">
                       <Sparkles className="h-6 w-6 text-white fill-white" />
                    </div>
                    <div>
                       <h4 className="font-black text-lg uppercase tracking-tighter italic leading-none">AI Advisory</h4>
                       <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Neural Optimization</p>
                    </div>
                 </div>
                 <p className="text-xs font-medium italic italic opacity-70 leading-relaxed italic">
                    "{selectedWorkflow?.aiSuggestion || "Select a workflow to see AI-driven performance tips."}"
                 </p>
                 <Button variant="link" className="text-[9px] font-black uppercase tracking-widest h-auto p-0 text-indigo-300 hover:text-white transition-colors"
                    onClick={() => {
                      setExpansionFeature("Neural Workflow Optimization");
                      setExpansionOpen(true);
                    }}
                  >
                    AUTHORIZE OPTIMIZATION
                  </Button>
              </div>
           </Card>
        </div>

        {/* Right: Builder Canvas */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-hidden">
           {selectedWorkflow ? (
             <div className="h-full flex flex-col gap-6">
                <Card className="shrink-0 rounded-[2.5rem] border-none bg-indigo-600 shadow-2xl p-1 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 h-64 w-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
                   <CardContent className="p-8 flex items-center justify-between text-white relative z-10">
                      <div className="flex items-center gap-6">
                         <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/20">
                            <Workflow className="h-8 w-8 text-white" />
                         </div>
                         <div className="space-y-1">
                            <h2 className="text-3xl font-black tracking-tighter uppercase italic">{selectedWorkflow.name}</h2>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-60">
                               <span className="flex items-center gap-2"><Network className="h-4 w-4" /> NODE ID: {selectedWorkflow.id}</span>
                               <span className="flex items-center gap-2 text-emerald-300"><ShieldCheck className="h-4 w-4" /> LOGIC VERIFIED</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <Button variant="outline" className="h-14 px-8 rounded-2xl bg-white/10 border-none shadow-xl hover:scale-110 transition-all text-white font-black text-[10px] uppercase tracking-widest gap-2 group"
                            onClick={() => {
                              setExpansionFeature(`${selectedWorkflow.name} Advanced Config`);
                              setExpansionOpen(true);
                            }}
                          >
                            <Settings2 className="h-4 w-4 group-hover:rotate-90 transition-transform duration-500" /> CONFIGURATION
                         </Button>
                         {selectedWorkflow.status === 'ACTIVE' ? (
                            <Button 
                              className="h-14 px-8 rounded-2xl bg-rose-500 text-white hover:bg-rose-600 shadow-xl shadow-rose-500/20 font-black text-[10px] uppercase tracking-widest gap-2"
                              onClick={() => handleUpdateStatus(selectedWorkflow.id, "PAUSED")}
                            >
                               <Pause className="h-4 w-4" /> DEACTIVATE
                            </Button>
                         ) : (
                            <Button 
                              className="h-14 px-8 rounded-2xl bg-white text-indigo-600 hover:bg-slate-50 shadow-xl font-black text-[10px] uppercase tracking-widest gap-2"
                              onClick={() => handleUpdateStatus(selectedWorkflow.id, "ACTIVE")}
                            >
                               <Play className="h-4 w-4" /> AUTHORIZE
                            </Button>
                         )}
                      </div>
                   </CardContent>
                </Card>

                <Card className="flex-1 rounded-[4rem] border-none shadow-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden relative">
                   <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none" 
                        style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                   <ScrollArea className="h-full">
                      <div className="p-20 flex flex-col items-center gap-10 relative z-10">
                         {/* Trigger Node */}
                         <div className="relative group">
                            <Card className="bg-indigo-600 text-white border-none shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] w-80 text-center z-10 relative overflow-hidden rounded-[2rem] group-hover:scale-105 transition-all duration-500">
                               <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                               <CardContent className="p-8 space-y-2">
                                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Trigger Event</p>
                                  <p className="font-black text-xl uppercase italic tracking-tighter">{selectedWorkflow.trigger.replace('_', ' ')}</p>
                               </CardContent>
                            </Card>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-10 bg-indigo-500/20" />
                         </div>

                         {/* Step Nodes */}
                         {(Array.isArray(selectedWorkflow.steps) ? selectedWorkflow.steps : []).map((step, idx) => (
                            <div key={step.id} className="flex flex-col items-center gap-10 w-full max-w-2xl">
                               <div className="relative group w-full">
                                  <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-none shadow-xl rounded-[2.5rem] p-8 flex gap-8 items-center relative z-10 hover:shadow-2xl hover:translate-x-1 transition-all duration-500">
                                     <div className={cn(
                                       "h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-500 group-hover:scale-110",
                                       step.channel === 'EMAIL' ? "bg-blue-600 text-white" : "bg-emerald-500 text-white"
                                     )}>
                                        {step.channel === 'EMAIL' ? <Mail className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
                                     </div>
                                     <div className="flex-1 min-w-0 space-y-3">
                                        <div className="flex justify-between items-center">
                                           <div className="space-y-1">
                                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Node Step {idx + 1}</p>
                                              <p className="text-xl font-black uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors truncate pr-4">{step.messageTemplate}</p>
                                           </div>
                                           <Badge variant="outline" className="rounded-full font-black text-[9px] px-3 py-1 border-slate-200 dark:border-slate-700 uppercase tracking-widest text-slate-400 flex gap-2">
                                              <Clock className="h-3 w-3" /> {step.waitHours}H LATENCY
                                           </Badge>
                                        </div>
                                        <div className="flex gap-3">
                                           <Button variant="secondary" size="sm" className="h-9 px-4 rounded-xl bg-slate-50 dark:bg-slate-700 font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                              onClick={() => {
                                                setExpansionFeature(`Node Protocol: ${step.messageTemplate}`);
                                                setExpansionOpen(true);
                                              }}
                                            >
                                              EDIT PROTOCOL
                                            </Button>
                                           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                     </div>
                                  </Card>
                                  {idx < selectedWorkflow.steps.length - 1 ? (
                                     <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-10 bg-indigo-500/20" />
                                  ) : (
                                     <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-10 bg-indigo-500/20" />
                                  )}
                               </div>
                            </div>
                         ))}

                         {/* Add Step Connector */}
                         <div className="flex flex-col items-center">
                            <Button 
                              variant="outline" 
                              className="h-20 w-20 rounded-[2rem] border-4 border-dashed border-slate-200 dark:border-slate-800 bg-transparent flex flex-col gap-4 hover:bg-white dark:hover:bg-slate-900 hover:border-indigo-600 hover:text-indigo-600 transition-all group shadow-inner"
                              onClick={() => {
                                setExpansionFeature("Dynamic Strategy Integration");
                                setExpansionOpen(true);
                              }}
                            >
                               <Plus className="h-8 w-8 group-hover:rotate-90 transition-transform duration-500" />
                            </Button>
                            <div className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-60">Integrate Strategy</div>
                            <div className="w-[2px] h-10 bg-indigo-500/20 mt-4" />
                         </div>

                         {/* Outcome Node */}
                         <div className="relative group">
                            <Card className="bg-emerald-500 text-white border-none shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] w-80 text-center z-10 relative overflow-hidden rounded-[2rem] group-hover:scale-105 transition-all duration-500">
                               <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                               <CardContent className="p-8 space-y-2">
                                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Strategic Outcome</p>
                                  <p className="font-black text-xl uppercase italic tracking-tighter flex items-center justify-center gap-3">
                                     <Target className="h-6 w-6" /> QUALIFICATION GOAL
                                  </p>
                               </CardContent>
                            </Card>
                         </div>
                      </div>
                   </ScrollArea>
                </Card>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center rounded-[4rem] border-2 border-dashed border-white/20 dark:border-slate-800/20 bg-white/10 dark:bg-slate-900/10 grayscale opacity-30 space-y-12 animate-in zoom-in duration-1000">
                <div className="relative">
                   <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full scale-[3] animate-pulse" />
                   <div className="h-48 w-48 rounded-[4rem] bg-white dark:bg-slate-800 flex items-center justify-center shadow-[0_50px_100px_-20px_rgba(79,70,229,0.3)] relative z-10 border border-white/20">
                      <Workflow className="h-24 w-24 text-indigo-600 drop-shadow-2xl" />
                   </div>
                </div>
                <div className="text-center space-y-4">
                  <h3 className="text-4xl font-black uppercase tracking-tighter italic">Studio Inactive</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 max-w-[400px] mx-auto leading-relaxed italic italic">Select an automation protocol from the registry to authorize total workflow synchronization.</p>
                </div>
                <Button 
                  className="h-[4.5rem] px-12 rounded-[2.5rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-500/30 font-black text-sm gap-4 group transition-all hover:scale-105 active:scale-95 text-white"
                  onClick={() => {
                     setExpansionFeature("Growth Strategy Initialization");
                     setExpansionOpen(true);
                   }}
                >
                  <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
                  INITIALIZE STRATEGY
                </Button>
             </div>
           )}
        </div>
      </div>
      
      <StrategicExpansionModal 
        isOpen={expansionOpen} 
        onOpenChange={setExpansionOpen} 
        featureName={expansionFeature} 
      />
    </div>
  );
}
