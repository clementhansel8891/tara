import React from "react";
import { InfrastructureHealth as IInfrastructureHealth } from "@/core/types/retail/analytics";
import { Wifi, Smartphone, HardDrive, Activity } from "lucide-react";

interface InfrastructureHealthProps {
  data: IInfrastructureHealth;
}

export const InfrastructureHealth: React.FC<InfrastructureHealthProps> = ({
  data,
}) => {
  const getLatencyColor = (latency: number) => {
    if (latency < 50) return "text-emerald-500";
    if (latency < 150) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-sky-500/5 rounded-full blur-[100px] -mr-[10%] -mt-[10%] pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
          Infra & Connectivity
        </h3>
        <Activity className="w-5 h-5 text-slate-300 group-hover:text-sky-500 transition-colors" />
      </div>

      <div className="flex-1 space-y-6 relative z-10">
        <div className="relative overflow-hidden p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl shadow-slate-200 group/uptime">
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/20 blur-[80px] -mr-24 -mt-24 group-hover/uptime:scale-150 transition-transform duration-1000" />
          <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-indigo-500/10 blur-[60px] pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl flex items-center justify-center border border-white/10 group-hover/uptime:rotate-3 transition-transform">
                <Smartphone className="w-7 h-7 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 opacity-60">
                  Global Uptime
                </p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                    {data.uptimePercentage}
                  </p>
                  <p className="text-xl font-black text-slate-500 opacity-40">
                    %
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
              SLA: STABLE
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-2">
          <div className="group/metric p-6 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-emerald-100 hover:shadow-xl transition-all duration-300">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Network Latency
            </p>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-4xl font-black italic tracking-tighter ${data.networkLatency > 150 ? "text-rose-600" : "text-emerald-600"}`}
                >
                  {data.networkLatency}
                </span>
                <span className="text-[14px] font-black text-slate-400">
                  ms
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 px-3 py-1 bg-white/50 rounded-lg w-fit border border-slate-100/50">
                <div
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${data.networkLatency > 150 ? "bg-rose-500" : "bg-emerald-500"}`}
                />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  {data.networkLatency > 150 ? "Degraded" : "Optimal Peak"}
                </span>
              </div>
            </div>
          </div>

          <div className="group/metric p-6 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-blue-100 hover:shadow-xl transition-all duration-300">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Active Terminals
            </p>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black italic text-blue-600 tracking-tighter">
                  24
                </span>
                <span className="text-[14px] font-black text-slate-400">
                  Nodes
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 px-3 py-1 bg-white/50 rounded-lg w-fit border border-slate-100/50">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  100% Sync
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
