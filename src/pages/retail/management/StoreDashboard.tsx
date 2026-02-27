import React, { useMemo, useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertCircle,
  ShoppingBag,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  Smartphone,
  Plus,
  Store,
  Zap,
  Power,
  ChevronRight,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { retailService } from "@/core/services/retail/retailService";
import { useSession } from "@/core/security/session";
import type {
  RetailOrder,
  POSDevice,
  RetailShift,
} from "@/core/types/retail/retail";
import { useToast } from "@/hooks/use-toast";
import { RegisterStoreDialog } from "./modals/RegisterStoreDialog";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const SALES_DATA = [
  { time: "08:00", sales: 1200, orders: 15 },
  { time: "10:00", sales: 2400, orders: 28 },
  { time: "12:00", sales: 5200, orders: 52 },
  { time: "14:00", sales: 4800, orders: 45 },
  { time: "16:00", sales: 6100, orders: 60 },
  { time: "18:00", sales: 8400, orders: 85 },
  { time: "20:00", sales: 4200, orders: 40 },
];

const StoreDashboard = () => {
  const session = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<RetailOrder[]>([]);
  const [devices, setDevices] = useState<POSDevice[]>([]);
  const [shifts, setShifts] = useState<RetailShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [orderData, deviceData, shiftData] = await Promise.all([
        retailService.listOrders(session.tenantId!, session),
        retailService.listDevices(session.tenantId!, session),
        retailService.listShifts(
          session.tenantId!,
          session,
          session.locationId,
        ),
      ]);
      setOrders(orderData);
      setDevices(deviceData);
      setShifts(shiftData);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeShift = useMemo(
    () => shifts.find((s) => s.status === "open"),
    [shifts],
  );

  const stats = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const orderCount = orders.length;
    const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;
    const activeDevices = devices.filter((d) => d.isActive).length;

    return {
      totalSales,
      orderCount,
      avgTicket,
      activeDevices,
    };
  }, [orders, devices]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-black italic uppercase tracking-widest text-slate-400">
            Syncing Command Rituals...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      <div className="px-8 py-6 border-b bg-white shrink-0 flex items-center justify-between">
        <PageHeader
          title="Operational Command"
          subtitle={`Node Context: ${session.locationId || "GLOBAL_ROOT"} • Vitals: RESTORED`}
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl px-4 font-black italic border-slate-200 text-xs uppercase tracking-widest gap-2"
            onClick={() => fetchData()}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Force Sync
          </Button>
          <RegisterStoreDialog
            onSuccess={(store) => {
              toast({
                title: "Node Registered",
                description: `${store.name} initialized.`,
              });
              fetchData();
            }}
            trigger={
              <Button className="h-11 px-6 rounded-xl bg-slate-900 font-black italic uppercase text-xs tracking-widest gap-2">
                <Plus className="w-4 h-4" /> Initialize Node
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Top Tier: Shift Awareness & Quick Action */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card
              className={cn(
                "lg:col-span-2 rounded-[2.5rem] border-4 transition-all shadow-2xl relative overflow-hidden group min-h-[220px] flex items-center p-12",
                activeShift
                  ? "bg-slate-900 border-blue-600/20 text-white"
                  : "bg-white border-red-500/20 text-slate-900",
              )}
            >
              {activeShift && (
                <Activity className="absolute -right-12 -top-12 w-64 h-64 opacity-5 text-blue-400 group-hover:rotate-12 transition-transform duration-1000" />
              )}
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 w-full">
                <div
                  className={cn(
                    "w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 border-2",
                    activeShift
                      ? "bg-blue-600 border-blue-400/50 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
                      : "bg-red-50 border-red-200 text-red-500",
                  )}
                >
                  {activeShift ? (
                    <Zap className="w-10 h-10 text-white animate-pulse" />
                  ) : (
                    <Power className="w-10 h-10" />
                  )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase">
                      {activeShift ? "Node Session Live" : "Terminals Locked"}
                    </h2>
                    {activeShift && (
                      <Badge className="bg-emerald-500 font-black italic animate-pulse">
                        ACTIVE
                      </Badge>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest italic opacity-60",
                      activeShift ? "text-blue-200" : "text-slate-400",
                    )}
                  >
                    {activeShift
                      ? `SID: ${activeShift.id} • Operator: ${activeShift.employeeId}`
                      : "Branch requires manual initialization ritual."}
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/m/retail/management/shifts")}
                  className={cn(
                    "h-14 px-10 rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl",
                    activeShift
                      ? "bg-white text-slate-900 hover:bg-slate-100"
                      : "bg-red-600 text-white hover:bg-red-700",
                  )}
                >
                  {activeShift ? "Manage Session" : "Go to Shift Control"}
                </Button>
              </div>
            </Card>

            <Card className="rounded-[2.5rem] bg-indigo-600 text-white p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
              <TrendingUp className="absolute -left-12 -bottom-12 w-48 h-48 opacity-10 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">
                  Target Velocity
                </div>
                <div className="text-5xl font-black italic tracking-tighter">
                  84%
                </div>
                <Progress value={84} className="h-1.5 bg-white/10 mt-4" />
              </div>
              <div className="relative z-10 space-y-2">
                <div className="text-[10px] font-bold italic uppercase opacity-60">
                  Revenue Projection
                </div>
                <div className="flex justify-between items-center text-sm font-black italic">
                  <span>Next Hour</span>
                  <span className="text-emerald-400">+Rp 4.2M</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Gross Revenue",
                val: `Rp ${(stats.totalSales / 1000000).toFixed(1)}M`,
                sub: "Daily Accumulation",
                icon: DollarSign,
                color: "blue",
              },
              {
                label: "Volume Index",
                val: stats.orderCount,
                sub: `${(stats.avgTicket / 1000).toFixed(0)}k Avg Ticket`,
                icon: ShoppingBag,
                color: "indigo",
              },
              {
                label: "Human Assets",
                val: "12 Online",
                sub: "3 Active Terminals",
                icon: Users,
                color: "emerald",
              },
              {
                label: "Policy Guard",
                val: "PLATINUM",
                sub: "0 Violations Logged",
                icon: ShieldCheck,
                color: "amber",
              },
            ].map((m, i) => (
              <Card
                key={i}
                className="rounded-[2rem] p-6 bg-white border-slate-200 shadow-xl group hover:border-blue-200 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-8">
                  <div
                    className={cn(
                      "p-4 rounded-2xl",
                      `bg-${m.color}-50 text-${m.color}-600`,
                    )}
                  >
                    <m.icon className="w-5 h-5" />
                  </div>
                  <Badge className="bg-slate-50 text-slate-400 font-bold italic text-[8px] uppercase tracking-widest border-none">
                    Vitals
                  </Badge>
                </div>
                <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 mb-1">
                  {m.label}
                </div>
                <div className="text-3xl font-black italic tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors uppercase">
                  {m.val}
                </div>
                <div className="text-[10px] font-bold italic text-slate-400 mt-2 uppercase">
                  {m.sub}
                </div>
              </Card>
            ))}
          </div>

          {/* Main Visualizations & Action Desk */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 rounded-[3rem] shadow-2xl border-none overflow-hidden bg-white">
              <div className="p-8 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">
                    Intra-Day Performance
                  </h3>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Real-time revenue stream tracking
                  </div>
                </div>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-4 rounded-lg bg-white shadow-sm font-black italic text-[10px] uppercase"
                  >
                    Minute
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-4 rounded-lg font-black italic text-[10px] text-slate-400 uppercase"
                  >
                    Hour
                  </Button>
                </div>
              </div>
              <div className="p-10">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SALES_DATA}>
                      <defs>
                        <linearGradient
                          id="colorSales"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#2563eb"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#2563eb"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
                          fontWeight: 800,
                          fill: "#94a3b8",
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
                          fontWeight: 800,
                          fill: "#94a3b8",
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "none",
                          borderRadius: "16px",
                          color: "#fff",
                          padding: "12px",
                        }}
                        itemStyle={{
                          fontSize: "12px",
                          fontWeight: "900",
                          fontStyle: "italic",
                          textTransform: "uppercase",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#2563eb"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorSales)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            <div className="space-y-8">
              <Card className="rounded-[2.5rem] bg-white border-slate-200 shadow-xl overflow-hidden">
                <div className="p-8 pb-4 flex items-center justify-between border-b bg-slate-50/50">
                  <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">
                    Actionable Exceptions
                  </div>
                  <Badge
                    variant="destructive"
                    className="font-black italic text-[8px] tracking-widest cursor-pointer hover:bg-red-700"
                  >
                    3 URGENT
                  </Badge>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    {
                      type: "INV",
                      msg: "Inventory Critical: SKU-991",
                      link: "/m/retail/management/inventory",
                    },
                    {
                      type: "LOG",
                      msg: "3 Awaiting Fulfillment",
                      link: "/m/retail/management/fulfillment",
                    },
                    {
                      type: "HR",
                      msg: "Shift Overlap Detected",
                      link: "/m/retail/management/shifts",
                    },
                  ].map((err, i) => (
                    <div
                      key={i}
                      onClick={() => navigate(err.link)}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-[10px] font-black italic text-slate-600 uppercase tracking-tighter">
                          {err.msg}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-[2.5rem] bg-slate-900 border-none shadow-2xl overflow-hidden group">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 italic">
                    Terminal Network Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  <div className="grid grid-cols-4 gap-3">
                    {devices.length > 0 ? (
                      devices.map((d, i) => (
                        <div
                          key={i}
                          className={cn(
                            "aspect-square rounded-xl flex items-center justify-center transition-all",
                            d.isActive
                              ? "bg-blue-600/20 border border-blue-500/30 text-blue-400"
                              : "bg-red-500/10 border border-red-500/30 text-red-500",
                          )}
                        >
                          <Smartphone className="w-4 h-4" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-4 text-[10px] font-bold text-slate-600 italic uppercase py-4">
                        No Terminals Registered
                      </div>
                    )}
                    <div
                      onClick={() => navigate("/m/retail/management/devices")}
                      className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 cursor-pointer hover:bg-white/10 hover:text-white transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between items-center">
                    <div className="text-[10px] font-black italic text-slate-400 uppercase">
                      Status: <span className="text-blue-400">Stable</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-black italic text-white/40 hover:text-white p-0"
                      onClick={() => navigate("/m/retail/management/devices")}
                    >
                      Remote Hub <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDashboard;
