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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 p-4 rounded-3xl border border-border/50 bg-card/20 backdrop-blur-md shadow-lg relative overflow-hidden group transition-all hover:border-primary/20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
      <div className="relative z-10 space-y-1">
        <div className="flex items-center gap-4">
          {icon ? <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-inner">{icon}</div> : null}
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase italic">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-0.5">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>
      {(primaryAction || secondaryActions) && (
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {secondaryActions}
          {primaryAction}
        </div>
      )}
      
      {/* Decorative pulse point */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
         <div className="h-1 w-1 rounded-full bg-success animate-pulse" />
         <span className="text-[7px] font-black uppercase text-success tracking-widest">LIVE CONTEXT</span>
      </div>
    </div>
  );
}

export default PageHeader;
