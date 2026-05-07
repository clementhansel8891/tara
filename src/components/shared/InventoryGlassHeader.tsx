import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface InventoryGlassHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
  stats?: {
    label: string;
    value: string | number;
    trend?: number;
    color?: string;
  }[];
}

export const InventoryGlassHeader: React.FC<InventoryGlassHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  stats,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-8 mb-8 rounded-[2.5rem] bg-white/40 backdrop-blur-2xl border border-white/20 shadow-2xl overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Title Section */}
        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-900 shadow-xl shadow-slate-900/20 text-white">
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Stats Row */}
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 lg:gap-8 bg-white/50 p-4 rounded-[1.8rem] border border-white/40 backdrop-blur-sm">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col gap-1 px-4 border-r border-slate-200 last:border-none">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {stat.label}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black italic text-slate-900">
                    {stat.value}
                  </span>
                  {stat.trend !== undefined && (
                    <span className={`text-[10px] font-bold ${stat.trend >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {stat.trend >= 0 ? "+" : ""}{stat.trend}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
};
