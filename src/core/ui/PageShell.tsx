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
  return (
    <div className="min-h-screen w-full bg-slate-50/50 dark:bg-slate-950/50">
      <div className="flex flex-col w-full h-screen font-sans">
        {header && (
          <header className="shrink-0 border-b bg-background/80 backdrop-blur-md z-20">
            {header}
          </header>
        )}
        
        <div className="flex-1 flex overflow-hidden">
          {left && (
            <aside className="w-80 shrink-0 border-r bg-card/40 backdrop-blur-xl hidden lg:block overflow-y-auto">
              {left}
            </aside>
          )}
          
          <main className="flex-1 overflow-y-auto relative bg-background/20">
            <div className="container mx-auto p-6">
              {children}
            </div>
            {footer && <div className="p-6 border-t mt-auto">{footer}</div>}
          </main>

          {right && (
            <aside className="w-80 shrink-0 border-l bg-card/40 backdrop-blur-xl hidden xl:block overflow-y-auto">
              {right}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageShell;
