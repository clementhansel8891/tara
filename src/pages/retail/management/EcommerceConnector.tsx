import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Link2,
  Plus,
  RefreshCw,
  Server,
  Code2,
  Network,
  ShoppingBag,
  CheckCircle2,
  Activity,
  Globe,
  Signal,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BarChart3,
  Search,
  Settings2,
  Monitor,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/core/security/session";
import { Roles } from "@/core/security/roles";
import { workflowService } from "@/core/services/hr/workflowService";
import { resolveDepartment } from "@/core/org/departmentResolver";
import {
  ecommerceHubService,
  type EcommerceConnectorRecord,
  type ChannelRecord,
} from "@/core/services/retail/ecommerceHubService";
import type { WorkflowStatus } from "@/core/tools/workflows/workflowTypes";
import type { RetailChannel } from "@/core/types/retail/retail";
import DeveloperConsole from "@/pages/retail/management/DeveloperConsole";
import { apiUrl } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Modular Components
import { MarketplaceGallery } from "./components/MarketplaceGallery";
import { ChannelListItem } from "./components/ChannelListItem";
import { ManageConnectorDialog } from "./components/ManageConnectorDialog";
import { ChannelDetailDialog } from "./components/ChannelDetailDialog";

const EcommerceConnector = () => {
  const session = useSession();
  const { toast } = useToast();
  const gatewayUrl = apiUrl("/retail/events");

  // State
  const [connectors, setConnectors] = useState<EcommerceConnectorRecord[]>([]);
  const [channels, setChannels] = useState<ChannelRecord[]>([]);
  const [activeTab, setActiveTab] = useState("headless");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelRecord | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Stats
  const globalStats = useMemo(() => {
    const totalChannels = channels.length;
    const activeSyncs = channels.filter((c) => c.status === "active").length;
    const totalRequests = 12400 + channels.length * 450; // Mocked
    return { totalChannels, activeSyncs, totalRequests };
  }, [channels]);

  // Actions
  const refreshChannels = useCallback(async () => {
    try {
      const data = await ecommerceHubService.listChannels(session);
      setChannels(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast({
        title: "Sync Failed",
        description: "Metadata handshake failed.",
        variant: "destructive",
      });
    }
  }, [session, toast]);

  const refreshConnectors = useCallback(async () => {
    try {
      const data = await ecommerceHubService.listConnectors(session);
      setConnectors(data);
    } catch (e) {
      console.error(e);
    }
  }, [session]);

  useEffect(() => {
    refreshChannels();
    refreshConnectors();
  }, [refreshChannels, refreshConnectors]);

  const handleOpenDialog = (
    name = "",
    type = "MARKETPLACE",
    platform = "custom",
  ) => {
    // Reset and open
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      {/* Premium Header */}
      <div className="px-8 py-6 border-b bg-white shrink-0 flex items-center justify-between gap-6">
        <PageHeader
          title="Digital Channel Nerve Center"
          subtitle={`Unified Connectivity Hub • ${globalStats.activeSyncs}/${globalStats.totalChannels} Channels Online`}
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={refreshChannels}
            className="h-12 px-6 rounded-2xl border-slate-200 font-black italic uppercase tracking-widest text-[10px] gap-2 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className="w-4 h-4 text-blue-500" />
            Pulse Sync
          </Button>
          <Button
            className="h-12 px-8 rounded-2xl bg-slate-900 text-white font-black italic uppercase tracking-widest text-[10px] gap-2 shadow-xl hover:shadow-blue-900/20 active:scale-95 transition-all"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Provision Channel
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Global Dashboard Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="rounded-[2.5rem] p-8 border-none shadow-2xl bg-slate-900 text-white relative overflow-hidden group">
              <Globe className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-8 italic">
                  Global Footprint
                </div>
                <div>
                  <div className="text-6xl font-black italic tracking-tighter mb-2">
                    {channels.length}
                  </div>
                  <div className="text-sm font-black italic text-slate-400 uppercase">
                    Registered Channels
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-[2.5rem] p-8 bg-white border-slate-200 shadow-xl relative overflow-hidden group">
              <Activity className="absolute -right-8 -bottom-8 w-48 h-48 opacity-5 text-blue-600 group-hover:rotate-12 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 italic">
                  Data Throughput
                </div>
                <div className="text-5xl font-black italic tracking-tighter text-slate-900 mb-2">
                  {(globalStats.totalRequests / 1000).toFixed(1)}k
                </div>
                <div className="text-[10px] font-black italic text-emerald-600 uppercase tracking-widest">
                  Requests / 24h
                </div>
              </div>
            </Card>

            <Card className="rounded-[2.5rem] p-8 bg-white border-slate-200 shadow-xl relative overflow-hidden group">
              <Signal className="absolute -right-8 -bottom-8 w-48 h-48 opacity-5 text-blue-600 group-hover:translate-x-4 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 italic">
                  Sync Reliability
                </div>
                <div className="text-5xl font-black italic tracking-tighter text-slate-900 mb-2">
                  99.9%
                </div>
                <div className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest">
                  SLA Compliance
                </div>
              </div>
            </Card>

            <Card className="rounded-[2.5rem] p-8 bg-emerald-600 text-white shadow-2xl relative overflow-hidden group">
              <ShieldCheck className="absolute -right-8 -bottom-8 w-48 h-48 opacity-20" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-8 italic">
                  Security Layer
                </div>
                <div className="text-4xl font-black italic tracking-tighter mb-2 uppercase italic">
                  ENCRYPTED
                </div>
                <div className="text-[10px] font-black italic opacity-60 uppercase tracking-widest">
                  TLS 1.3 Active
                </div>
              </div>
            </Card>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex items-center justify-between border-b pb-px mb-12">
              <TabsList className="bg-transparent h-auto p-0 gap-16 rounded-none justify-start">
                {[
                  { id: "headless", label: "Headless Grid", icon: Code2 },
                  { id: "premade", label: "Bridge Connect", icon: Network },
                  { id: "preset", label: "Marketplace Hub", icon: ShoppingBag },
                  { id: "topology", label: "System Topology", icon: Cpu },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-4 font-black italic uppercase tracking-[0.2em] text-[10px] pb-6 px-0 flex items-center gap-3 transition-all group",
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-400 hover:text-slate-600",
                    )}
                  >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent
              value="headless"
              className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-12">
                  <div className="bg-blue-600 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
                    <Code2 className="absolute -right-12 -top-12 w-64 h-64 opacity-10" />
                    <div className="relative z-10 space-y-8">
                      <div className="flex items-center gap-4">
                        <Badge className="bg-white/20 font-black italic text-[9px] uppercase tracking-widest border-none px-4">
                          Development Environment
                        </Badge>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                            API Gateway Online
                          </span>
                        </div>
                      </div>
                      <div className="max-w-xl">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-tight mb-4">
                          Direct Headless Connectivity
                        </h2>
                        <p className="text-sm font-bold opacity-70 leading-relaxed italic">
                          Provision dedicated endpoints for Next.js, Nuxt, or
                          custom mobile clients. Manage unique client secrets
                          and rotation policies from a centralized vault.
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <Button className="h-14 px-8 rounded-2xl bg-white text-blue-600 font-black italic uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-50 transition-all">
                          Configure Gateway SDK
                        </Button>
                        <Button
                          variant="outline"
                          className="h-14 px-8 rounded-2xl border-white/20 text-white bg-white/10 font-black italic uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all"
                        >
                          Read API Docs
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                        Active Deployments
                      </h3>
                      <Badge
                        variant="outline"
                        className="font-black italic text-[9px] border-slate-200 opacity-60"
                      >
                        Filtered by: HEADLESS
                      </Badge>
                    </div>
                    <div className="rounded-[2.5rem] border border-slate-200 bg-white shadow-xl overflow-hidden divide-y divide-slate-100">
                      {channels.filter(
                        (c) => c.integrationCategory === "HEADLESS",
                      ).length === 0 ? (
                        <div className="p-32 text-center text-slate-300">
                          <Monitor className="w-12 h-12 mx-auto mb-6 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                            No active headless nodes
                          </p>
                        </div>
                      ) : (
                        channels
                          .filter((c) => c.integrationCategory === "HEADLESS")
                          .map((channel) => (
                            <div
                              key={channel.id}
                              className="p-8 flex items-center justify-between group hover:bg-slate-50/50 transition-colors"
                            >
                              <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                  <Globe className="w-8 h-8 text-blue-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-lg font-black italic text-slate-900">
                                      {channel.name}
                                    </h4>
                                    <Badge className="bg-emerald-50 text-emerald-600 font-black italic text-[8px] uppercase border-none">
                                      ACTIVE
                                    </Badge>
                                  </div>
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                    {channel.adapterType} • SYNC{" "}
                                    {channel.syncFrequency}
                                    <Separator
                                      orientation="vertical"
                                      className="h-2"
                                    />
                                    <span className="text-blue-500">
                                      {channel.id}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Button
                                  variant="ghost"
                                  className="w-12 h-12 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all p-0"
                                >
                                  <Settings2 className="w-5 h-5" />
                                </Button>
                                <Button className="h-12 px-6 rounded-xl bg-slate-900 font-black italic uppercase text-[9px] tracking-widest gap-2">
                                  Manage Keys <ArrowRight className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-12">
                  <Card className="rounded-[2.5rem] p-10 bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
                    <Server className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 text-white group-hover:scale-110 transition-transform duration-1000" />
                    <div className="relative z-10 space-y-8">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic">
                        Gateway Registry
                      </h4>
                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic block">
                            PRIMARY ENDPOINT
                          </Label>
                          <code className="text-[10px] font-mono text-emerald-400 break-all">
                            {gatewayUrl}
                          </code>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-left">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 italic block">
                            REGION ASSIGNMENT
                          </Label>
                          <div className="text-sm font-black italic text-white flex items-center justify-between">
                            AP-SOUTHEAST-1 [JAKARTA]
                            <Signal className="w-3 h-3 text-emerald-400" />
                          </div>
                        </div>
                      </div>
                      <Button className="w-full h-14 bg-white/10 hover:bg-white/20 border-white/20 text-white font-black italic uppercase text-[10px] tracking-widest rounded-2xl transition-all">
                        Rotate Gateway Key
                      </Button>
                    </div>
                  </Card>

                  <div className="p-1">
                    <DeveloperConsole />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="premade"
              className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="rounded-[3rem] p-12 bg-white border-slate-200 shadow-xl overflow-hidden hover:shadow-2xl transition-all group border-2">
                  <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-10 group-hover:rotate-12 transition-transform">
                    <Network className="w-10 h-10" />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                      Webhook Bridge
                    </h3>
                    <p className="text-sm font-bold text-slate-500 italic leading-relaxed">
                      Connect legacy ERP systems or custom CMS platforms via
                      structured outbound events.
                    </p>
                    <Button className="w-full h-16 rounded-[1.5rem] bg-emerald-600 text-white font-black italic uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all">
                      Initialize Bridge
                    </Button>
                  </div>
                </Card>

                <Card className="rounded-[3rem] p-12 border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col justify-center items-center text-center space-y-6 group cursor-pointer hover:bg-white transition-all">
                  <div className="w-16 h-16 bg-white rounded-3xl border-2 border-slate-200 flex items-center justify-center border-dashed mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <div className="font-black italic uppercase tracking-widest text-[10px] text-slate-500">
                      Schema Registry
                    </div>
                    <p className="text-[10px] font-black text-slate-400 italic uppercase tracking-tighter max-w-[180px]">
                      Import pre-defined mappings for Oracle, SAP, or Microsoft
                      Dynamics.
                    </p>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent
              value="preset"
              className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="space-y-12">
                <MarketplaceGallery />
              </div>
            </TabsContent>

            <TabsContent
              value="topology"
              className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="p-32 rounded-[3.5rem] border-2 border-dashed border-slate-200 text-center bg-white shadow-inner flex flex-col items-center justify-center space-y-10 group">
                <div className="relative">
                  <div className="w-32 h-32 bg-slate-900 border-4 border-white rounded-[3rem] flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-500">
                    <Cpu className="w-14 h-14 text-indigo-400" />
                  </div>
                  <div className="absolute -right-4 -top-4 w-12 h-12 bg-indigo-500 border-4 border-white rounded-2xl flex items-center justify-center">
                    <Signal className="w-6 h-6 text-white animate-pulse" />
                  </div>
                </div>
                <div className="space-y-4 text-center">
                  <h3 className="text-4xl font-black italic text-slate-900 tracking-tighter uppercase leading-tight">
                    Infrastructure Topology Mapping
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] max-w-sm mx-auto leading-loose italic text-center">
                    Visualizing the data flow between physical retail nodes and
                    digital storefront clusters.
                  </p>
                </div>
                <Button className="h-16 px-12 rounded-[2rem] bg-slate-900 font-black italic uppercase text-xs tracking-widest shadow-2xl hover:shadow-indigo-900/10 active:scale-95 transition-all">
                  Generate Flow Map
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ManageConnectorDialog
        isOpen={isDialogOpen}
        branchIds={branchIds}
        gatewayUrl={gatewayUrl}
        copyCredential={copyCredential}
      />

      <ChannelDetailDialog
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        selectedChannel={selectedChannel}
        detailName={detailName}
        setDetailName={setDetailName}
        detailSyncFreq={detailSyncFreq}
        setDetailSyncFreq={setDetailSyncFreq}
        detailSettings={detailSettings}
        setDetailSettings={setDetailSettings}
        detailClientId={detailClientId}
        detailClientSecret={detailClientSecret}
        approvalStatus={approvalStatus}
        approvalRequestId={approvalRequestId}
        canEdit={canEdit}
        isSaving={isSaving}
        rotationLoading={rotationLoading}
        revocationLoading={revocationLoading}
        session={session}
        branchIds={branchIds}
        gatewayUrl={gatewayUrl}
        handleRotateChannel={handleRotateChannel}
        handleRevokeChannel={handleRevokeChannel}
        handleDelete={handleDelete}
        handleSaveChannel={handleSaveChannel}
        handleRequestApproval={handleRequestApproval}
        copyCredential={copyCredential}
      />
    </div>
  );
};

export default EcommerceConnector;
