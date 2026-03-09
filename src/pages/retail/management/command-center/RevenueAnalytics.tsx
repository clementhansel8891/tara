import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { RevenueAnalytics as IRevenueAnalytics } from "@/core/types/retail/analytics";
import { TrendingUp, Wallet, Receipt, Percent } from "lucide-react";

interface RevenueAnalyticsProps {
  data: IRevenueAnalytics;
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e"];

export const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      {/* Revenue Trend Area */}
      <div className="xl:col-span-3 bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] -mr-[10%] -mt-[10%] group-hover:bg-indigo-500/10 transition-colors" />

        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-transform">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Revenue Flow
              </h3>
              <p className="text-3xl font-black italic text-slate-900 tracking-tighter">
                Live Performance
              </p>
            </div>
          </div>
          <div className="bg-emerald-500/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-emerald-500/20 text-right group/growth">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
              Uptick Trend
            </p>
            <p className="text-2xl font-black italic text-emerald-600 leading-none mt-1 group-hover/growth:scale-110 transition-transform origin-right">
              +{data.growthPercentage}%
            </p>
          </div>
        </div>

        <div className="h-[360px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.daily}>
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="8 8"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: "#94a3b8" }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: "#94a3b8" }}
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
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
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={5}
                fillOpacity={1}
                fill="url(#revenueGradient)"
                animationDuration={2500}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side Insights */}
      <div className="space-y-8 flex flex-col">
        {/* Payment Mix Widget */}
        {/* Side Insights */}
        <div className="space-y-8 flex flex-col">
          {/* Payment Mix Widget */}
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex-1 flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Payment Mix
              </h3>
              <Wallet className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="h-[140px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.paymentMethodDistribution}
                      innerRadius={50}
                      outerRadius={65}
                      paddingAngle={8}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                      stroke="none"
                    >
                      {data.paymentMethodDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                    Active
                  </span>
                  <span className="text-xl font-black italic text-slate-900 leading-none">
                    {data.paymentMethodDistribution.length}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {data.paymentMethodDistribution.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between group/item cursor-default"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full transition-all"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-[11px] font-bold text-slate-500 group-hover/item:text-slate-900 transition-colors uppercase tracking-tight">
                        {item.method}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-slate-900 bg-slate-100/50 px-2 py-0.5 rounded-lg group-hover/item:bg-white transition-colors">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Refund & Anomaly Card */}
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl shadow-indigo-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/30 blur-[80px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
            <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-emerald-500/10 blur-[60px] pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
                Loss Prevention
              </h3>
              <Receipt className="w-5 h-5 text-emerald-400 opacity-50 group-hover:rotate-12 transition-transform" />
            </div>

            <div className="flex items-baseline gap-2 relative z-10">
              <p className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                {data.refundRatio}
              </p>
              <p className="text-xl font-black text-slate-500 opacity-40">%</p>
            </div>

            <div className="mt-10 relative z-10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Refund Ratio
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
                  NOMINAL
                </span>
              </div>
              <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="bg-indigo-400 h-full rounded-full shadow-[0_0_20px_rgba(129,140,248,0.6)] transition-all duration-1500 ease-out"
                  style={{
                    width: `${Math.min(100, (data.refundRatio / 5) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
