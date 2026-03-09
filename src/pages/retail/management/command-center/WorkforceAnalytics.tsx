import React from "react";
import { WorkforceAnalytics as IWorkforceAnalytics } from "@/core/types/retail/analytics";
import { Users, TrendingUp, Clock, AlertCircle } from "lucide-react";

interface WorkforceAnalyticsProps {
  data: IWorkforceAnalytics;
}

export const WorkforceAnalytics: React.FC<WorkforceAnalyticsProps> = ({
  data,
}) => {
  return (
    <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-sky-500/5 rounded-full blur-[100px] -mr-[10%] -mt-[10%] pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
          Workforce & Efficiency
        </h3>
        <Users className="w-5 h-5 text-slate-300 group-hover:text-sky-500 transition-colors" />
      </div>

      <div className="flex-1 space-y-10 relative z-10">
        {/* Staff Leaderboard */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-sky-500/10 rounded-xl">
              <TrendingUp className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">
              Peak Performance (Live)
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {(data.staffPerformance || []).map((staff, idx) => {
              const percentage = Math.min(100, (staff.sales / 15000000) * 100);
              return (
                <div
                  key={idx}
                  className="group/staff cursor-default bg-white border border-slate-100/50 p-5 rounded-[2rem] hover:border-sky-200 hover:bg-sky-50/20 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[12px] font-black text-slate-400 group-hover/staff:bg-sky-500 group-hover/staff:text-white group-hover/staff:rotate-6 transition-all shadow-inner">
                        {idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-black text-slate-900 group-hover/staff:text-sky-700 transition-colors truncate max-w-[140px]">
                          {staff.name}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          Senior Associate
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[16px] font-black text-slate-900 italic block leading-none mb-1">
                        Rp {(staff.sales / 1000000).toFixed(1)}M
                      </span>
                      <div className="flex items-center justify-end gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/10">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                        <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter leading-none">
                          Top Contributor
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden p-[1px]">
                    <div
                      className="absolute top-0 left-0 h-full bg-sky-500 rounded-full transition-all duration-1500 ease-out shadow-[0_0_10px_rgba(14,165,233,0.4)]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Efficiency Tiles */}
        <div className="grid grid-cols-2 gap-6 pt-2">
          <div className="group/tile relative bg-sky-500/5 backdrop-blur-md p-6 rounded-[2rem] border border-sky-200/50 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <Clock className="absolute top-6 right-6 w-5 h-5 text-sky-200 group-hover/tile:text-sky-400 transition-colors" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 mb-2">
              Shift Util.
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black italic text-sky-900 tracking-tighter">
                {(data.shiftUtilization * 100).toFixed(0)}
              </span>
              <span className="text-[14px] font-black text-sky-400">%</span>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-sky-100/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full"
                  style={{ width: `${data.shiftUtilization * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="group/tile relative bg-rose-500/5 backdrop-blur-md p-6 rounded-[2rem] border border-rose-200/50 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <AlertCircle className="absolute top-6 right-6 w-5 h-5 text-rose-200 group-hover/tile:text-rose-400 transition-colors" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 mb-2">
              Active Alerts
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black italic text-rose-900 tracking-tighter">
                0
              </span>
              <span className="text-[14px] font-black text-rose-400 uppercase tracking-tighter leading-none">
                CRIT
              </span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                Nominal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
