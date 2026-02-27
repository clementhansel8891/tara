import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import {
  Clock,
  Calendar,
  Lock,
  Unlock,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Timer,
  Users,
  UserPlus,
  RefreshCw,
  Power,
  Activity,
  Award,
  BarChart3,
  Search,
  MessageSquare,
  Flame,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { retailService } from "@/core/services/retail/retailService";
import { useSession } from "@/core/security/session";
import { useRetail } from "../context/RetailContext";
import type { RetailShift } from "@/core/types/retail/retail";
import { cn } from "@/lib/utils";

const ShiftControl = () => {
  const session = useSession();
  const { activeStore } = useRetail();
  const [shifts, setShifts] = useState<RetailShift[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await retailService.listShifts(
          session.tenantId!,
          session,
          session.locationId,
        );
        setShifts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch shifts", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [session.tenantId, session.locationId, session]);

  const stats = useMemo(() => {
    const active = shifts.filter((s) => s.status === "open").length;
    const efficiency = 84.5; // Mocked
    const attendance = 100; // Mocked
    return { active, efficiency, attendance };
  }, [shifts]);

  const handleToggleStore = async () => {
    const activeShift = shifts.find((s) => s.status === "open");
    setIsSyncing(true);
    try {
      if (activeShift) {
        await retailService.closeShift(
          session.tenantId!,
          session,
          activeShift.id,
          0,
        );
        toast({
          title: "Terminal Lock Engaged",
          description: "All active sessions synchronized and terminated.",
        });
      } else {
        await retailService.openShift(
          session.tenantId!,
          session,
          session.locationId!,
          1000,
        );
        toast({
          title: "Grid Initialized",
          description: "Node endpoints are now accepting operational traffic.",
        });
      }
      // Refresh
      const data = await retailService.listShifts(
        session.tenantId!,
        session,
        session.locationId,
      );
      setShifts(data);
    } catch (error) {
      toast({
        title: "Protocol Refused",
        description: "System handshake failed.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-8 h-8 text-emerald-600 animate-pulse" />
          <p className="text-sm font-black italic uppercase tracking-widest text-slate-400">
            Synchronizing Biometrics...
          </p>
        </div>
      </div>
    );
  }

  const activeShift = shifts.find((s) => s.status === "open");

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      <div className="px-8 py-6 border-b bg-white shrink-0 flex items-center justify-between">
        <PageHeader
          title="Workforce Intelligence Hub"
          subtitle={`Node: ${session.locationId || "CENTRAL"} • Labor Efficiency: ${stats.efficiency}% • Risk: LOW`}
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl px-4 font-black italic border-slate-200 text-xs uppercase tracking-widest gap-2"
          >
            <Calendar className="w-3.5 h-3.5" /> Roster Policy
          </Button>
          <Button
            variant={activeShift ? "destructive" : "default"}
            onClick={handleToggleStore}
            disabled={isSyncing}
            className={cn(
              "h-11 px-6 rounded-xl font-black italic uppercase text-xs tracking-widest gap-2 shadow-lg transition-all",
              !activeShift &&
                "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/10",
            )}
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : activeShift ? (
              <Power className="w-4 h-4" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {activeShift ? "Terminate Session" : "Deploy Workforce"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-slate-50/50">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Workforce Vitals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-[2rem] p-6 bg-white border-slate-200 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                  <Users className="w-5 h-5" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 font-black italic text-[8px] uppercase tracking-widest border-none">
                  LIVE
                </Badge>
              </div>
              <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 mb-1">
                Personnel on Grid
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-slate-900">
                {stats.active} Members
              </div>
              <div className="text-[10px] font-bold italic text-slate-400 mt-2 uppercase flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-500" /> Optimal
                Coverage
              </div>
            </Card>

            <Card className="rounded-[2rem] p-6 bg-white border-slate-200 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <Badge className="bg-blue-50 text-blue-700 font-black italic text-[8px] uppercase tracking-widest border-none">
                  TARGET: 85%
                </Badge>
              </div>
              <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 mb-1">
                Labor Efficiency
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-slate-900">
                {stats.efficiency}%
              </div>
              <div className="text-[10px] font-bold italic text-slate-400 mt-2 uppercase flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" /> Near Peak Capacity
              </div>
            </Card>

            <Card className="rounded-[2rem] p-6 bg-white border-slate-200 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <Badge className="bg-amber-50 text-amber-700 font-black italic text-[8px] uppercase tracking-widest border-none">
                  ELITE
                </Badge>
              </div>
              <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 mb-1">
                Service Velocity
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-slate-900">
                1.8m
              </div>
              <div className="text-[10px] font-bold italic text-slate-400 mt-2 uppercase">
                Avg. Interaction Time
              </div>
            </Card>

            <Card className="rounded-[2rem] p-6 bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
              <ShieldAlert className="absolute -right-8 -bottom-8 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <div className="text-[10px] font-black italic uppercase tracking-widest text-amber-400 mb-4">
                  Compliance Guard
                </div>
                <div className="text-4xl font-black italic tracking-tighter text-emerald-400">
                  SECURE
                </div>
                <div className="text-[10px] font-bold italic opacity-60 mt-4 uppercase">
                  No Overtime Violations
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="rounded-[2.5rem] bg-white shadow-2xl border-none overflow-hidden">
                <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black italic uppercase tracking-widest text-slate-500">
                      Live Infrastructure Map
                    </h3>
                    <Badge className="bg-emerald-600 font-black italic text-[8px] uppercase">
                      Biometric Sync
                    </Badge>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      className="pl-12 h-10 bg-white border-slate-200 rounded-xl text-xs font-bold italic"
                      placeholder="Search Roster..."
                    />
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {shifts.map((s, i) => (
                    <div
                      key={i}
                      className="group p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm font-black italic">
                            {s.employeeId.charAt(0).toUpperCase()}
                          </div>
                          <div
                            className={cn(
                              "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center",
                              s.status === "open"
                                ? "bg-emerald-500"
                                : "bg-slate-300",
                            )}
                          />
                        </div>
                        <div>
                          <div className="text-base font-black italic tracking-tight text-slate-900">
                            {s.employeeId}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3 mt-1">
                            {s.storeId} • Terminal B-1 • Level 2
                            <Badge
                              className={cn(
                                "text-[8px] font-black italic border-none h-4 px-1 ml-2",
                                s.status === "open"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-50 text-slate-500",
                              )}
                            >
                              {s.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 text-right">
                        <div>
                          <div className="text-xs font-black italic text-slate-900 mb-1">
                            Attendance Integrity
                          </div>
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: "98%" }}
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-slate-400 hover:text-slate-900 rounded-xl"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {shifts.length === 0 && (
                    <div className="p-20 text-center">
                      <div className="text-xs font-black italic uppercase tracking-widest text-slate-400">
                        Node Inactive • Awaiting Workforce Deployment
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-8">
              {/* Emergency Override */}
              <Card className="rounded-[2.5rem] bg-red-900 text-white p-8 shadow-2xl relative overflow-hidden group">
                <ShieldAlert className="absolute -right-8 -top-8 w-40 h-40 opacity-10 group-hover:rotate-12 transition-transform" />
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-red-700 font-black italic text-[9px] uppercase tracking-widest border-none px-3">
                      Restriction Gate
                    </Badge>
                    <Lock className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black italic tracking-tighter uppercase leading-tight">
                      Terminal Shutdown
                    </h4>
                    <p className="text-[10px] opacity-70 leading-relaxed font-bold italic">
                      Instantly terminate all active point-of-sale sessions and
                      lock hardware peripherals.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full bg-red-600 hover:bg-red-700 font-black italic h-12 rounded-xl text-xs uppercase shadow-xl transition-all"
                  >
                    Emergency Lockout
                  </Button>
                </div>
              </Card>

              {/* Performance Feed */}
              <Card className="rounded-[2.5rem] bg-white border-slate-200 shadow-xl p-8 space-y-8">
                <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400">
                  Operational Pulse
                </div>
                <div className="space-y-6">
                  {[
                    { label: "Check-in Accuracy", value: 100, trend: "UP" },
                    { label: "Roster Adherence", value: 92, trend: "STABLE" },
                    {
                      label: "Service Score",
                      value: 4.8,
                      trend: "UP",
                      suffix: "/5",
                    },
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end italic">
                        <span className="text-[10px] font-black text-slate-500 uppercase">
                          {item.label}
                        </span>
                        <span className="text-sm font-black text-slate-900">
                          {item.value}
                          {item.suffix || "%"}
                        </span>
                      </div>
                      <Progress
                        value={item.value > 5 ? item.value * 20 : item.value}
                        className="h-1 bg-slate-100"
                      />
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-4 group cursor-pointer hover:bg-indigo-100 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-indigo-900 uppercase italic">
                      Broadcast to Team
                    </div>
                    <div className="text-[10px] text-indigo-400 font-bold uppercase italic tracking-tighter">
                      Sync motivation rituals...
                    </div>
                  </div>
                </div>
              </Card>

              {/* Shift Suggestion */}
              <Card className="rounded-[2.5rem] bg-indigo-600 text-white p-8 group cursor-pointer hover:bg-indigo-700 transition-all overflow-hidden relative">
                <UserCheck className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                <div className="relative space-y-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto shadow-xl backdrop-blur-sm">
                    <Timer className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-black italic tracking-tighter uppercase">
                    Optimal Roster
                  </h4>
                  <p className="text-xs font-medium opacity-70 leading-relaxed italic px-4">
                    Traffic peak detected at 17:00. Suggested: Add 2 cashiers to
                    Front End.
                  </p>
                  <Button className="w-full bg-white text-indigo-900 hover:bg-white/90 h-12 font-black italic uppercase tracking-widest rounded-xl text-[10px]">
                    Adjust Tomorrow's Grid
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftControl;
