import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { InventoryIntelligence as IInventoryIntelligence } from "@/core/types/retail/analytics";
import { AlertTriangle, PackageSearch } from "lucide-react";

interface InventoryIntelligenceProps {
  data: IInventoryIntelligence;
}

export const InventoryIntelligence: React.FC<InventoryIntelligenceProps> = ({
  data,
}) => {
  return (
    <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] -mr-[10%] -mt-[10%] pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
          Stock Intelligence
        </h3>
        <PackageSearch className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
      </div>

      <div className="flex-1 space-y-10 relative z-10">
        {/* Stock Aging */}
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">
              Health Distribution
            </p>
            <div className="flex gap-1.5 px-3 py-1 rounded-full bg-slate-100/50 border border-slate-200/50">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <div className="w-2 h-2 rounded-full bg-indigo-300" />
              <div className="w-2 h-2 rounded-full bg-rose-400" />
            </div>
          </div>

          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stockAging}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="50%" stopColor="#818cf8" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="bracket"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 900, fill: "#94a3b8" }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "rgba(99, 102, 241, 0.05)", radius: 10 }}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "20px",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                    fontSize: "11px",
                    fontWeight: 900,
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 4, 4]} barSize={28}>
                  {(data.stockAging || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === (data.stockAging || []).length - 1
                          ? "#f43f5e"
                          : "url(#barGradient)"
                      }
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction List */}
        <div className="space-y-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                Critical Depletion (7D)
              </p>
            </div>
            <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 animate-pulse">
              ACTION REQ
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {(data.lowStockPrediction || []).map((item, idx) => (
              <div
                key={idx}
                className="group/item flex items-center gap-5 p-5 rounded-[2.5rem] bg-white border border-slate-100/50 hover:border-rose-200 hover:bg-rose-50/20 transition-all duration-300 cursor-default"
              >
                <div className="min-w-[4.5rem] h-14 rounded-3xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 group-hover/item:bg-white group-hover/item:text-rose-600 group-hover/item:shadow-sm transition-all border border-slate-100/50">
                  <span className="text-[16px] font-black leading-none mb-1">
                    {item.currentStock > 999
                      ? `${(item.currentStock / 1000).toFixed(1)}k`
                      : item.currentStock}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-[0.1em] opacity-60">
                    Units
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-black italic text-slate-900 group-hover/item:text-rose-900 transition-colors truncate mb-1">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black uppercase tracking-tight text-slate-400 group-hover/item:text-rose-400 whitespace-nowrap">
                      OUT IN: {item.predictedOutDate}
                    </p>
                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden p-[1px]">
                      <div
                        className="h-full bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.4)] transition-all duration-1500"
                        style={{
                          width: `${Math.max(10, Math.min(100, (item.currentStock / 50) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
