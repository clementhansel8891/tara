import type React from "react";

interface DataTableShellProps {
  title?: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * DataTableShell
 *
 * Standard wrapper for enterprise admin tables.
 * Provides:
 * - Title
 * - Toolbar slot
 * - Scroll-safe container
 */
export default function DataTableShell({
  title,
  toolbar,
  children,
}: DataTableShellProps) {
  return (
    <div className="space-y-4">
      {title && (
        <div className="text-base font-semibold tracking-tight">{title}</div>
      )}

      {toolbar && <div>{toolbar}</div>}

      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="w-full overflow-auto">{children}</div>
      </div>
    </div>
  );
}
