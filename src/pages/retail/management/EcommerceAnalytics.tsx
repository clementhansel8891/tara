import { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
} from "lucide-react";
import { useSession } from "@/core/security/session";
import { retailService } from "@/core/services/retail/retailService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EcommerceAnalytics() {
  const session = useSession();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState("all");

  useEffect(() => {
    fetchAnalytics();
  }, [selectedChannel]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await retailService.getEcommerceAnalytics(
        session.tenant_id,
        session,
        selectedChannel === "all" ? undefined : selectedChannel
      );
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analytics) return (
    <div className="p-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
      Calculating Fleet Metrics...
    </div>
  );

  return (
    <div className="space-y-12">
      {/* Analytics Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <Globe className="w-8 h-8 text-indigo-600" />
            Ecommerce Intelligence
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-11">
            Real-time telemetry from all connected digital storefronts
          </p>
        </div>
        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
          <SelectTrigger className="w-[250px] h-12 rounded-xl bg-white border-slate-200 font-bold uppercase italic text-[10px] tracking-widest">
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-200">
            <SelectItem value="all">Global Fleet View</SelectItem>
            <SelectItem value="headless">Headless API</SelectItem>
            <SelectItem value="shopify">Shopify Integration</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatsCard
          title="Revenue (Gross)"
          value={`$${(analytics?.revenue || 0).toLocaleString()}`}
          trend="+12.5%"
          isPositive={true}
          icon={DollarSign}
          color="blue"
        />
        <StatsCard
          title="Order Velocity"
          value={analytics?.orderCount || 0}
          trend="+8.2%"
          isPositive={true}
          icon={ShoppingCart}
          color="indigo"
        />
        <StatsCard
          title="Active Sessions"
          value="1,284"
          trend="-2.4%"
          isPositive={false}
          icon={Users}
          color="amber"
        />
        <StatsCard
          title="Conversion Rate"
          value="3.82%"
          trend="+0.5%"
          isPositive={true}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Secondary Intelligence Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Top Products */}
        <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
          <CardHeader className="p-10 border-b bg-slate-50/50">
            <CardTitle className="text-xl font-black italic uppercase tracking-tighter">
              High-Velocity Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {(analytics?.topProducts || []).map((product: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-8 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{product.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU: PROD-{idx+100}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black italic text-slate-900">{product.count} Units</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Demand High</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Channel Health */}
        <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden">
          <CardHeader className="p-10 border-b border-white/10">
            <CardTitle className="text-xl font-black italic uppercase tracking-tighter">
              Channel Latency
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <HealthItem label="Headless API" status="Optimal" value="24ms" />
            <HealthItem label="Shopify Webhook" status="Nominal" value="142ms" />
            <HealthItem label="Sync Engine" status="Optimal" value="0.8s" />
            
            <div className="pt-8 mt-8 border-t border-white/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Integrity Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase italic tracking-wider">All Systems Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, trend, isPositive, icon: Icon, color }: any) {
  const colorMap: any = {
    blue: "bg-blue-600 text-blue-600",
    indigo: "bg-indigo-600 text-indigo-600",
    amber: "bg-amber-600 text-amber-600",
    emerald: "bg-emerald-600 text-emerald-600",
  };

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 space-y-6 hover:translate-y-[-4px] transition-transform duration-500">
      <div className="flex items-center justify-between">
        <div className={`p-4 rounded-[1.25rem] bg-slate-50 ${colorMap[color].split(' ')[1].replace('text', 'text-opacity-20 text')}`}>
          <Icon className="w-6 h-6" />
        </div>
        <Badge className={`${isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'} border-none rounded-lg px-2 py-1 flex gap-1 items-center font-bold text-[10px]`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">{value}</h3>
      </div>
    </Card>
  );
}

function HealthItem({ label, status, value }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-black italic uppercase tracking-tighter">{status}</p>
      </div>
      <p className="text-xs font-bold text-blue-400">{value}</p>
    </div>
  );
}
