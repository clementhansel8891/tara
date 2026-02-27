import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import {
  Store,
  MapPin,
  Clock,
  ShieldCheck,
  Mail,
  Phone,
  Users,
  Fingerprint,
  Lock,
  Globe,
  Building2,
  Save,
  RefreshCw,
  Plus,
  BarChart3,
  Activity,
  Zap,
  Layout,
  HardDrive,
  UserCheck,
  PackageCheck,
  Signal,
  ArrowRight,
  Monitor,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/core/security/session";
import { retailService } from "@/core/services/retail/retailService";
import type { RetailStore } from "@/core/types/retail/retail";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { RegisterStoreDialog } from "./modals/RegisterStoreDialog";
import { cn } from "@/lib/utils";

const StoreProfile = () => {
  const session = useSession();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [stores, setStores] = useState<RetailStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all_stores");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchStores = async () => {
      if (!session.tenantId) return;
      try {
        const data = await retailService.listStores(session.tenantId!, session);
        setStores(data);
      } catch (error) {
        console.error("Failed to fetch stores", error);
      }
    };
    fetchStores();
  }, [session.tenantId, session]);

  const selectedStore = useMemo(() => {
    if (selectedStoreId === "all_stores") return null;
    return stores.find((s) => s.id === selectedStoreId) || null;
  }, [selectedStoreId, stores]);

  const stats = useMemo(() => {
    const active = stores.filter((s) => s.status === "active").length;
    const flagshipCount = stores.filter((s) => s.type === "flagship").length;
    const totalArea = stores.length * 1250; // Mocked
    return { active, flagshipCount, totalArea };
  }, [stores]);

  const handleUpdate = (updatedStore: RetailStore) => {
    setStores((prev) =>
      prev.map((s) => (s.id === updatedStore.id ? updatedStore : s)),
    );
  };

  const handleDecommission = () => {
    if (!selectedStore) return;
    if (
      !confirm(
        `Permanently decommission ${selectedStore.name}? This cannot be undone.`,
      )
    )
      return;
    toast({
      title: "Decommission Initiated",
      description: `${selectedStore.name} has been flagged for operational freeze. IT review required.`,
      variant: "destructive",
    });
  };

  const handleSave = async () => {
    if (!selectedStore) return;
    setIsSaving(true);
    try {
      await retailService.updateStore(
        session.tenantId!,
        session,
        selectedStore,
      );
      toast({
        title: "Node Synchronized",
        description: `Configuration parameters for ${selectedStore.name} updated globally.`,
      });
    } catch (e) {
      toast({
        title: "Handshake Failed",
        description: "Consistency check failed during persistence.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      {/* Header Context Switcher */}
      <div className="px-8 py-6 border-b bg-white shrink-0 flex items-center justify-between gap-6">
        <PageHeader
          title={selectedStore ? selectedStore.name : "Fleet Intelligence"}
          subtitle={
            selectedStore
              ? `Operational Node: ${selectedStore.code} • ${selectedStore.type?.toUpperCase() || "STOREFRONT"}`
              : `Consolidated Management Hub • ${stores.length} Nodes Active`
          }
        />
        <div className="flex items-center gap-3">
          <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
            <SelectTrigger className="w-[320px] h-12 rounded-2xl border-slate-200 bg-slate-50 font-black italic text-sm shadow-sm hover:bg-white transition-all ring-offset-white focus:ring-4 focus:ring-blue-500/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-200 shadow-2xl p-2">
              <SelectItem
                value="all_stores"
                className="font-black italic py-3 cursor-pointer rounded-xl"
              >
                <div className="flex items-center gap-2 text-blue-600">
                  <Globe className="w-4 h-4" /> GLOBAL FLEET VIEW
                </div>
              </SelectItem>
              <Separator className="my-2" />
              {stores.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                  className="font-bold italic py-3 cursor-pointer rounded-xl"
                >
                  <div className="flex items-center gap-2 text-left">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm",
                        s.status === "active"
                          ? "bg-emerald-500"
                          : "bg-slate-300",
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{s.name}</span>
                      <span className="text-[9px] opacity-40 uppercase tracking-widest">
                        {s.code}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RegisterStoreDialog
            onSuccess={(s) => {
              setStores((p) => [...p, s]);
              setSelectedStoreId(s.id);
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex items-center justify-between border-b pb-px mb-12">
              <TabsList className="bg-transparent h-auto p-0 gap-16 rounded-none justify-start">
                {[
                  { id: "overview", label: "Metadata", icon: Layout },
                  { id: "operations", label: "Capabilities", icon: Zap },
                  {
                    id: "inventory",
                    label: "Logistics Hub",
                    icon: PackageCheck,
                  },
                  {
                    id: "infrastructure",
                    label: "Hardware Grid",
                    icon: Monitor,
                  },
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
              {selectedStore && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-11 px-8 rounded-2xl bg-slate-900 font-black italic uppercase tracking-widest text-[10px] gap-2 mb-4 shadow-xl hover:shadow-blue-900/10 transition-all active:scale-95"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 text-blue-400" />
                  )}
                  Push Global Sync
                </Button>
              )}
            </div>

            <TabsContent
              value="overview"
              className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {!selectedStore ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <Card className="rounded-[2.5rem] p-8 border-none shadow-2xl bg-slate-900 text-white relative overflow-hidden group">
                    <Globe className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-8 italic">
                        Fleet Coverage
                      </div>
                      <div>
                        <div className="text-6xl font-black italic tracking-tighter mb-2">
                          {stores.length}
                        </div>
                        <div className="text-sm font-black italic text-slate-400">
                          Nodes Active
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="rounded-[2.5rem] p-8 bg-white border-slate-200 shadow-xl relative overflow-hidden group">
                    <Activity className="absolute -right-8 -bottom-8 w-48 h-48 opacity-5 text-blue-600 group-hover:rotate-12 transition-transform duration-700" />
                    <div className="relative z-10">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 italic">
                        Personnel Density
                      </div>
                      <div className="text-6xl font-black italic tracking-tighter text-slate-900 mb-2">
                        184
                      </div>
                      <div className="text-sm font-black italic text-emerald-600">
                        Optimal Coverage
                      </div>
                    </div>
                  </Card>

                  <Card className="rounded-[2.5rem] p-8 bg-white border-slate-200 shadow-xl relative overflow-hidden group">
                    <Building2 className="absolute -right-8 -bottom-8 w-48 h-48 opacity-5 text-blue-600 group-hover:translate-x-4 transition-transform duration-700" />
                    <div className="relative z-10">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 italic">
                        Physical Footprint
                      </div>
                      <div className="text-4xl font-black italic tracking-tighter text-slate-900 mb-2">
                        {stats.totalArea.toLocaleString()} m²
                      </div>
                      <div className="text-sm font-black italic text-slate-400 uppercase tracking-widest">
                        Premium Retail Space
                      </div>
                    </div>
                  </Card>

                  <Card className="rounded-[2.5rem] p-8 bg-emerald-600 text-white shadow-2xl relative overflow-hidden group cursor-pointer hover:bg-emerald-700 transition-all">
                    <ShieldCheck className="absolute -right-8 -bottom-8 w-48 h-48 opacity-20" />
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-8 italic">
                        Security Integrity
                      </div>
                      <div className="text-4xl font-black italic tracking-tighter mb-2">
                        CERTIFIED
                      </div>
                      <div className="text-xs font-black italic opacity-60 flex items-center gap-2">
                        <Signal className="w-3 h-3 text-white animate-pulse" />{" "}
                        100% Biometric Sync
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8 space-y-12">
                    <Card className="rounded-[2.5rem] p-10 bg-white border-slate-200 shadow-xl">
                      <div className="flex items-center gap-3 mb-10">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                          <Fingerprint className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black italic uppercase tracking-widest text-slate-900">
                          Core Identity Module
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <Label
                            htmlFor="store-name"
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1"
                          >
                            Branch Nomenclature
                          </Label>
                          <Input
                            id="store-name"
                            placeholder="e.g., Central Plaza Store"
                            aria-label="Branch name"
                            value={selectedStore.name}
                            onChange={(e) =>
                              handleUpdate({
                                ...selectedStore,
                                name: e.target.value,
                              })
                            }
                            className="h-14 lg:h-16 text-xl font-black italic border-slate-200 rounded-2xl bg-white shadow-sm ring-offset-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1">
                            Unique Identifier [Immutable]
                          </Label>
                          <div className="h-14 lg:h-16 flex items-center px-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-black italic uppercase tracking-widest">
                            {selectedStore.code}
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                          <Label
                            htmlFor="geo-distribution-point"
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic ml-1"
                          >
                            Geospatial Distribution Point
                          </Label>
                          <textarea
                            id="geo-distribution-point"
                            placeholder="Enter the geospatial distribution address..."
                            value={selectedStore.address || ""}
                            onChange={(e) =>
                              handleUpdate({
                                ...selectedStore,
                                address: e.target.value,
                              })
                            }
                            className="w-full min-h-[140px] p-6 lg:p-8 font-bold italic border border-slate-200 rounded-[2rem] bg-white shadow-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Card className="rounded-[2.5rem] p-10 bg-white border-slate-200 shadow-xl">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-8">
                          Communication Vector
                        </h4>
                        <div className="space-y-6">
                          <div className="relative group">
                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            <Input
                              aria-label="Store hotline"
                              placeholder="+62 812 3456 7890"
                              title="Store phone number"
                              value={selectedStore.phone || ""}
                              onChange={(e) =>
                                handleUpdate({
                                  ...selectedStore,
                                  phone: e.target.value,
                                })
                              }
                              className="h-14 pl-16 rounded-2xl border-slate-200 font-bold italic"
                            />
                          </div>
                          <div className="relative group">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            <Input
                              aria-label="Store contact email"
                              placeholder="store@example.com"
                              title="Store contact email"
                              value={selectedStore.email || ""}
                              onChange={(e) =>
                                handleUpdate({
                                  ...selectedStore,
                                  email: e.target.value,
                                })
                              }
                              className="h-14 pl-16 rounded-2xl border-slate-200 font-bold italic"
                            />
                          </div>
                        </div>
                      </Card>

                      <Card className="rounded-[2.5rem] p-10 bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
                        <Building2 className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10 text-white" />
                        <div className="relative z-10">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic mb-10">
                            Operational Spec
                          </h4>
                          <div className="space-y-8">
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                              <span className="text-[10px] font-black text-slate-400 uppercase">
                                Gross Area
                              </span>
                              <span className="text-xl font-black italic text-white tracking-tighter">
                                1,240 m²
                              </span>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                              <span className="text-[10px] font-black text-slate-400 uppercase">
                                Ceiling Height
                              </span>
                              <span className="text-xl font-black italic text-white tracking-tighter">
                                4.5 m
                              </span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-slate-400 uppercase">
                                Loading Dock
                              </span>
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black italic text-[8px] uppercase">
                                EQUIPPED
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-12">
                    <Card className="rounded-[2.5rem] p-10 bg-blue-600 text-white shadow-2xl relative overflow-hidden group cursor-pointer hover:bg-blue-700 transition-all">
                      <MapPin className="absolute -right-12 -top-12 w-64 h-64 opacity-10 group-hover:scale-110 transition-transform duration-1000" />
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-white/10 font-bold italic text-[9px] border-none px-4">
                            REGIONAL HUB
                          </Badge>
                          <Globe className="w-5 h-5 opacity-40" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-3xl font-black italic tracking-tighter uppercase leading-tight">
                            Jakarta Alpha Sector
                          </h4>
                          <p className="text-xs font-bold opacity-60 leading-relaxed italic">
                            Primary distribution node for the South Jakarta
                            operational cluster.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-blue-600 font-black italic h-14 rounded-2xl text-[11px] uppercase tracking-widest group"
                        >
                          View Sector Map{" "}
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </Card>

                    <Card className="rounded-[2.5rem] p-10 bg-white border-slate-200 shadow-xl space-y-8">
                      <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400">
                        Personnel Roster
                      </div>
                      <div className="space-y-6">
                        {[
                          {
                            name: "Hendrik Wijaya",
                            role: "Store Manager",
                            status: "online",
                          },
                          {
                            name: "Siti Amelia",
                            role: "Shift Supervisor",
                            status: "online",
                          },
                          {
                            name: "Budi Santoso",
                            role: "Logistics Lead",
                            status: "offline",
                          },
                        ].map((person, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black italic shadow-lg">
                                {person.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-black italic text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {person.name}
                                </div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  {person.role}
                                </div>
                              </div>
                            </div>
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                person.status === "online"
                                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                  : "bg-slate-300",
                              )}
                            />
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full h-14 border-2 border-dashed border-slate-200 rounded-2xl font-black italic uppercase text-[9px] text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all"
                      >
                        Manage Full Roster
                      </Button>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="operations"
              className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="rounded-[2.5rem] p-10 bg-white border-slate-200 shadow-xl space-y-8">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest italic">
                      Temporal Grid
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {[
                      { day: "Mon-Fri", hours: "09:00 - 22:00", active: true },
                      { day: "Saturday", hours: "08:00 - 23:00", active: true },
                      { day: "Sunday", hours: "10:00 - 21:00", active: false },
                    ].map((time, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-slate-50/50"
                      >
                        <span className="text-xs font-black italic text-slate-900">
                          {time.day}
                        </span>
                        <div className="flex items-center gap-3">
                          <code className="text-[10px] font-black bg-white px-3 py-1 rounded-lg border shadow-sm">
                            {time.hours}
                          </code>
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              time.active ? "bg-emerald-500" : "bg-red-500",
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full h-12 bg-slate-900 font-black italic uppercase text-[9px] tracking-widest rounded-xl">
                    Adjust Operational Windows
                  </Button>
                </Card>

                <Card className="rounded-[2.5rem] p-10 bg-white border-slate-200 shadow-xl space-y-8">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest italic">
                      Service Nodes
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "POS Clusters", value: 6, status: "stable" },
                      {
                        label: "Self-Checkout",
                        value: 2,
                        status: "restricted",
                      },
                      { label: "Weighing Scales", value: 4, status: "stable" },
                      { label: "Mobile Scanners", value: 12, status: "stable" },
                    ].map((node, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-white shadow-sm"
                      >
                        <span className="text-xs font-black italic text-slate-600">
                          {node.label}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-black italic">
                            {node.value}
                          </span>
                          <Badge
                            className={cn(
                              "text-[8px] font-black italic border-none h-4",
                              node.status === "stable"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700",
                            )}
                          >
                            {node.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="rounded-[2.5rem] p-10 bg-slate-900 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                  <Activity className="absolute -right-8 -top-8 w-48 h-48 opacity-10 animate-pulse" />
                  <div className="relative z-10">
                    <Badge className="bg-emerald-600 font-black italic text-[9px] uppercase tracking-widest border-none px-4">
                      Handshake Verified
                    </Badge>
                  </div>
                  <div className="relative z-10 space-y-6">
                    <h4 className="text-3xl font-black italic uppercase tracking-tighter">
                      Latency Pulse
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                        <span>Fleet Average</span>
                        <span className="text-white">12 ms</span>
                      </div>
                      <Progress value={92} className="h-1 bg-white/10" />
                    </div>
                  </div>
                  <Button className="relative z-10 h-14 bg-white/10 hover:bg-white/20 border-white/20 text-white font-black italic uppercase text-[10px] tracking-widest rounded-2xl">
                    Execute Node Diagnostics
                  </Button>
                </Card>
              </div>
            </TabsContent>

            <TabsContent
              value="inventory"
              className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card className="rounded-[2.5rem] bg-white border-slate-200 shadow-xl overflow-hidden">
                    <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <PackageCheck className="w-6 h-6 text-blue-600" />
                        <h3 className="text-sm font-black italic uppercase tracking-widest text-slate-900">
                          Inventory Distribution Channel
                        </h3>
                      </div>
                      <Badge className="bg-blue-600 text-white font-black italic text-[9px] uppercase border-none px-4">
                        Primary Flow
                      </Badge>
                    </div>
                    <div className="p-10 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-6">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                            Inbound source
                          </h4>
                          <div className="space-y-4">
                            <div className="text-xl font-black italic text-slate-900 uppercase">
                              JKT-DC-ALPHA-01
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed">
                              Main distribution hub located in West Jakarta.
                              Estimated lead time: 4.5 hours.
                            </p>
                            <Button
                              variant="outline"
                              className="w-full h-12 rounded-xl text-[9px] font-black italic uppercase tracking-widest border-slate-200"
                            >
                              Re-Route Source
                            </Button>
                          </div>
                        </div>
                        <div className="p-8 rounded-[2rem] bg-blue-50 border border-blue-100 space-y-6">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic">
                            Storage Capacity
                          </h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-end">
                              <span className="text-4xl font-black italic text-blue-900 tracking-tighter">
                                84%
                              </span>
                              <span className="text-[10px] font-black text-blue-400 uppercase">
                                Capacity Utilized
                              </span>
                            </div>
                            <Progress
                              value={84}
                              className="h-2 bg-blue-200/50"
                            />
                            <p className="text-[10px] font-bold text-blue-600/60 italic leading-relaxed uppercase">
                              Buffer threshold engaged. Auto-replenishment
                              restricted.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center">
                        <Button
                          variant="ghost"
                          className="h-16 px-12 font-black italic uppercase text-[10px] tracking-widest text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-2xl gap-3"
                        >
                          <Plus className="w-4 h-4" /> Register Secondary Supply
                          Path
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="space-y-8">
                  <Card className="rounded-[2.5rem] p-10 bg-white shadow-xl space-y-8">
                    <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400">
                      Inventory Integrity Pulse
                    </div>
                    <div className="space-y-6">
                      {[
                        { label: "Audit Accuracy", value: 99.8, trend: "UP" },
                        {
                          label: "Cycle Count Progress",
                          value: 65,
                          trend: "STABLE",
                        },
                        { label: "Shrinkage Rate", value: 0.2, trend: "DOWN" },
                      ].map((stat, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center italic">
                            <span className="text-[10px] font-black text-slate-500 uppercase">
                              {stat.label}
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {stat.value}%
                            </span>
                          </div>
                          <Progress
                            value={stat.value === 0.2 ? 98 : stat.value}
                            className="h-1 bg-slate-100"
                          />
                        </div>
                      ))}
                    </div>
                    <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black italic uppercase tracking-widest rounded-2xl shadow-lg">
                      Request Physical Audit
                    </Button>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="infrastructure"
              className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="p-32 rounded-[3.5rem] border-2 border-dashed border-slate-200 text-center bg-white shadow-inner flex flex-col items-center justify-center space-y-10 group">
                <div className="relative">
                  <div className="w-32 h-32 bg-slate-900 border-4 border-white rounded-[3rem] flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-500">
                    <HardDrive className="w-14 h-14 text-blue-400" />
                  </div>
                  <div className="absolute -right-4 -top-4 w-12 h-12 bg-emerald-500 border-4 border-white rounded-2xl flex items-center justify-center">
                    <Signal className="w-6 h-6 text-white animate-pulse" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-black italic text-slate-900 tracking-tighter uppercase leading-tight">
                    Branch Node Infrastructure
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] max-w-sm mx-auto leading-loose italic">
                    Real-time hardware topology mapping and peripheral control
                    required specific node authentication.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button className="h-16 px-12 rounded-[2rem] bg-slate-900 font-black italic uppercase text-xs tracking-widest shadow-2xl hover:shadow-blue-900/10 active:scale-95 transition-all">
                    Initialize Grid Scan
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 px-12 rounded-[2rem] border-2 border-slate-200 font-black italic uppercase text-xs tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    Hardware Registry
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Danger Zone at the very bottom for selected store */}
          {selectedStore && (
            <div className="pt-24 border-t">
              <div className="flex items-center gap-4 mb-10">
                <Badge
                  variant="destructive"
                  className="font-black italic px-4 py-1 text-[10px] tracking-widest uppercase"
                >
                  Critical Operations
                </Badge>
                <Separator className="flex-1 opacity-20" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="rounded-[2.5rem] p-8 border-red-100 bg-red-50/20 flex items-center justify-between group overflow-hidden relative">
                  <ShieldAlert className="absolute -right-4 -bottom-4 w-24 h-24 opacity-5 text-red-600 group-hover:scale-110 transition-transform" />
                  <div className="relative z-10 text-left">
                    <h4 className="text-sm font-black italic text-red-900 uppercase">
                      Terminate Branch Node
                    </h4>
                    <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-tight italic">
                      Permanent operational freeze for this location.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDecommission}
                    className="relative z-10 h-12 px-8 rounded-xl font-black italic uppercase tracking-widest text-[9px] shadow-lg shadow-red-900/10"
                  >
                    Execute
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;
