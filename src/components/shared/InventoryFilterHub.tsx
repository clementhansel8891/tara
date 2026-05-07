import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface InventoryFilterHubProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  categories: { id: string; name: string }[];
  type?: string;
  onTypeChange?: (val: string) => void;
  status?: string;
  onStatusChange?: (val: string) => void;
  location?: string;
  onLocationChange?: (val: string) => void;
  locations?: { id: string; name: string }[];
  moduleTag?: string;
  onModuleTagChange?: (val: string) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceRangeChange?: (min?: number, max?: number) => void;
  advancedActions?: React.ReactNode;
}

export const InventoryFilterHub: React.FC<InventoryFilterHubProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  type,
  onTypeChange,
  status,
  onStatusChange,
  location,
  onLocationChange,
  locations,
  moduleTag,
  onModuleTagChange,
  minPrice,
  maxPrice,
  onPriceRangeChange,
  advancedActions,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = [
    category !== "all" && category !== "",
    type && type !== "all",
    status && status !== "all",
    location && location !== "all" && location !== "",
    moduleTag && moduleTag !== "",
    (minPrice !== undefined || maxPrice !== undefined)
  ].filter(Boolean).length;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        {/* Main Search Bar */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            className="pl-12 h-14 bg-white/70 backdrop-blur-md border-white shadow-sm rounded-2xl font-bold italic placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            placeholder="Quick search SKU, item name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Quick Category Select */}
        <Select value={category || "all"} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full md:w-56 h-14 rounded-2xl bg-white/70 backdrop-blur-md border-white shadow-sm font-black italic text-xs">
            <SelectValue placeholder="Category: All" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-white/50 backdrop-blur-xl">
            <SelectItem value="all" className="font-bold italic">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id} className="font-bold italic">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Toggle Advanced Filters */}
        <Button
          variant={isExpanded ? "default" : "outline"}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`h-14 px-6 rounded-2xl gap-3 font-black italic text-xs uppercase tracking-widest transition-all ${
            isExpanded ? "bg-slate-900 text-white" : "bg-white/70 backdrop-blur-md border-white text-slate-600 hover:bg-white"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="bg-indigo-500 text-white ml-1 h-5 min-w-[20px] justify-center px-1">
              {activeFilterCount}
            </Badge>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {advancedActions}
      </div>

      {/* Advanced Filter Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-[2rem] bg-white/50 backdrop-blur-2xl border border-white/30 shadow-inner mt-2">
              {/* Type Filter */}
              {onTypeChange && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Type</label>
                  <Select value={type || "all"} onValueChange={onTypeChange}>
                    <SelectTrigger className="h-11 rounded-xl bg-white/80 border-white shadow-sm font-bold italic text-xs">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="ITEM">ITEM</SelectItem>
                      <SelectItem value="RAW_MATERIAL">RAW MATERIAL</SelectItem>
                      <SelectItem value="SERVICE">SERVICE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Status Filter */}
              {onStatusChange && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Status</label>
                  <Select value={status || "all"} onValueChange={onStatusChange}>
                    <SelectTrigger className="h-11 rounded-xl bg-white/80 border-white shadow-sm font-bold italic text-xs">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ok">OK</SelectItem>
                      <SelectItem value="low">LOW STOCK</SelectItem>
                      <SelectItem value="critical">CRITICAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Location Filter */}
              {onLocationChange && locations && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Location</label>
                  <Select value={location || "all"} onValueChange={onLocationChange}>
                    <SelectTrigger className="h-11 rounded-xl bg-white/80 border-white shadow-sm font-bold italic text-xs">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Module Tag Filter */}
              {onModuleTagChange && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Context Tag</label>
                  <Input 
                    placeholder="e.g. RETAIL"
                    className="h-11 rounded-xl bg-white/80 border-white shadow-sm font-bold italic text-xs"
                    value={moduleTag || ""}
                    onChange={(e) => onModuleTagChange(e.target.value)}
                  />
                </div>
              )}

              {/* Price Range Filter */}
              {onPriceRangeChange && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Price Range</label>
                  <div className="flex items-center gap-2 h-11 rounded-xl bg-white/80 border-white shadow-sm px-3">
                    <Input 
                      type="number"
                      placeholder="Min"
                      className="h-7 border-none bg-transparent font-bold italic text-xs p-0 focus-visible:ring-0"
                      value={minPrice ?? ""}
                      onChange={(e) => onPriceRangeChange(e.target.value ? parseFloat(e.target.value) : undefined, maxPrice)}
                    />
                    <span className="text-slate-300">-</span>
                    <Input 
                      type="number"
                      placeholder="Max"
                      className="h-7 border-none bg-transparent font-bold italic text-xs p-0 focus-visible:ring-0 text-right"
                      value={maxPrice ?? ""}
                      onChange={(e) => onPriceRangeChange(minPrice, e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
