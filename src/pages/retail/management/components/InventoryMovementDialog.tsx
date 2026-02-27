import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownToLine, Lock, Truck, Send, Plus, Trash2 } from "lucide-react";
import type { RetailStore } from "@/core/types/retail/retail";
import { MOVEMENT_META, type MovementType } from "./movementMeta";

export type MovementLine = {
  id: string;
  sku: string;
  name: string;
  available?: number;
  qty: number;
  note?: string;
};

export type MovementPayload = {
  lines: MovementLine[];
  ref: string;
  reason: string;
  uom: string;
  expectedDate?: string;
  destinationStoreId?: string;
};

interface Props {
  type: MovementType;
  open: boolean;
  onClose: () => void;
  stores: RetailStore[];
  selectedStoreId: string;
  items: Array<{ id: string; sku: string; name: string; available?: number }>;
  onSubmit: (data: MovementPayload) => void;
}

export const InventoryMovementDialog: React.FC<Props> = ({
  type,
  open,
  onClose,
  stores,
  selectedStoreId,
  items,
  onSubmit,
}) => {
  const [qty, setQty] = useState("");
  const [ref, setRef] = useState("");
  const [reason, setReason] = useState("");
  const [uom, setUom] = useState("units");
  const [expectedDate, setExpectedDate] = useState("");
  const [destinationStoreId, setDestinationStoreId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLines, setSelectedLines] = useState<MovementLine[]>([]);

  const meta = MOVEMENT_META[type];
  const destinationOptions = useMemo(
    () => stores.filter((s) => s.id !== selectedStoreId),
    [stores, selectedStoreId],
  );

  const requiresDestination = type === "transfer_out";
  const validReason = reason.trim().length >= 5;
  const validDestination = !requiresDestination || !!destinationStoreId;
  const validLines = selectedLines.length > 0;
  const valid =
    validReason &&
    validLines &&
    validDestination &&
    (!!expectedDate || meta.dir === "out");

  const handleSubmit = () => {
    if (!valid) return;
    onSubmit({
      lines: selectedLines,
      ref,
      reason,
      uom,
      expectedDate: expectedDate || undefined,
      destinationStoreId: destinationStoreId || undefined,
    });
    setSelectedLines([]);
    setRef("");
    setReason("");
    setExpectedDate("");
    setDestinationStoreId("");
    setUom("units");
    onClose();
  };

  const addLine = (item: { id: string; sku: string; name: string; available?: number }) => {
    setSelectedLines((prev) => {
      if (prev.find((l) => l.id === item.id)) return prev;
      return [...prev, { ...item, qty: Math.max(1, Number(qty) || 1), note: "" }];
    });
    setQty("");
  };

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q),
    );
  }, [items, search]);

  const updateLine = (id: string, changes: Partial<MovementLine>) => {
    setSelectedLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...changes } : l)),
    );
  };

  const removeLine = (id: string) => {
    setSelectedLines((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl rounded-[2rem] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div
            className={`w-12 h-12 rounded-2xl bg-${meta.color}-50 flex items-center justify-center mb-4`}
          >
            {meta.dir === "in" ? (
              <ArrowDownToLine className={`w-6 h-6 text-${meta.color}-600`} />
            ) : (
              <Truck className={`w-6 h-6 text-${meta.color}-600`} />
            )}
          </div>
          <DialogTitle className="text-xl font-black italic tracking-tighter">
            {meta.label}
          </DialogTitle>
          <DialogDescription className="font-bold italic text-xs uppercase tracking-widest">
            Requests are routed for approval before execution.
          </DialogDescription>
        </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Search SKU / Name
            </Label>
            <Input
              placeholder="Scan or type SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl font-bold"
            />
          </div>

          <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-100 p-3 space-y-2 bg-slate-50">
            {filteredItems.slice(0, 12).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white rounded-xl px-4 py-2 border border-slate-200 shadow-sm"
              >
                <div>
                  <div className="font-black text-sm">{item.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    {item.sku} • ATS {item.available ?? "N/A"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={qty}
                    placeholder="Qty"
                    onChange={(e) => setQty(e.target.value)}
                    className="w-20 h-10 rounded-xl font-bold"
                  />
                  <Button
                    size="sm"
                    className="rounded-xl font-black text-xs"
                    onClick={() => addLine(item)}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="text-xs text-slate-400 font-bold italic px-1">
                No matching SKU
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Movement Lines
            </Label>
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-12 bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-4 py-2">
                <div className="col-span-1">#</div>
                <div className="col-span-2">SKU</div>
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Availability</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2 text-right">Note</div>
              </div>
              <div className="divide-y divide-slate-100 bg-white">
                {selectedLines.length === 0 && (
                  <div className="px-4 py-3 text-xs text-slate-400 font-bold italic">
                    No items selected. Add items above.
                  </div>
                )}
                {selectedLines.map((line, idx) => (
                  <div
                    key={line.id}
                    className="grid grid-cols-12 items-center px-4 py-3 text-sm gap-2"
                  >
                    <div className="col-span-1 text-[12px] font-black text-slate-500">
                      {idx + 1}
                    </div>
                    <div className="col-span-2 text-[12px] font-mono text-slate-600">
                      {line.sku}
                    </div>
                    <div className="col-span-3">
                      <div className="font-black">{line.name}</div>
                    </div>
                    <div className="col-span-2 text-[12px] font-bold text-slate-600">
                      {line.available ?? "—"}
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={line.qty}
                        onChange={(e) =>
                          updateLine(line.id, {
                            qty: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="h-10 rounded-xl font-bold"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <Input
                        placeholder="Note (optional)"
                        value={line.note ?? ""}
                        onChange={(e) =>
                          updateLine(line.id, { note: e.target.value })
                        }
                        className="h-10 rounded-xl font-bold"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => removeLine(line.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                UOM
              </Label>
              <Select value={uom} onValueChange={setUom}>
                <SelectTrigger className="h-12 rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["units", "boxes", "cases"].map((u) => (
                    <SelectItem key={u} value={u} className="font-bold">
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Reference No.
              </Label>
              <Input
                placeholder="PO-XXXX / TF-XXXX"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className="h-12 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Expected Date {meta.dir === "in" ? "*" : "(optional)"}
              </Label>
              <Input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="h-12 rounded-xl font-bold"
              />
            </div>
          </div>

          {requiresDestination && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                Destination Store *
              </Label>
              <Select
                value={destinationStoreId}
                onValueChange={setDestinationStoreId}
              >
                <SelectTrigger className="h-12 rounded-xl font-bold">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {destinationOptions.map((s) => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      className="font-bold italic"
                    >
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest">
              Reason * (min 5 chars)
            </Label>
            <Textarea
              placeholder="State the operational reason for this action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-xl font-bold resize-none"
              rows={3}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[11px] font-bold italic text-amber-700 flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            Requests are routed for approval. Execution happens after approval (e.g., PO flows into Procurement).
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl font-black italic"
          >
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={handleSubmit}
            className="rounded-xl font-black italic gap-2 bg-amber-600 hover:bg-amber-700"
          >
            <Send className="w-4 h-4" /> Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { MOVEMENT_META };
