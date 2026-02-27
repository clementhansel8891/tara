import React, { useState, useEffect } from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import {
  MonitorDot,
  Smartphone,
  Laptop,
  Signal,
  Power,
  ShieldAlert,
  Wifi,
  Cpu,
  RefreshCw,
  MoreVertical,
  Zap,
  Lock,
  Plus,
  Focus,
  HardDrive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { retailService } from "@/core/services/retail/retailService";
import { useSession } from "@/core/security/session";
import type { POSDevice } from "@/core/types/retail/retail";

const DeviceControlCenter = () => {
  const session = useSession();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [devices, setDevices] = useState<POSDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await retailService.listDevices(session.tenantId, session);
        setDevices(data);
      } catch (error) {
        console.error("Failed to fetch devices", error);
        toast({
          title: "Error",
          description: "Failed to load device data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [session.tenantId, session, toast]);

  const handlePing = async (deviceId: string, deviceName: string) => {
    try {
      retailService.pingDevice(session.tenantId, session, deviceId);
      toast({
        title: "Ping Sent",
        description: `Heartbeat broadcast to ${deviceName}.`,
      });
    } catch {
      toast({
        title: "Ping Failed",
        description: "Device did not respond.",
        variant: "destructive",
      });
    }
  };

  const handlePingAll = async () => {
    setIsRefreshing(true);
    for (const device of devices) {
      retailService.pingDevice(session.tenantId, session, device.id);
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsRefreshing(false);
    toast({
      title: "Broadcast Complete",
      description: `Heartbeat sent to ${devices.length} nodes.`,
    });
  };

  const activeCount = devices.filter((d) => d.isActive).length;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white shrink-0 flex items-center justify-between">
        <PageHeader
          title="Device Control Center"
          subtitle={`${activeCount} / ${devices.length} Nodes Active • IoT Fleet Telemetry • Remote MDM`}
        />
        <Button
          onClick={handlePingAll}
          disabled={isRefreshing}
          className="h-11 rounded-xl px-6 bg-slate-900 text-white font-black italic uppercase text-xs tracking-widest gap-2 shadow-xl"
        >
          {isRefreshing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Wifi className="w-4 h-4" />
          )}
          Broadcast Heartbeat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Fleet status banner */}
          <Card className="rounded-[2.5rem] bg-slate-900 border-none shadow-2xl text-white overflow-hidden relative group">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.06) 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />
            <CardContent className="relative z-10 p-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Focus className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 italic">
                      Hardware Fleet Map
                    </div>
                    <div className="text-2xl font-black italic tracking-tighter">
                      BRANCH_ORCHESTRATOR_L1
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      label: "Active Nodes",
                      val: `${activeCount} / ${devices.length}`,
                      good: true,
                    },
                    { label: "MDM Health", val: "OPTIMAL", good: true },
                    { label: "Scan Events", val: "2.4K", good: true },
                    {
                      label: "Alerts",
                      val: isLoading ? "..." : devices.length === 0 ? "0" : "1",
                      good: false,
                    },
                  ].map((stat, i) => (
                    <div key={i}>
                      <div className="text-[10px] font-black text-slate-500 uppercase italic">
                        {stat.label}
                      </div>
                      <div
                        className={`text-xl font-black italic mt-1 ${stat.good ? "text-emerald-400" : "text-amber-400"}`}
                      >
                        {stat.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Mini bar chart */}
              <div className="w-full md:w-60 bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-[10px] font-black uppercase text-indigo-400 italic">
                    Traffic Pulse
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black italic text-[8px]">
                    STABLE
                  </Badge>
                </div>
                <div className="h-16 flex items-end gap-1.5">
                  {[40, 70, 45, 90, 65, 30, 80, 55, 75, 50].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-indigo-500/40 rounded-t-sm"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="text-[9px] text-slate-500 text-center font-bold tracking-widest italic uppercase">
                  Encrypted Uplink Active
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <div className="col-span-full py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
                  <span className="text-[10px] font-black italic uppercase tracking-widest text-slate-400">
                    Scanning Hardware Bus...
                  </span>
                </div>
              </div>
            ) : (
              <>
                {devices.map((device, i) => (
                  <Card
                    key={i}
                    className="group relative overflow-hidden rounded-[2.5rem] border-2 border-slate-100 hover:border-blue-200 shadow-xl transition-all bg-white"
                  >
                    <div
                      className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full ${device.isActive ? "bg-emerald-400" : "bg-slate-300"} opacity-0 group-hover:opacity-10 transition-opacity`}
                    />
                    <CardHeader className="p-7 pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${device.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                        >
                          {device.type === "pos_terminal" ? (
                            <MonitorDot className="w-7 h-7" />
                          ) : device.type === "kiosk" ? (
                            <Smartphone className="w-7 h-7" />
                          ) : (
                            <Laptop className="w-7 h-7" />
                          )}
                        </div>
                        <Badge
                          className={`${device.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"} border-none font-black italic text-[9px] tracking-widest px-3 uppercase`}
                        >
                          {device.isActive ? "ONLINE" : "OFFLINE"}
                        </Badge>
                      </div>
                      <CardTitle>
                        <div className="text-base font-black italic tracking-tighter text-slate-900">
                          {device.name}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 font-mono">
                          ID: {device.id}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-7 pt-2 space-y-5">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 italic">
                          <span>Connectivity</span>
                          <span
                            className={
                              device.isActive
                                ? "text-emerald-500"
                                : "text-slate-400"
                            }
                          >
                            {device.isActive ? "100%" : "0%"}
                          </span>
                        </div>
                        <Progress
                          value={device.isActive ? 100 : 0}
                          className="h-1.5 bg-slate-100"
                        />
                      </div>
                      <Separator className="bg-slate-50" />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[9px] font-black text-slate-400 italic uppercase">
                            Security
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span className="text-[9px] font-black italic uppercase text-slate-700">
                              SECURE
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-black text-slate-400 italic uppercase">
                            Usage
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span className="text-[9px] font-black italic uppercase text-slate-700">
                              14H
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="ghost"
                          onClick={() => handlePing(device.id, device.name)}
                          className="flex-1 h-11 rounded-xl bg-slate-50 text-slate-500 font-black italic uppercase text-[9px] tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                        >
                          PING
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 w-11 rounded-xl flex items-center justify-center border-slate-100 text-slate-400 hover:text-blue-600"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Commission new device card */}
                <Card className="border-4 border-dashed border-slate-200 bg-slate-50/50 rounded-[2.5rem] flex flex-col items-center justify-center py-12 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-white transition-all cursor-pointer group">
                  <Plus className="w-12 h-12 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all mb-4" />
                  <div className="text-sm font-black italic tracking-tighter uppercase">
                    Commission Device
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-widest mt-1 italic">
                    Scan QR / Manual ID
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* Security Log & MDM */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 shadow-xl border-none rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Hardware Security Log
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 font-black italic text-[9px] uppercase tracking-widest h-8 rounded-lg"
                >
                  Clear Log
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-60 overflow-y-auto p-6 space-y-3 font-mono text-[10px]">
                  {[
                    {
                      time: "14:22:15",
                      event: "MDM_CHECK_IN",
                      device: "pos-001",
                      status: "SUCCESS",
                    },
                    {
                      time: "14:05:40",
                      event: "MDM_POLICY_UPDATE",
                      device: "pos-001",
                      status: "ENFORCED",
                    },
                    {
                      time: "13:58:20",
                      event: "GEO_FENCE_ALERT",
                      device: "kiosk-001",
                      status: "CRITICAL",
                    },
                    {
                      time: "13:30:12",
                      event: "MDM_LOCKED",
                      device: "kiosk-001",
                      status: "REMOTE",
                    },
                  ].map((log, i) => (
                    <div
                      key={i}
                      className="flex gap-6 border-b border-slate-50 pb-3 last:border-none items-center"
                    >
                      <span className="text-slate-400 italic w-16 shrink-0">
                        {log.time}
                      </span>
                      <span
                        className={`font-black ${log.status === "SUCCESS" ? "text-emerald-500" : log.status === "CRITICAL" ? "text-red-500" : "text-blue-500"}`}
                      >
                        {log.event}
                      </span>
                      <span className="text-slate-700 font-bold uppercase ml-auto">
                        {log.device}
                      </span>
                      <span className="text-slate-400">[{log.status}]</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-[2.5rem] shadow-2xl overflow-hidden group border-none">
              <CardContent className="p-10 space-y-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="text-2xl font-black italic tracking-tighter">
                  Security Protocol L3
                </div>
                <p className="text-[10px] opacity-70 leading-relaxed font-bold italic uppercase tracking-widest">
                  Enforce MDM Lockdown? This disables all unauthorized
                  peripheral ports across the fleet.
                </p>
                <Button className="w-full h-14 bg-white text-blue-600 hover:bg-slate-50 font-black italic uppercase text-xs tracking-widest rounded-2xl shadow-xl">
                  ACTIVATE SECTOR LOCK
                </Button>
                <div className="text-[9px] text-center opacity-40 font-bold italic">
                  Fleet Auth Sign: ACTIVE
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceControlCenter;
