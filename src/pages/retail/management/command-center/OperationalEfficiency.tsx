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
import { Clock, AlertCircle, Zap, Box } from "lucide-react";

interface OperationalEfficiencyProps {
  data: IOperationalEfficiency;
}

export const OperationalEfficiency: React.FC<OperationalEfficiencyProps> = ({
  data,
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Backlog Trend Area */}
      <div className="xl:col-span-2 bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-violet-500/5 rounded-full blur-[100px] -mr-[10%] -mt-[10%] group-hover:bg-violet-500/10 transition-colors" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[1.25rem] bg-violet-500 flex items-center justify-center text-white shadow-lg shadow-violet-100 group-hover:rotate-6 transition-transform">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Logistics Velocity
              </h3>
              <p className="text-3xl font-black italic text-slate-900 tracking-tighter">
                Fulfillment Backlog
              </p>
            </div>
          </div>
        </div>

        <div className="h-[320px] w-full relative z-10">
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
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="50%" stopColor="#c084fc" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="8 8"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: "#94a3b8" }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: "#94a3b8" }}
                dx={-15}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(12px)",
                  borderRadius: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.5)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
                  padding: "16px 20px",
                }}
                labelStyle={{
                  fontWeight: 900,
                  color: "#64748b",
                  marginBottom: "4px",
                  fontSize: "10px",
                  textTransform: "uppercase",
                }}
                itemStyle={{
                  fontWeight: 900,
                  fontSize: "14px",
                  color: "#1e293b",
                  fontStyle: "italic",
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
      <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group/efficiency">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
            Efficiency Alerts
          </h3>
          <Box className="w-5 h-5 text-slate-300 group-hover/efficiency:text-amber-500 transition-colors" />
        </div>

        <div className="space-y-4 flex-1">
          {data.slowestSkus.map((sku, idx) => (
            <div
              key={idx}
              className="group/item flex items-start gap-5 p-5 rounded-3xl bg-white border border-slate-100/50 hover:border-amber-200 hover:bg-amber-50/20 transition-all cursor-default"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover/item:bg-amber-100 group-hover/item:text-amber-600 transition-colors border border-slate-100/50">
                <Clock className="w-6 h-6 opacity-40" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    {sku.sku}
                  </p>
                  <p className="text-[12px] font-black text-amber-600 italic">
                    {sku.avgTime}m
                  </p>
                </div>
                <p className="text-[15px] font-black italic text-slate-900 leading-tight group-hover/item:text-amber-700 transition-colors">
                  {sku.name}
                </p>
                <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden p-[1px]">
                  <div
                    className="h-full bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    style={{
                      width: `${Math.min(100, (sku.avgTime / 15) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-8 rounded-[2rem] bg-indigo-600 text-white relative overflow-hidden group/insight shadow-[0_15px_30px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-transform">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-[50px] -mr-16 -mt-16 group-hover/insight:scale-150 transition-transform duration-1000" />
          <div className="absolute bottom-[-20%] left-[-10%] w-24 h-24 bg-sky-400/20 blur-[40px] pointer-events-none" />

          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
              <Zap className="w-4 h-4 text-indigo-200 animate-pulse" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
              AI Insight Engine
            </p>
          </div>
          <p className="text-[13px] font-black italic relative z-10 leading-relaxed text-indigo-50">
            Peak processing latency detected between 12:00 - 14:00. Recommend
            scaling fulfillment staff.
          </p>
        </div>
      </div>
    </div>
  );
};
