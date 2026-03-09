import type React from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  header?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function PageShell({
  header,
  left,
  right,
  footer,
  children,
}: PageShellProps) {
  const gridClass = cn(
    "grid gap-6",
    left && right
      ? "lg:grid-cols-[260px_minmax(0,1fr)_320px]"
      : left
        ? "lg:grid-cols-[260px_minmax(0,1fr)]"
        : right
          ? "lg:grid-cols-[minmax(0,1fr)_320px]"
          : "grid-cols-[minmax(0,1fr)]",
  );

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6 font-sans">
        {header}
        <div className={gridClass}>
          {left ? (
            <aside className="rounded-xl border bg-card/60 shadow-sm relative z-10">
              {left}
            </aside>
          ) : null}
          <main className="min-w-0 relative z-10">{children}</main>
          {right ? (
            <aside className="rounded-xl border bg-card/60 shadow-sm relative z-10">
              {right}
            </aside>
          ) : null}
        </div>
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
}

export default PageShell;
