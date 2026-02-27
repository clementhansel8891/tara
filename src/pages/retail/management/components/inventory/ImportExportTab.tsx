import React from "react";
import { Upload, Download, Plus, CheckCircle2, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  canWrite: boolean;
};

export const ImportExportTab: React.FC<Props> = ({ canWrite }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Initial Import */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="p-7 border-b border-slate-50">
            <CardTitle className="font-black italic tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              Initial Data Import
            </CardTitle>
          </CardHeader>
          <CardContent className="p-7 space-y-5">
            <p className="text-[11px] text-slate-500 font-bold italic leading-relaxed">
              Import your inventory database from another system or push bulk
              changes. All imports are audited and require approval.
            </p>
            <div className="bg-slate-50 rounded-2xl p-5 border-2 border-dashed border-slate-200 text-center space-y-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
              <Upload className="w-8 h-8 text-slate-300 mx-auto group-hover:text-blue-500 transition-colors" />
              <div className="text-xs font-black italic uppercase tracking-widest text-slate-400 group-hover:text-blue-600">
                Drop CSV file or click to browse
              </div>
              <div className="text-[9px] text-slate-400 font-bold italic">
                Required columns: sku, name, category, qty
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl font-black italic text-xs uppercase gap-2 border-slate-200"
              >
                <Download className="w-3.5 h-3.5" /> Download Template
              </Button>
              <Button className="flex-1 h-11 rounded-xl bg-slate-900 text-white font-black italic text-xs uppercase gap-2">
                <Upload className="w-3.5 h-3.5" /> Upload &amp; Preview
              </Button>
            </div>

            {/* Last import log */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">
                Last Import
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-black italic text-slate-700">
                  inventory_batch_feb26.csv
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 font-black italic text-[9px] border-none">
                  COMPLETED
                </Badge>
              </div>
              <div className="text-[9px] text-slate-400 font-bold">
                148 SKUs • 2026-02-26 09:00 • by System Agent
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="p-7 border-b border-slate-50">
            <CardTitle className="font-black italic tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Download className="w-5 h-5 text-emerald-600" />
              </div>
              Export &amp; Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-7 space-y-4">
            <p className="text-[11px] text-slate-500 font-bold italic leading-relaxed">
              Export current inventory data for analysis, compliance, or
              handover to other systems.
            </p>
            {[
              {
                label: "Full Stock Ledger",
                sub: "All SKUs with SOH, ATS, buffer",
                color: "blue",
              },
              {
                label: "Critical & Low Items",
                sub: "Items below buffer threshold",
                color: "amber",
              },
              {
                label: "Movement History",
                sub: "Full audit trail (last 90 days)",
                color: "indigo",
              },
              {
                label: "Opname Report",
                sub: "Last completed stock count",
                color: "emerald",
              },
            ].map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-all cursor-pointer"
              >
                <div>
                  <div className="text-xs font-black italic text-slate-900">
                    {e.label}
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">
                    {e.sub}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 font-black italic text-[10px] text-blue-600 hover:bg-blue-50 rounded-xl uppercase"
                >
                  <Download className="w-3 h-3" /> CSV
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Push New Items */}
        <Card className="md:col-span-2 rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
          <CardHeader className="p-7 border-b border-slate-50">
            <CardTitle className="font-black italic tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Plus className="w-5 h-5 text-indigo-600" />
              </div>
              Push New Item to Core
            </CardTitle>
          </CardHeader>
          <CardContent className="p-7">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[
                { label: "SKU", id: "sku", ph: "SKU-XXXX" },
                { label: "Name", id: "name", ph: "Product Name" },
                { label: "Category ID", id: "cat", ph: "CAT-XXXX" },
                { label: "Initial Qty", id: "qty", ph: "0" },
              ].map((f) => (
                <div key={f.id} className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest">
                    {f.label}
                  </Label>
                  <Input
                    placeholder={f.ph}
                    className="h-11 rounded-xl font-bold border-slate-200"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2 mb-5">
              <Label className="text-[9px] font-black uppercase tracking-widest">
                Reason / Notes *
              </Label>
              <Textarea
                className="rounded-xl font-bold resize-none border-slate-200"
                rows={2}
                placeholder="Reason for adding this item to the inventory..."
              />
            </div>
            <Button
              className={cn(
                "h-12 px-8 rounded-xl font-black italic uppercase text-xs tracking-widest gap-2",
                canWrite ? "bg-slate-900" : "bg-amber-600 hover:bg-amber-700",
              )}
            >
              {canWrite ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Push to Core
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit for Approval
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
