import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  Globe, 
  ExternalLink, 
  Activity, 
  Settings, 
  Lock, 
  MoreVertical, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Cloud,
  Link2,
  Trash2,
  ChevronRight,
  Database,
  Search,
  Layers,
  Clock,
  Hash,
  Instagram,
  Youtube,
  Play,
  Facebook,
  Chrome,
  Shield,
  History,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import type {
  ConnectedAccount,
  ConnectedProvider,
  ConnectionStatus,
} from "@/core/types/marketing/marketing";

const PROVIDERS: ConnectedProvider[] = ["META", "GOOGLE", "TIKTOK", "YOUTUBE", "INSTAGRAM", "FACEBOOK"];

export default function ConnectedAccountsDesk() {
  const session = useSession();
  const [provider, setProvider] = useState<ConnectedProvider>("META");
  const [accountName, setAccountName] = useState("");
  const [scopes, setScopes] = useState("ads_read,leads_retrieval");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [connectOpen, setConnectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Settings Form State
  const [budget, setBudget] = useState("");
  const [frequency, setFrequency] = useState("4H");

  const refresh = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      const a = await marketingService.listConnectedAccounts(session.tenant_id, session);
      setAccounts(a);
      if (isManual) toast.success("Integration registry synchronized.");
    } catch (err) {
      console.error("Failed to fetch connected accounts:", err);
      toast.error("Telemetry failure in integration suite.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.tenant_id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setStatus = async (accountId: string, status: ConnectionStatus) => {
    try {
      setRefreshing(true);
      await marketingService.updateAccountStatus(session.tenant_id, session, accountId, status);
      toast.success(`Protocol ${status} executed for node.`);
      refresh(true);
    } catch (err) {
      toast.error("Authorization protocol failure.");
      setRefreshing(false);
    }
  };

  const handleSync = async (accountId: string) => {
    try {
      setRefreshing(true);
      toast.info("Initializing multi-cloud data synchronization...");
      const result = await marketingService.syncAccount(session.tenant_id, session, accountId);
      toast.success(`Synchronization successful: ${result.data.dataPoints} data points ingested.`);
      refresh(true);
    } catch (err) {
      toast.error("Cloud synchronization protocol failure.");
      setRefreshing(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm("Are you sure you want to decommission this node? All cloud link credentials will be purged.")) return;
    try {
      setRefreshing(true);
      await marketingService.deleteAccount(session.tenant_id, session, accountId);
      toast.success("Integration node decommissioned successfully.");
      refresh(true);
    } catch (err) {
      toast.error("Node decommissioning failure.");
      setRefreshing(false);
    }
  };

  const openSettings = (account: ConnectedAccount) => {
    setSelectedAccount(account);
    setBudget(account.dailyBudgetLimit?.toString() || "");
    setFrequency(account.syncFrequency || "4H");
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedAccount) return;
    try {
      setSavingSettings(true);
      await marketingService.updateAccountSettings(session.tenant_id, session, selectedAccount.id, {
        daily_budget_limit: budget ? parseFloat(budget) : undefined,
        sync_frequency: frequency,
      });
      toast.success("Account configuration updated.");
      setSettingsOpen(false);
      refresh();
    } catch (err) {
      toast.error("Failed to update configuration.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleConnect = async () => {
    try {
      setRefreshing(true);
      const { url } = await marketingService.getAuthUrl(session.tenant_id, session, provider);
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Handshake protocol generation failed.");
      }
    } catch (err) {
      console.error("Failed to fetch auth URL:", err);
      toast.error("Initialization failure.");
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted dark:bg-muted">
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 bg-primary rounded-[2.5rem] animate-pulse flex items-center justify-center shadow-2xl shadow-indigo-500/20">
             <Link2 className="h-10 w-10 text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Booting Cloud Nexus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-1000 max-w-[1600px] mx-auto pb-24">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary text-white border-none font-black px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">Strategic Nexus</Badge>
            <div className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-widest">
               <Activity className="h-4 w-4 animate-pulse" />
               Cloud Links Secure
            </div>
          </div>
          <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-br from-slate-900 via-slate-700 to-indigo-900 dark:from-white dark:to-slate-400 bg-clip-text text-transparent text-left italic">Connected Accounts</h1>
          <p className="text-muted-foreground font-medium max-w-2xl text-lg leading-relaxed italic text-left">"Authorize and orchestrate multi-cloud synchronization with total intelligence."</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            className="h-14 w-14 rounded-2xl bg-white dark:bg-muted border-none shadow-xl hover:scale-110 transition-all"
            onClick={() => refresh(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-6 w-6 text-primary", refreshing && "animate-spin")} />
          </Button>
          <Link to="/core/marketing/audit-logs">
            <Button
              variant="secondary"
              className="h-14 px-6 rounded-2xl bg-white dark:bg-muted border-none shadow-xl hover:scale-105 transition-all font-black text-[10px] uppercase tracking-widest gap-2"
            >
              <Shield className="h-5 w-5 text-primary" />
              Governance Trail
            </Button>
          </Link>
          <Button 
            className="h-[4.5rem] px-10 rounded-[2rem] bg-primary hover:bg-primary shadow-2xl shadow-indigo-500/30 font-black text-sm gap-3 group transition-all hover:scale-105 active:scale-95"
            onClick={() => setConnectOpen(true)}
          >
            <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" /> 
            INITIALIZE CLOUD LINK
          </Button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Links', val: (Array.isArray(accounts) ? accounts : []).filter(a => a.status === 'CONNECTED').length, icon: Link2, color: 'text-primary' },
          { label: 'Data Sync Rate', val: '99.9%', icon: RefreshCw, color: 'text-success' },
          { label: 'Sync Latency', val: '142ms', icon: Activity, color: 'text-warning' },
          { label: 'Verified Scopes', val: '24', icon: ShieldCheck, color: 'text-primary' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-[2.5rem] border-none shadow-xl bg-white/40 dark:bg-muted backdrop-blur-md group hover:shadow-2xl transition-all">
            <CardContent className="p-8 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic leading-none">{stat.label}</p>
                <p className={cn("text-3xl font-black tracking-tighter uppercase italic leading-none", stat.color)}>{stat.val}</p>
              </div>
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", stat.color.replace('text', 'bg').replace('600', '100').replace('500', '100'))}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(Array.isArray(accounts) ? accounts : []).map((item) => (
          <Card key={item.id} className="rounded-[3rem] border-none shadow-2xl bg-white/60 dark:bg-muted backdrop-blur-xl group relative overflow-hidden flex flex-col hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.2)] transition-all duration-500">
            {/* Status Indicator */}
            <div className={cn(
              "absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl -mr-16 -mt-16 opacity-20",
              item.status === 'CONNECTED' ? "bg-success" : item.status === 'EXPIRED' ? "bg-destructive" : "bg-muted"
            )} />
            
            <CardHeader className="p-10 pb-6 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className={cn(
                  "h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 duration-500",
                  item.provider === 'META' ? "bg-primary text-white" : 
                  item.provider === 'GOOGLE' ? "bg-white text-muted-foreground dark:bg-muted dark:text-white" :
                  item.provider === 'TIKTOK' ? "bg-black text-white" :
                  item.provider === 'YOUTUBE' ? "bg-destructive text-white" :
                  item.provider === 'INSTAGRAM' ? "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white" :
                  "bg-primary text-white"
                )}>
                  {item.provider === 'META' ? <Facebook className="h-8 w-8" /> : 
                   item.provider === 'GOOGLE' ? <Chrome className="h-8 w-8" /> :
                   item.provider === 'TIKTOK' ? <Play className="h-8 w-8" /> :
                   item.provider === 'YOUTUBE' ? <Youtube className="h-8 w-8" /> :
                   item.provider === 'INSTAGRAM' ? <Instagram className="h-8 w-8" /> :
                   <Facebook className="h-8 w-8" />}
                </div>
                <div className="text-right">
                   <Badge className={cn(
                     "rounded-full font-black text-[9px] px-3 py-1 border-none shadow-lg tracking-widest",
                     item.status === 'CONNECTED' ? "bg-success text-white shadow-emerald-500/20" : 
                     item.status === 'EXPIRED' ? "bg-destructive text-white shadow-rose-500/20" : "bg-muted dark:bg-muted text-muted-foreground"
                   )}>
                     {item.status}
                   </Badge>
                   <div className="mt-2">
                     <Badge variant="outline" className={cn(
                       "rounded-full font-black text-[7px] px-2 py-0.5 border shadow-sm tracking-widest uppercase italic",
                       item.syncStatus === 'SYNCING' ? "border-primary text-primary animate-pulse" :
                       item.syncStatus === 'FAILED' ? "border-rose-500 text-destructive" : "border-slate-200 text-muted-foreground"
                     )}>
                       Sync: {item.syncStatus}
                     </Badge>
                   </div>
                </div>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black uppercase tracking-tight italic group-hover:text-primary transition-colors">{item.accountName}</CardTitle>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                   <Hash className="h-3 w-3" /> ID: {item.id.slice(0, 8)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-10 pt-0 flex-1 space-y-8 relative z-10">
              <div className="space-y-6 bg-muted dark:bg-muted p-6 rounded-[2rem] border border-white/20 dark:border-slate-700/20 shadow-inner">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary" /> Token Expiry
                   </div>
                   <span className="text-[11px] font-black uppercase italic">{new Date(item.tokenExpiresAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <RefreshCw className="h-4 w-4 text-primary" /> Last Sync
                   </div>
                   <span className="text-[11px] font-black uppercase italic">{item.lastSyncAt ? new Date(item.lastSyncAt).toLocaleTimeString() : "PENDING"}</span>
                </div>
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Strategic Actions</p>
                 <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-12 rounded-xl border-none bg-muted dark:bg-muted font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm gap-2"
                      onClick={() => handleSync(item.id)}
                      disabled={refreshing || item.syncStatus === 'SYNCING'}
                    >
                      {item.syncStatus === 'SYNCING' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                      SYNCHRONIZE
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-12 rounded-xl border-none bg-muted dark:bg-muted font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">
                           PARAMETERS
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-2xl border-none shadow-2xl p-2 w-56">
                         <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-3 py-2">Auth Protocols</DropdownMenuLabel>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem className="gap-3 py-3 rounded-xl font-bold" onClick={() => setStatus(item.id, "CONNECTED")}><CheckCircle2 className="h-4 w-4 text-success" /> Re-Authorize Link</DropdownMenuItem>
                         <DropdownMenuItem className="gap-3 py-3 rounded-xl font-bold" onClick={() => setStatus(item.id, "EXPIRED")}><AlertCircle className="h-4 w-4 text-warning" /> Revoke Tokens</DropdownMenuItem>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem className="gap-3 py-3 rounded-xl font-bold" onClick={() => openSettings(item)}>
                            <Settings className="h-4 w-4 text-primary" /> Configure Settings
                         </DropdownMenuItem>
                         <DropdownMenuItem className="gap-3 py-3 rounded-xl font-bold text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /> Decommission Node</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                 </div>
              </div>
            </CardContent>
            
            <div className="p-10 pt-0 pb-10">
               <div className="h-1.5 w-full bg-muted dark:bg-muted rounded-full overflow-hidden shadow-inner">
                  <div className={cn(
                    "h-full transition-all duration-1000",
                    item.status === 'CONNECTED' ? (item.syncStatus === 'SYNCING' ? "bg-primary" : "bg-success") : "bg-muted"
                  )} style={{ width: item.status === 'CONNECTED' ? '100%' : '30%' }} />
               </div>
            </div>
          </Card>
        ))}
        
        {/* Placeholder for expansion */}
        <button 
          className="rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-6 h-[450px] group hover:border-primary transition-all hover:bg-white/40 dark:hover:bg-muted"
          onClick={() => setConnectOpen(true)}
        >
           <div className="h-20 w-20 rounded-full bg-muted dark:bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
             <Plus className="h-10 w-10 group-hover:rotate-90 transition-transform duration-500" />
           </div>
           <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-primary transition-colors">Expand Cloud Nexus</p>
        </button>
      </div>

      {/* Initialize Cloud Link Wizard */}
      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] border-none bg-white dark:bg-muted p-0 overflow-hidden shadow-2xl">
          <div className="h-2 bg-primary" />
          <div className="p-12 space-y-10">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                 <Badge className="bg-primary text-white font-black text-[10px] uppercase tracking-widest">Auth Protocol</Badge>
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Node Initialization</p>
              </div>
              <DialogTitle className="text-4xl font-black tracking-tighter uppercase italic">Initialize Link</DialogTitle>
              <DialogDescription className="text-base font-medium italic italic">Authorize a new multi-cloud synchronization node via secure OAuth handshake.</DialogDescription>
            </DialogHeader>
            <div className="space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Target Provider</Label>
                <Select value={provider} onValueChange={(value: ConnectedProvider) => setProvider(value)}>
                  <SelectTrigger className="h-16 rounded-2xl bg-muted dark:bg-muted border-none shadow-inner font-bold text-lg">
                    <SelectValue placeholder="Protocol Matrix" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                    {(Array.isArray(PROVIDERS) ? PROVIDERS : []).map((item) => (
                      <SelectItem key={item} value={item} className="rounded-xl py-3 font-bold uppercase tracking-widest text-xs">
                        {item} CLOUD ENGINE
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                 className="w-full h-16 rounded-2xl bg-primary hover:bg-primary font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/30 gap-3"
                 onClick={handleConnect}
                 disabled={refreshing}
              >
                {refreshing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                AUTHORIZE CLOUD HANDSHAKE
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-muted max-w-lg p-10">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-4">
               <Settings className="h-8 w-8 text-primary" />
               Account Configuration
            </DialogTitle>
            <DialogDescription className="text-base font-medium italic opacity-60 italic">
              Adjust synchronization frequency and budget safeguards for {selectedAccount?.accountName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8 py-4">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">Daily Budget Safe-Limit (USD)</Label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="number"
                  placeholder="0.00" 
                  className="h-14 pl-12 bg-muted dark:bg-muted border-none rounded-2xl font-bold"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic font-medium leading-none px-1">Automated pause will trigger if spend exceeds this threshold.</p>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">Synchronization Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="h-14 bg-muted dark:bg-muted border-none rounded-2xl font-bold">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="1H">Real-time (1 Hour)</SelectItem>
                  <SelectItem value="4H">Standard (4 Hours)</SelectItem>
                  <SelectItem value="12H">Optimized (12 Hours)</SelectItem>
                  <SelectItem value="24H">Daily Sync (24 Hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-8 gap-4 sm:justify-start">
            <Button 
              className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary font-black text-xs uppercase tracking-widest gap-2 flex-1 shadow-xl shadow-indigo-500/20"
              onClick={handleSaveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
              AUTHORIZE CHANGES
            </Button>
            <Button 
              variant="ghost"
              className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest"
              onClick={() => setSettingsOpen(false)}
            >
              CANCEL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ className, children, ...props }: any) {
  return (
    <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props}>
      {children}
    </label>
  );
}
