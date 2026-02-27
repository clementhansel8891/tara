import React, { useRef } from "react";
import {
  ClipboardCheck,
  Edit3,
  ScanLine,
  Upload,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type OpnameEntry = {
  sku: string;
  name: string;
  expected: number;
  counted: number | "";
};

type Props = {
  storeName?: string;
  opnameActive: boolean;
  opnameEntries: OpnameEntry[];
  barcodeInput: string;
  onStart: () => void;
  onDiscard: () => void;
  onSubmit: () => void;
  onBarcodeChange: (val: string) => void;
  onBarcodeKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCountChange: (index: number, value: string) => void;
};

export const StockOpnameTab: React.FC<Props> = ({
  storeName,
  opnameActive,
  opnameEntries,
  barcodeInput,
  onStart,
  onDiscard,
  onSubmit,
  onBarcodeChange,
  onBarcodeKeyDown,
  onCountChange,
}) => {
  const barcodeRef = useRef<HTMLInputElement>(null);

  if (!opnameActive) {
    return (
      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
        <CardContent className="p-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto">
            <ClipboardCheck className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">
              Stock Opname
            </h2>
            <p className="text-sm text-slate-500 font-bold italic mt-2">
              Physical count &amp; reconciliation for{" "}
              <span className="text-slate-800">{storeName}</span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-left max-w-lg mx-auto">
            {[
              {
                icon: Edit3,
                label: "Manual Input",
                desc: "Enter counts per row",
              },
              {
                icon: ScanLine,
                label: "Barcode Scan",
                desc: "Scan to increment",
              },
              {
                icon: Upload,
                label: "CSV Import",
                desc: "Upload count sheet",
              },
            ].map((m, i) => (
              <div
                key={i}
                className="bg-slate-50 rounded-2xl p-5 text-center space-y-2"
              >
                <m.icon className="w-5 h-5 text-blue-600 mx-auto" />
                <div className="text-xs font-black italic uppercase">
                  {m.label}
                </div>
                <div className="text-[10px] text-slate-400 font-bold">
                  {m.desc}
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={onStart}
            className="h-14 px-12 rounded-2xl bg-slate-900 text-white font-black italic uppercase tracking-widest text-xs gap-2 shadow-xl"
          >
            <Zap className="w-5 h-5" /> Start Opname Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active session header */}
      <Card className="rounded-[2rem] bg-blue-600 text-white border-none shadow-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 italic">
                ACTIVE OPNAME SESSION
              </div>
              <div className="text-xl font-black italic tracking-tighter">
                {storeName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onDiscard}
              className="text-white/70 hover:text-white font-black italic text-xs uppercase"
            >
              Discard
            </Button>
            <Button
              onClick={onSubmit}
              className="bg-white text-blue-600 hover:bg-blue-50 font-black italic uppercase text-xs gap-2 rounded-xl px-5 h-10"
            >
              <CheckCircle2 className="w-4 h-4" /> Submit Count
            </Button>
          </div>
        </div>
      </Card>

      {/* Barcode input */}
      <Card className="rounded-[2rem] border-none shadow-lg bg-white p-5">
        <div className="flex items-center gap-4">
          <ScanLine className="w-5 h-5 text-blue-600 shrink-0" />
          <Input
            ref={barcodeRef}
            className="flex-1 h-12 rounded-xl font-mono font-bold border-slate-200"
            placeholder="Scan barcode here (press Enter to register)..."
            value={barcodeInput}
            onChange={(e) => onBarcodeChange(e.target.value)}
            onKeyDown={onBarcodeKeyDown}
          />
        </div>
      </Card>

      {/* Count table */}
      <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-50">
              {["SKU", "Item Name", "Expected", "Counted", "Variance"].map(
                (h, i) => (
                  <th
                    key={i}
                    className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {opnameEntries.map((entry, i) => {
              const variance =
                entry.counted !== ""
                  ? Number(entry.counted) - entry.expected
                  : null;
              return (
                <tr
                  key={i}
                  className="border-b border-slate-50 last:border-none"
                >
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-500 font-bold">
                    {entry.sku}
                  </td>
                  <td className="px-6 py-4 font-black italic text-sm text-slate-900">
                    {entry.name}
                  </td>
                  <td className="px-6 py-4 font-bold italic text-slate-600">
                    {entry.expected}
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      type="number"
                      min="0"
                      value={entry.counted}
                      onChange={(e) => onCountChange(i, e.target.value)}
                      className="w-24 h-9 rounded-xl font-bold text-center border-slate-200"
                    />
                  </td>
                  <td className="px-6 py-4">
                    {variance !== null ? (
                      <span
                        className={cn(
                          "font-black italic text-sm",
                          variance === 0
                            ? "text-emerald-600"
                            : variance > 0
                              ? "text-blue-600"
                              : "text-red-600",
                        )}
                      >
                        {variance > 0 ? "+" : ""}
                        {variance}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-bold italic text-sm">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
