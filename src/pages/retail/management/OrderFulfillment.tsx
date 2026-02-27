import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import {
  PackageCheck,
  Truck,
  RotateCcw,
  Search,
  Filter,
  ShoppingBag,
  Globe,
  Smartphone,
  AlertCircle,
  Clock,
  MapPin,
  CheckCircle2,
  Box,
  ChevronRight,
  Printer,
  MoreVertical,
  Layers,
  Zap,
  Tag,
  ArrowRight,
  ShieldAlert,
  History,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { retailService } from "@/core/services/retail/retailService";
import { useSession } from "@/core/security/session";
import { useToast } from "@/hooks/use-toast";
import type { RetailOrder, OrderStatus } from "@/core/types/retail/retail";
import { OrderDetailModal } from "./modals/OrderDetailModal";
import { cn } from "@/lib/utils";

const OrderFulfillment = () => {
  const session = useSession();
  const { toast } = useToast();
  const [orders, setOrders] = useState<RetailOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<RetailOrder | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [activeQueue, setActiveQueue] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await retailService.listOrders(session.tenantId!, session);
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [session.tenantId, session]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "paid").length;
    const priority = orders.filter((o) => o.totalAmount > 1000000).length;
    return { pending, priority };
  }, [orders]);

  const handleOrderClick = (order: RetailOrder) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    toast({
      title: "Signal Dispatched",
      description: `Order ${orderId} shifted to ${newStatus}.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RotateCcw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-black italic uppercase tracking-widest text-slate-400">
            Syncing Pipeline Data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      <div className="px-8 py-6 border-b bg-white shrink-0 flex items-center justify-between">
        <PageHeader
          title="Fulfillment Racetrack"
          subtitle={`Node: ${session.locationId || "CENTRAL_HUB"} • Velocity: 94.2% • SLA Gaps: MINIMAL`}
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl px-4 font-black italic border-slate-200 text-xs uppercase tracking-widest gap-2"
          >
            <History className="w-3.5 h-3.5" /> Manifest Archive
          </Button>
          <Button className="h-11 px-6 rounded-xl bg-slate-900 font-black italic uppercase text-xs tracking-widest gap-2 shadow-lg shadow-slate-900/10">
            <Zap className="w-4 h-4 text-amber-400" /> Start Batch Pick
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-slate-50/50">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Logistics Pulse Vitals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-[2rem] p-6 bg-white border-slate-200 shadow-xl border-b-4 border-b-slate-100 hover:border-b-blue-600 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <Badge className="bg-blue-50 text-blue-700 font-black italic text-[8px] uppercase tracking-widest border-none">
                  Active
                </Badge>
              </div>
              <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 mb-1">
                Queue Depth
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-slate-900">
                {stats.pending} Orders
              </div>
              <div className="text-[10px] font-bold italic text-slate-400 mt-2 uppercase flex items-center gap-1 text-emerald-600">
                <Clock className="w-3 h-3" /> TAT: 12m 45s (Target Met)
              </div>
            </Card>

            <Card className="rounded-[2rem] p-6 bg-white border-slate-200 shadow-xl border-b-4 border-b-slate-100 hover:border-b-amber-500 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
                  <Truck className="w-5 h-5" />
                </div>
                <Badge className="bg-amber-50 text-amber-700 font-black italic text-[8px] uppercase tracking-widest border-none">
                  Awaiting
                </Badge>
              </div>
              <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 mb-1">
                Courier Slant
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-slate-900">
                12 Pickups
              </div>
              <div className="text-[10px] font-bold italic text-slate-400 mt-2 uppercase">
                Next: JNE Express (5m)
              </div>
            </Card>

            <Card className="rounded-[2rem] p-6 bg-white border-slate-200 shadow-xl border-b-4 border-b-slate-100 hover:border-b-indigo-600 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Zap className="w-5 h-5" />
                </div>
                <Badge
                  variant="destructive"
                  className="font-black italic text-[8px] uppercase tracking-widest"
                >
                  Priority
                </Badge>
              </div>
              <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 mb-1">
                High-Value Stream
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-slate-900">
                {stats.priority} Orders
              </div>
              <div className="text-[10px] font-bold italic text-slate-400 mt-2 uppercase">
                {">"} Rp 1.0M Allocation
              </div>
            </Card>

            <Card className="rounded-[2rem] p-6 bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
              <ShieldAlert className="absolute -right-8 -bottom-8 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform" />
              <div className="relative z-10">
                <div className="text-[10px] font-black italic uppercase tracking-widest text-indigo-400 mb-4">
                  Pipeline Health
                </div>
                <div className="text-4xl font-black italic tracking-tighter text-emerald-400">
                  98.2%
                </div>
                <div className="text-[10px] font-bold italic opacity-60 mt-4 uppercase">
                  Fulfillment Accuracy Index
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
              <Tabs
                value={activeQueue}
                onValueChange={setActiveQueue}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <TabsList className="bg-transparent h-auto p-0 gap-8">
                    {["ALL", "PAID", "SHIPPING", "EXCEPTIONS"].map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="bg-transparent h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 font-black italic uppercase tracking-widest text-xs"
                      >
                        {tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <div className="relative w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      className="pl-12 h-11 bg-white border-slate-200 rounded-xl text-xs font-bold italic placeholder:text-slate-300"
                      placeholder="Search Order, Customer, or AWB..."
                    />
                  </div>
                </div>

                <TabsContent value={activeQueue} className="m-0">
                  <Card className="rounded-[2.5rem] shadow-2xl border-none bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400 italic">
                            <th className="px-8 py-5 text-left">Order Token</th>
                            <th className="px-8 py-5 text-left">
                              Channel Context
                            </th>
                            <th className="px-8 py-5 text-center">
                              Payload Cost
                            </th>
                            <th className="px-8 py-5 text-center">
                              Orchestration
                            </th>
                            <th className="px-8 py-5 text-right">Gate Entry</th>
                            <th className="px-8 py-5 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 italic">
                          {orders.map((order) => (
                            <tr
                              key={order.id}
                              className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                              onClick={() => handleOrderClick(order)}
                            >
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div
                                    className={cn(
                                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-xs shadow-inner",
                                      order.totalAmount > 1000000
                                        ? "bg-amber-50 text-amber-600"
                                        : "bg-slate-50 text-slate-400",
                                    )}
                                  >
                                    #{order.id.split("-").pop()}
                                  </div>
                                  <div>
                                    <div className="text-sm font-black tracking-tight text-slate-900">
                                      {order.id}
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-400 border-none text-[8px] font-black uppercase tracking-widest px-1 h-4">
                                      REGULAR
                                    </Badge>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                    {order.paymentMethod === "cash" ? (
                                      <ShoppingBag className="w-4 h-4" />
                                    ) : (
                                      <Globe className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-xs font-black text-slate-700 italic leading-tight uppercase">
                                      {order.paymentMethod || "UNSET"}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                      Loc: {order.storeId}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <div className="text-base font-black italic tracking-tighter text-slate-900">
                                  Rp {order.totalAmount.toLocaleString()}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">
                                  {order.items?.length || 0} Components
                                </div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <Badge
                                  className={cn(
                                    "text-[9px] font-black italic border-none h-6 px-3",
                                    order.status === "paid"
                                      ? "bg-blue-50 text-blue-700"
                                      : order.status === "fulfilled"
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "bg-emerald-50 text-emerald-700",
                                  )}
                                >
                                  {order.status.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <div className="text-[10px] font-black italic text-slate-600 uppercase mb-1">
                                  Ingested
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">
                                  {new Date(
                                    order.createdAt,
                                  ).toLocaleTimeString()}
                                </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 text-slate-400 hover:text-slate-900 rounded-xl"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-8">
              {/* Exception Board */}
              <Card className="rounded-[2.5rem] bg-red-900 text-white p-8 shadow-2xl relative overflow-hidden group">
                <AlertCircle className="absolute -right-8 -top-8 w-40 h-40 opacity-10 group-hover:rotate-12 transition-transform" />
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-red-700 font-black italic text-[9px] uppercase tracking-widest border-none px-3">
                      Exceptions
                    </Badge>
                    <span className="text-2xl font-black italic">3 GAPS</span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 italic">
                      <div className="text-[10px] font-black text-red-400 uppercase mb-1 flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Address Gap
                      </div>
                      <p className="text-[10px] opacity-70 leading-relaxed font-bold">
                        ORD-2291 invalid coordinate for GrabExpress delivery.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 italic opacity-50">
                      <div className="text-[10px] font-black text-amber-400 uppercase mb-1 flex items-center gap-2">
                        <Box className="w-3 h-3" /> Stock Buffer
                      </div>
                      <p className="text-[10px] opacity-70 leading-relaxed font-bold">
                        ORD-2292 awaiting unit release from central reserve.
                      </p>
                    </div>
                  </div>
                  <Button className="w-full bg-white text-red-900 hover:bg-white/90 font-black italic h-12 rounded-xl text-xs uppercase shadow-xl transition-all">
                    Resolve Inbound Gaps
                  </Button>
                </div>
              </Card>

              {/* Logistics Radar */}
              <Card className="rounded-[2.5rem] bg-white border-slate-200 shadow-xl p-8 space-y-8">
                <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400">
                  Logistics Radar
                </div>
                <div className="space-y-6">
                  {[
                    { courier: "JNE Regular", load: 65, status: "Normal" },
                    { courier: "GrabExpress", load: 88, status: "High Load" },
                    { courier: "SiCepat", load: 42, status: "Normal" },
                  ].map((c, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center italic">
                        <span className="text-xs font-black text-slate-700">
                          {c.courier}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-black",
                            c.load > 80 ? "text-amber-600" : "text-emerald-600",
                          )}
                        >
                          {c.status}
                        </span>
                      </div>
                      <Progress value={c.load} className="h-1.5 bg-slate-50" />
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-indigo-900 uppercase italic">
                      Label Station B-2
                    </div>
                    <div className="text-[10px] text-indigo-400 font-bold uppercase italic tracking-tighter">
                      Ready • 14 queued
                    </div>
                  </div>
                </div>
              </Card>

              {/* Batch Picking Strategy */}
              <Card className="rounded-[2.5rem] bg-indigo-600 text-white p-8 group cursor-pointer hover:bg-indigo-700 transition-all overflow-hidden relative">
                <ClipboardList className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                <div className="relative space-y-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto shadow-xl backdrop-blur-sm">
                    <Layers className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-black italic tracking-tighter uppercase">
                    Intelligent Batching
                  </h4>
                  <p className="text-xs font-medium opacity-70 leading-relaxed italic px-4">
                    Aggregate 12 items across 5 orders into a single walking
                    path. Optimization: +18% Velocity.
                  </p>
                  <Button className="w-full bg-white text-indigo-900 hover:bg-white/90 h-12 font-black italic uppercase tracking-widest rounded-xl text-[10px]">
                    Execute Batch Path
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <OrderDetailModal
        order={selectedOrder}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default OrderFulfillment;
