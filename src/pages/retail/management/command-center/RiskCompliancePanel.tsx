import React from "react";
import { RiskCompliance as IRiskCompliance } from "@/core/types/retail/analytics";
import {
  ShieldAlert,
  Fingerprint,
  Banknote,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface RiskCompliancePanelProps {
  data: IRiskCompliance;
}

export const RiskCompliancePanel: React.FC<RiskCompliancePanelProps> = ({
  data,
}) => {
  return (
    <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-rose-500/5 rounded-full blur-[100px] -mr-[10%] -mt-[10%] pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
          Risk & Compliance
        </h3>
        <ShieldCheck className="w-5 h-5 text-slate-300 group-hover:text-rose-400 transition-colors" />
      </div>

      <div className="flex-1 space-y-8 relative z-10">
        {/* Suspicious Activity Feed */}
        <div className="p-6 rounded-[2.5rem] bg-rose-500/5 border border-rose-200/50 relative overflow-hidden group/alertfeed">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl -mr-16 -mt-16 group-hover/alertfeed:scale-125 transition-transform duration-1000" />

          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-rose-900/70">
                Active Anomalies
              </p>
            </div>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-[8px] font-black text-white animate-pulse">
              LIVE MONITOR
            </span>
          </div>

          <div className="space-y-4">
            {(data.suspiciousTransactions || []).map((tx, idx) => (
              <div
                key={idx}
                className="group/alert flex items-start gap-5 p-5 rounded-3xl bg-white border border-slate-100/50 hover:border-amber-200 hover:bg-amber-50/20 hover:shadow-lg transition-all duration-300 cursor-default"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover/alert:bg-white group-hover/alert:text-amber-600 transition-all border border-slate-100/50 shadow-inner">
                  <AlertTriangle className="w-6 h-6 opacity-30 group-hover/alert:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[14px] font-black italic text-slate-900 truncate">
                      {tx.type}
                    </p>
                    <p className="text-[15px] font-black text-rose-600 ml-4 whitespace-nowrap tracking-tighter">
                      Rp {(tx.amount / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                      ID: <span className="opacity-60">{tx.id}</span>
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover/alert:text-amber-500 transition-colors">
                      {tx.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {(!data.suspiciousTransactions ||
              data.suspiciousTransactions.length === 0) && (
              <div className="py-8 text-center bg-white/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                  No active threats detected
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Oversight Metrics */}
        <div className="grid grid-cols-2 gap-6 pt-2">
          <div className="group/metric p-6 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-amber-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 bg-slate-100 rounded-xl group-hover/metric:bg-amber-100 transition-colors">
                <Fingerprint className="w-4 h-4 text-slate-400 group-hover/metric:text-amber-600 transition-colors" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none">
                Overrides
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black italic text-slate-900 tracking-tighter">
                {data.manualOverrides.length}
              </p>
              <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
                Logs
              </span>
            </div>
          </div>

          <div className="group/metric p-6 rounded-[2rem] bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-emerald-200 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <Banknote className="w-4 h-4 text-slate-400 group-hover/metric:text-emerald-500 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none">
                Compliance
              </span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100 shadow-sm shadow-emerald-500/5 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Nominal
              </div>
              <p className="mt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                Audit Confirmed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
