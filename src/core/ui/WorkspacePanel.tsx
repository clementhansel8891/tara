import type React from "react";
import { cn } from "@/lib/utils";

interface WorkspacePanelProps {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function WorkspacePanel({
  title,
  description,
  className,
  children,
}: WorkspacePanelProps) {
  return (
    <section className={cn("rounded-2xl border bg-background p-5 shadow-sm", className)}>
      {(title || description) && (
        <div className="mb-4 space-y-1">
          {title ? (
            <p className="text-sm font-semibold text-foreground">{title}</p>
          ) : null}
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}

export default WorkspacePanel;
