import React from "react";
import { InfrastructureHealth as IInfrastructureHealth } from "@/core/types/retail/analytics";
import { Smartphone, Activity, Wifi, Server } from "lucide-react";

interface InfrastructureHealthProps {
  data: IInfrastructureHealth;
}

export const InfrastructureHealth: React.FC<InfrastructureHealthProps> = ({
  data,
}) => {
  return (
    <div className="bg-white/[0.03] backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 shadow-2xl hover:bg-white/[0.05] hover:-translate-y-1 transition-all duration-700 group h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[130px] -mr-[15%] -mt-[15%] pointer-events-none" />

      <div className="flex items-center justify-between mb-10 relative z-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
          Infrastructure Intelligence Matrix
        </h3>
        <Activity className="w-6 h-6 text-slate-500 group-hover:text-sky-400 transition-colors" />
      </div>

      <div className="flex-1 space-y-8 relative z-10">
        <div className="relative overflow-hidden p-10 rounded-[2.5rem] bg-slate-900 border border-white/5 shadow-3xl group/uptime">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/20 blur-[100px] -mr-32 -mt-32 group-hover/uptime:scale-150 transition-all duration-1000" />
          <div className="absolute bottom-[-20%] left-[-10%] w-40 h-40 bg-indigo-500/10 blur-[80px] pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-3xl flex items-center justify-center border border-white/10 group-hover/uptime:rotate-3 transition-all duration-500 shadow-xl">
                <Smartphone className="w-8 h-8 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.6)]" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400 opacity-60 italic">
                  Global Fleet Uptime
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black italic tracking-tighter text-white">
                    {data.uptimePercentage}
                  </p>
                  <p className="text-2xl font-black text-slate-500 opacity-40 tracking-tighter">
                    %
                  </p>
                </div>
              </div>
            </div>
            <div className="px-5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 shadow-lg italic">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />{" "}
              SLA: STABLE
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-4">
          <div className="group/metric p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-emerald-500/30 hover:shadow-3xl transition-all duration-500 shadow-xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
            <Wifi className="absolute top-8 right-8 w-6 h-6 text-slate-500 group-hover/metric:text-emerald-400 transition-colors" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 italic">
              Fleet Latency
            </p>
            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-5xl font-black italic tracking-tighter ${data.networkLatency > 150 ? "text-rose-500" : "text-emerald-500"}`}
                >
                  {data.networkLatency}
                </span>
                <span className="text-xl font-black text-slate-500 italic tracking-tighter">
                  ms
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 px-4 py-1.5 bg-black/20 rounded-xl w-fit border border-white/5 shadow-inner">
                <div
                  className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)] ${data.networkLatency > 150 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"}`}
                />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">
                  {data.networkLatency > 150 ? "DEGRADED" : "OPTIMAL PEAK"}
                </span>
              </div>
            </div>
          </div>

          <div className="group/metric p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-blue-500/30 hover:shadow-3xl transition-all duration-500 shadow-xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
            <Server className="absolute top-8 right-8 w-6 h-6 text-slate-500 group-hover/metric:text-blue-400 transition-colors" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 italic">
              Active Terminals
            </p>
            <div className="flex flex-col gap-2 relative z-10">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black italic text-blue-500 tracking-tighter">
                  24
                </span>
                <span className="text-xl font-black text-slate-500 italic tracking-tighter">
                  Nodes
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 px-4 py-1.5 bg-black/20 rounded-xl w-fit border border-white/5 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">
                  100% SYNCED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
