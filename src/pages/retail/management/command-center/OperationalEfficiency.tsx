import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { OperationalEfficiency as IOperationalEfficiency } from "@/core/types/retail/analytics";
import { Clock, Box, Zap, Activity } from "lucide-react";

interface OperationalEfficiencyProps {
  data: IOperationalEfficiency;
}

export const OperationalEfficiency: React.FC<OperationalEfficiencyProps> = ({
  data,
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
      {/* Backlog Trend Area */}
      <div className="xl:col-span-2 bg-white/[0.03] backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 shadow-2xl hover:bg-white/[0.05] hover:-translate-y-1 transition-all duration-700 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[130px] -mr-[15%] -mt-[15%] group-hover:bg-violet-500/20 transition-all duration-1000" />

        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-xl shadow-violet-600/20 group-hover:rotate-6 transition-transform duration-500">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
                Logistics Velocity Matrix
              </h3>
              <p className="text-4xl font-black italic text-white tracking-tighter">
                Fulfillment Backlog
              </p>
            </div>
          </div>
        </div>

        <div className="h-[340px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={
                data.fulfillmentBacklogTrend.length
                  ? data.fulfillmentBacklogTrend
                  : [
                      { time: "08:00", count: 12 },
                      { time: "10:00", count: 18 },
                      { time: "12:00", count: 45 },
                      { time: "14:00", count: 32 },
                      { time: "16:00", count: 28 },
                      { time: "18:00", count: 15 },
                    ]
              }
            >
              <defs>
                <linearGradient id="colorBacklog" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#c084fc" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="12 12"
                vertical={false}
                stroke="rgba(255,255,255,0.03)"
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: "#475569", fontStyle: 'italic' }}
                dy={20}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: "#475569", fontStyle: 'italic' }}
                dx={-20}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-6 rounded-[2rem] shadow-3xl">
                        <p className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest mb-2">{label}</p>
                        <p className="text-2xl font-black italic text-white tracking-tighter">
                          {payload[0].value} Units
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                strokeWidth={5}
                fillOpacity={1}
                fill="url(#colorBacklog)"
                animationDuration={2500}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Critical Efficiency Alerts */}
      <div className="bg-white/[0.03] backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col hover:bg-white/[0.05] hover:-translate-y-1 transition-all duration-700 group/efficiency">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
            Efficiency Latency
          </h3>
          <Box className="w-6 h-6 text-slate-500 group-hover/efficiency:text-amber-400 transition-colors" />
        </div>

        <div className="space-y-5 flex-1">
          {(Array.isArray(data.slowestSkus) ? data.slowestSkus : []).map((sku, idx) => (
            <div
              key={idx}
              className="group/item flex items-start gap-6 p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-white/[0.04] transition-all duration-500 cursor-default shadow-lg"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-900/50 flex items-center justify-center shrink-0 group-hover/item:scale-110 group-hover/item:text-amber-400 transition-all border border-white/5 shadow-inner">
                <Clock className="w-7 h-7 opacity-40 group-hover/item:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
                    {sku.sku}
                  </p>
                  <p className="text-sm font-black text-amber-500 italic tracking-tighter">
                    {sku.avgTime}m
                  </p>
                </div>
                <p className="text-lg font-black italic text-white leading-tight tracking-tighter group-hover/item:text-amber-400 transition-colors">
                  {sku.name}
                </p>
                <div className="mt-4 w-full bg-white/5 h-2 rounded-full overflow-hidden p-[1px] border border-white/5">
                  <div
                    className="h-full bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)] transition-all duration-2000 ease-out"
                    style={{
                      width: `${Math.min(100, (sku.avgTime / 15) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-10 rounded-[2.5rem] bg-indigo-600 text-white relative overflow-hidden group/insight shadow-3xl hover:scale-[1.02] transition-all duration-500 border-none">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 blur-[60px] -mr-20 -mt-20 group-hover/insight:scale-150 transition-all duration-1000" />
          <div className="absolute bottom-[-20%] left-[-10%] w-24 h-24 bg-sky-400/20 blur-[50px] pointer-events-none" />

          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-3xl border border-white/10 shadow-xl">
              <Zap className="w-5 h-5 text-indigo-100 animate-pulse" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-100 italic">
              AI Prediction Engine
            </p>
          </div>
          <p className="text-sm font-black italic relative z-10 leading-relaxed text-indigo-50 tracking-tight">
            Peak processing latency detected between 12:00 - 14:00. Recommend
            dynamic scaling of fulfillment protocols.
          </p>
        </div>
      </div>
    </div>
  );
};
