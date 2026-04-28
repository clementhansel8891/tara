import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Zap } from "lucide-react";
import type { RetailOrder, RetailStore, RetailChannel } from "@/core/types/retail/retail";

interface FleetRevenueMatrixProps {
  orders: RetailOrder[];
  stores: RetailStore[];
  channels: RetailChannel[];
}

export const FleetRevenueMatrix: React.FC<FleetRevenueMatrixProps> = ({
  orders,
  stores,
  channels,
}) => {
  // Aggregate sales by node (store or channel)
  const nodeSales = React.useMemo(() => {
    const salesMap: Record<string, { name: string; amount: number; type: 'store' | 'channel' }> = {};
    
    // Initialize with all stores
    stores.forEach(s => {
      salesMap[s.id] = { name: s.name, amount: 0, type: 'store' };
    });
    
    // Initialize with all channels
    channels.forEach(c => {
      salesMap[c.id] = { name: c.name, amount: 0, type: 'channel' };
    });

    // Aggregate orders
    orders.forEach(o => {
      const node_id = o.storeId || o.channelId;
      if (node_id && salesMap[node_id]) {
        salesMap[node_id].amount += o.totalAmount;
      }
    });

    return Object.values(salesMap).sort((a, b) => b.amount - a.amount);
  }, [orders, stores, channels]);

  // Aggregate sales by time (last 7 days simulation based on order creation)
  const timeSeries = React.useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      days[date.toISOString().split('T')[0]] = 0;
    }

    orders.forEach(o => {
      const day = new Date(o.createdAt).toISOString().split('T')[0];
      if (days[day] !== undefined) {
        days[day] += o.totalAmount;
      }
    });

    return Object.entries(days).map(([name, value]) => ({
      name: new Date(name).toLocaleDateString('en-US', { weekday: 'short' }),
      value,
    }));
  }, [orders]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* REVENUE DISTRIBUTION */}
        <Card className="lg:col-span-2 border-none bg-slate-900 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                  Multi-Node Performance
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Revenue aggregation per operational entity
                </p>
              </div>
              <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black italic uppercase text-indigo-400 tracking-widest">
                  LIVE TELEMETRY
                </span>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nodeSales} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid horizontal={false} vertical={true} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900, fontStyle: 'italic' }}
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-950 border border-white/10 p-4 rounded-2xl shadow-3xl">
                            <p className="text-[10px] font-black italic text-slate-500 uppercase mb-1">{payload[0].payload.name}</p>
                            <p className="text-xl font-black italic text-white tracking-tighter">Rp {payload[0].value?.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]} barSize={24}>
                    {nodeSales.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.type === 'store' ? '#4f46e5' : '#10b981'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* GROWTH TERMINAL */}
        <div className="space-y-8">
          <Card className="border-none bg-white shadow-2xl rounded-[2.5rem] p-8 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black italic uppercase tracking-[0.2em] text-slate-400">Avg Transaction Value</p>
                <h4 className="text-3xl font-black italic tracking-tighter text-slate-900 mt-1">
                  Rp {Math.round(avgOrderValue).toLocaleString()}
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-black italic uppercase tracking-widest">+12.4% vs prev shift</span>
            </div>
          </Card>

          <Card className="border-none bg-indigo-600 shadow-2xl rounded-[2.5rem] p-8 text-white">
            <h4 className="text-[10px] font-black italic uppercase tracking-[0.2em] opacity-60 mb-6">Velocity Stream (Last 7 Days)</h4>
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-2xl">
                             <p className="text-sm font-black italic text-slate-900">Rp {payload[0].value?.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#fff" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
