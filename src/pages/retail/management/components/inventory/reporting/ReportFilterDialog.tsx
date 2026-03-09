import React from "react";
import {
  Download,
  FileText,
  History,
  Building2,
  Calendar,
  Layers,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ReportTemplate } from "./ReportingHubTypes";
import type { RetailStore } from "@/core/types/retail/retail";

interface ReportFilterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeReportMeta: ReportTemplate | null;
  branchId: string;
  setBranchId: (id: string) => void;
  isAdmin: boolean;
  stores: RetailStore[];
  effectiveBranchId: string;
  dateFrom: string;
  setDateFrom: (val: string) => void;
  dateTo: string;
  setDateTo: (val: string) => void;
  toggles: {
    costPrice: boolean;
    supplierInfo: boolean;
    barcodes: boolean;
  };
  toggleField: (field: "costPrice" | "supplierInfo" | "barcodes") => void;
  isGenerating: boolean;
  handleExport: (format: "CSV" | "PDF" | "EXCEL") => void;
}

export const ReportFilterDialog: React.FC<ReportFilterDialogProps> = ({
  isOpen,
  onOpenChange,
  activeReportMeta,
  branchId,
  setBranchId,
  isAdmin,
  stores,
  effectiveBranchId,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  toggles,
  toggleField,
  isGenerating,
  handleExport,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] p-0 border-none rounded-[3.5rem] overflow-hidden bg-white/95 backdrop-blur-2xl shadow-[0_64px_128px_-24px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
        <div className="flex flex-col lg:flex-row h-full lg:min-h-[600px]">
          {/* Modal Left: Active Report Info */}
          <div className="hidden lg:flex lg:w-80 bg-slate-950 p-12 flex-col justify-between relative overflow-hidden">
            <div className="absolute -left-16 -top-16 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />
            <div className="relative z-10 space-y-8">
              <div className="w-16 h-16 rounded-[2rem] bg-white/10 border border-white/10 flex items-center justify-center">
                {activeReportMeta && (
                  <activeReportMeta.icon className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none">
                  {activeReportMeta?.label}
                </h3>
                <div className="h-1 w-12 bg-indigo-500 rounded-full" />
                <p className="text-sm text-slate-400 font-medium italic leading-relaxed">
                  {activeReportMeta?.description}
                </p>
              </div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-indigo-400 mb-6">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Secure Endpoint
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-slate-500 italic uppercase">
                  Trace ID: EXT-
                  {Math.random().toString(36).substring(7).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Right: Filter Logic */}
          <div className="flex-1 p-10 lg:p-14 space-y-10 overflow-y-auto">
            <div>
              <DialogHeader className="p-0 text-left">
                <DialogTitle className="font-black italic text-3xl tracking-tighter text-slate-950 uppercase mb-2">
                  Extraction Parameters
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium italic">
                  Configure your data scope and formatting options to initiate
                  the deployment.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Branch Selection */}
              <div className="space-y-5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-indigo-500" /> Store
                  Isolation
                </Label>
                <Select
                  value={effectiveBranchId}
                  onValueChange={setBranchId}
                  disabled={!isAdmin}
                >
                  <SelectTrigger className="h-16 rounded-[1.5rem] font-black italic border-slate-100 bg-white shadow-sm px-6 hover:bg-slate-50 transition-all">
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[2rem] border-none shadow-2xl p-3 font-black italic bg-white/95 backdrop-blur-md">
                    <SelectItem
                      value="all"
                      className="rounded-xl py-4 focus:bg-indigo-50"
                    >
                      Global HQ (All Branches)
                    </SelectItem>
                    <Separator className="my-3 opacity-50" />
                    {stores.map((s) => (
                      <SelectItem
                        key={s.id}
                        value={s.id}
                        className="rounded-xl py-4 focus:bg-indigo-50"
                      >
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-5">
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Time
                  Dimension
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-16 rounded-[1.5rem] border-slate-100 bg-white shadow-sm px-6 font-bold focus:ring-indigo-500 transition-all text-sm"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-16 rounded-[1.5rem] border-slate-100 bg-white shadow-sm px-6 font-bold focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Data Toggles */}
            <div className="space-y-6">
              <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Information Manifest (Toggle Columns)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { key: "costPrice", label: "Cost", icon: Layers },
                  { key: "supplierInfo", label: "Vendor", icon: Info },
                  { key: "barcodes", label: "UPC", icon: History },
                ].map((toggle) => (
                  <div
                    key={toggle.key}
                    onClick={() =>
                      toggleField(toggle.key as keyof typeof toggles)
                    }
                    className={cn(
                      "flex flex-col items-center justify-center p-8 rounded-[2.5rem] cursor-pointer transition-all border-2 text-center space-y-4",
                      toggles[toggle.key as keyof typeof toggles]
                        ? "bg-indigo-50 border-indigo-600 shadow-xl shadow-indigo-100/50"
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200",
                    )}
                  >
                    <toggle.icon
                      className={cn(
                        "w-7 h-7",
                        toggles[toggle.key as keyof typeof toggles]
                          ? "text-indigo-600"
                          : "text-slate-300",
                      )}
                    />
                    <div
                      className={cn(
                        "text-[10px] font-black italic uppercase tracking-widest",
                        toggles[toggle.key as keyof typeof toggles]
                          ? "text-indigo-700"
                          : "text-slate-500",
                      )}
                    >
                      {toggle.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Actions */}
            <div className="pt-8 flex flex-col sm:flex-row gap-5">
              <Button
                onClick={() => handleExport("CSV")}
                disabled={isGenerating}
                className="flex-1 h-20 rounded-[2.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black italic uppercase tracking-[0.25em] text-sm gap-4 shadow-2xl shadow-indigo-200 transition-all active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6" /> Deploy Extract
                  </>
                )}
              </Button>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleExport("EXCEL")}
                  disabled={isGenerating}
                  className="w-20 h-20 rounded-[2.5rem] p-0 border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all"
                  title="Export .XLSX"
                >
                  <Layers className="w-6 h-6 text-slate-900" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport("PDF")}
                  disabled={isGenerating}
                  className="w-20 h-20 rounded-[2.5rem] p-0 border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all"
                  title="Export .PDF"
                >
                  <FileText className="w-6 h-6 text-slate-900" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
