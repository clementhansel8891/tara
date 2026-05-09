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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 p-8 rounded-[2rem] border border-border/50 bg-surface-2/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden group transition-premium hover:border-primary/30">
      <div className="absolute inset-0 grad-primary opacity-[0.03] animate-glow" />
      <div className="relative z-10 space-y-2">
        <div className="flex items-center gap-5">
          {icon ? <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-inner glow-primary">{icon}</div> : null}
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-label text-muted-foreground mt-1">{subtitle}</p>
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
      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success/10 border border-success/20 shadow-lg backdrop-blur-md">
         <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse status-glow" />
         <span className="text-[8px] font-black uppercase text-success tracking-[0.3em] italic">LIVE_CONTEXT</span>
      </div>
    </div>
  );
}


export default PageHeader;
