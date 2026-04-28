import React from "react";
import { RiskCompliance as IRiskCompliance } from "@/core/types/retail/analytics";
import {
  ShieldAlert,
  Fingerprint,
  Banknote,
  ShieldCheck,
  AlertTriangle,
  Search,
} from "lucide-react";

interface RiskCompliancePanelProps {
  data: IRiskCompliance;
}

export const RiskCompliancePanel: React.FC<RiskCompliancePanelProps> = ({
  data,
}) => {
  return (
    <div className="bg-white/[0.03] backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 shadow-2xl hover:bg-white/[0.05] hover:-translate-y-1 transition-all duration-700 group h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-rose-500/10 rounded-full blur-[130px] -mr-[15%] -mt-[15%] pointer-events-none" />

      <div className="flex items-center justify-between mb-10 relative z-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
          Risk & Compliance Matrix
        </h3>
        <ShieldCheck className="w-6 h-6 text-slate-500 group-hover:text-rose-400 transition-colors" />
      </div>

      <div className="flex-1 space-y-12 relative z-10">
        {/* Suspicious Activity Feed */}
        <div className="p-8 rounded-[2.5rem] bg-rose-500/10 border border-rose-500/20 relative overflow-hidden group/alertfeed shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/20 blur-[80px] -mr-24 -mt-24 group-hover/alertfeed:scale-150 transition-all duration-1000" />

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30 shadow-lg">
                <ShieldAlert className="w-6 h-6 text-rose-500" />
              </div>
              <p className="text-[12px] font-black uppercase tracking-widest text-white italic">
                Active Anomalies
              </p>
            </div>
            <span className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 text-[10px] font-black text-white animate-pulse shadow-lg tracking-widest italic">
              LIVE MONITOR
            </span>
          </div>

          <div className="space-y-5">
            {(data.suspiciousTransactions || []).map((tx, idx) => (
              <div
                key={idx}
                className="group/alert flex items-start gap-6 p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-white/[0.04] hover:shadow-2xl transition-all duration-500 cursor-default shadow-xl"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-900/50 flex items-center justify-center group-hover/alert:scale-110 group-hover/alert:text-amber-400 transition-all border border-white/5 shadow-inner">
                  <AlertTriangle className="w-7 h-7 opacity-30 group-hover/alert:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-lg font-black italic text-white group-hover/alert:text-amber-400 transition-colors truncate tracking-tighter">
                      {tx.type}
                    </p>
                    <p className="text-xl font-black text-rose-500 ml-4 whitespace-nowrap tracking-tighter shadow-sm">
                      Rp {(tx.amount / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 italic">
                      ID: <span className="opacity-60">{tx.id}</span>
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/alert:text-amber-400 transition-colors italic">
                      {tx.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {(!data.suspiciousTransactions ||
              data.suspiciousTransactions.length === 0) && (
              <div className="py-12 text-center bg-white/[0.02] rounded-[2.5rem] border border-dashed border-white/10">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 italic">
                  Zero threats detected in active stream
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Oversight Metrics */}
        <div className="grid grid-cols-2 gap-8 pt-4">
          <div className="group/metric p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-amber-500/30 hover:shadow-3xl transition-all duration-500 shadow-xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover/metric:bg-amber-600 group-hover/metric:text-white transition-all duration-500 shadow-inner">
                <Fingerprint className="w-5 h-5 text-slate-500 group-hover/metric:text-white transition-colors" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 leading-none italic">
                Manual Overrides
              </span>
            </div>
            <div className="flex items-baseline gap-3 relative z-10">
              <p className="text-5xl font-black italic text-white tracking-tighter">
                {data.manualOverrides.length}
              </p>
              <span className="text-xl font-black text-slate-500 italic uppercase tracking-tighter">
                Logs
              </span>
            </div>
          </div>

          <div className="group/metric p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-emerald-500/30 hover:shadow-3xl transition-all duration-500 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
            <div className="flex items-center justify-center gap-4 mb-6 relative z-10">
              <Banknote className="w-5 h-5 text-slate-500 group-hover/metric:text-emerald-400 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 leading-none italic">
                Compliance Status
              </span>
            </div>
            <div className="flex-1 flex flex-col justify-center relative z-10">
              <div className="flex items-center justify-center gap-3 px-6 py-2.5 rounded-xl bg-emerald-500/10 text-[11px] font-black text-emerald-400 uppercase tracking-widest border border-emerald-500/20 shadow-xl shadow-emerald-500/5 animate-pulse italic">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                SLA NOMINAL
              </div>
              <p className="mt-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
                Audit Finalized
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
