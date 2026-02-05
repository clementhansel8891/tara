import type React from "react";

interface FilterBarProps {
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  actions?: React.ReactNode;
}

/**
 * FilterBar
 *
 * Canonical admin toolbar.
 * Used for:
 * - Search
 * - Filtering
 * - Primary actions
 */
export default function FilterBar({
  searchPlaceholder = "Search...",
  onSearchChange,
  actions,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3">
      {/* Search */}
      <input
        placeholder={searchPlaceholder}
        onChange={(e) => onSearchChange?.(e.target.value)}
        className="w-[280px] rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
      />

      {/* Actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
