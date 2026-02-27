import React from "react";
import { Search, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryFilters } from "./types";

type Props = {
  canWrite: boolean;
  filters: InventoryFilters;
  categoryOptions: string[];
  onFiltersChange: (patch: Partial<InventoryFilters>) => void;
  onAddSku?: () => void;
};

export const FiltersBar: React.FC<Props> = ({
  canWrite,
  filters,
  categoryOptions,
  onFiltersChange,
  onAddSku,
}) => {
  return (
    <div className="flex items-center gap-3 bg-white rounded-[1.5rem] p-3 border border-slate-100 shadow-lg">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
        <Input
          className="pl-12 h-11 bg-slate-50 border-none rounded-xl font-bold italic placeholder:text-slate-300"
          placeholder="Search SKU, name or category..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
        />
      </div>
      <Select
        value={filters.category}
        onValueChange={(v) => onFiltersChange({ category: v })}
      >
        <SelectTrigger className="w-44 h-11 rounded-xl font-black italic text-xs border-slate-100">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {categoryOptions.map((c) => (
            <SelectItem key={c} value={c} className="font-bold italic">
              {c === "all" ? "All Categories" : c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.sortBy}
        onValueChange={(v: InventoryFilters["sortBy"]) =>
          onFiltersChange({ sortBy: v })
        }
      >
        <SelectTrigger className="w-40 h-11 rounded-xl font-black italic text-xs border-slate-100">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="name-asc" className="font-bold italic">
            Name (A → Z)
          </SelectItem>
          <SelectItem value="name-desc" className="font-bold italic">
            Name (Z → A)
          </SelectItem>
          <SelectItem value="price-asc" className="font-bold italic">
            Price (Low → High)
          </SelectItem>
          <SelectItem value="price-desc" className="font-bold italic">
            Price (High → Low)
          </SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.status}
        onValueChange={(v) => onFiltersChange({ status: v })}
      >
        <SelectTrigger className="w-36 h-11 rounded-xl font-black italic text-xs border-slate-100">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {["all", "ok", "low", "critical", "overstock"].map((s) => (
            <SelectItem key={s} value={s} className="font-bold italic">
              {s === "all" ? "All Status" : s.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {canWrite && (
        <Button
          onClick={onAddSku}
          className="h-11 px-5 rounded-xl bg-slate-900 text-white font-black italic text-xs uppercase tracking-widest gap-2"
        >
          <Plus className="w-4 h-4" /> Add SKU
        </Button>
      )}
    </div>
  );
};
