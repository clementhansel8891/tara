import type React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  primaryAction,
  secondaryActions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-12 p-10 rounded-[3rem] bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden group transition-all hover:border-slate-700">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-50" />
      <div className="relative z-10 space-y-1">
        <div className="flex items-center gap-4">
          {icon ? <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white shadow-inner">{icon}</div> : null}
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-400 mt-1">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>
      {(primaryAction || secondaryActions) && (
        <div className="relative z-10 flex flex-wrap items-center gap-4">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
      
      {/* Decorative pulse point */}
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
         <span className="text-[8px] font-black uppercase text-emerald-400 tracking-widest">Live System Context</span>
      </div>
    </div>
  );
}

export default PageHeader;
