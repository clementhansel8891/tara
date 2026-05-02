import React from "react";
import { ArrowDownToLine, Truck, Lock, History } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MOVEMENT_META, type MovementType } from "./movementMeta";

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  sku?: string;
  qty?: number;
  reason: string;
  ts: string;
  status: "approved" | "pending" | "rejected";
};

type Props = {
  canWrite: boolean;
  auditLog: AuditEntry[];
  onMovement: (type: MovementType) => void;
};

export const MovementsTab: React.FC<Props> = ({
  canWrite,
  auditLog,
  onMovement,
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Action cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {(
          Object.entries(MOVEMENT_META) as [
            MovementType,
            (typeof MOVEMENT_META)[MovementType],
          ][]
        ).map(([type, meta]) => (
          <Card
            key={type}
            onClick={() => onMovement(type)}
            className="rounded-[2rem] border-2 border-slate-100 hover:border-blue-200 shadow-xl bg-white p-7 cursor-pointer group transition-all hover:shadow-2xl"
          >
            <div
              className={`w-14 h-14 rounded-2xl bg-${meta.color}-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
            >
              {meta.dir === "in" ? (
                <ArrowDownToLine className={`w-7 h-7 text-${meta.color}-600`} />
              ) : (
                <Truck className={`w-7 h-7 text-${meta.color}-600`} />
              )}
            </div>
            <div className="font-black italic text-base tracking-tight text-slate-900 uppercase">
              {meta.label}
            </div>
            <div
              className={`text-[10px] font-bold uppercase tracking-widest mt-1 text-${meta.color}-500 italic`}
            >
              {meta.dir === "in" ? "Inbound" : "Outbound"}
            </div>
            {!canWrite && (
              <div className="mt-3 text-[9px] font-black italic text-amber-600 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Requires Approval
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Movement audit log */}
      <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
        <CardHeader className="p-7 border-b border-slate-50">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic flex items-center gap-2">
            <History className="w-4 h-4" /> Movement Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50">
                {[
                  "Time",
                  "Actor",
                  "Action",
                  "SKU / Qty",
                  "Reason",
                  "Status",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="px-7 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(auditLog) ? auditLog : []).map((log, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-7 py-4 font-mono text-[10px] text-slate-400">
                    {log.ts}
                  </td>
                  <td className="px-7 py-4 font-black italic text-sm text-slate-700">
                    {log.actor}
                  </td>
                  <td className="px-7 py-4">
                    <Badge className="bg-slate-100 text-slate-700 border-none font-black italic text-[9px]">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-7 py-4 font-bold italic text-sm">
                    {log.sku ? `${log.sku} × ${log.qty}` : "—"}
                  </td>
                  <td className="px-7 py-4 text-[11px] text-slate-500 font-medium italic max-w-xs truncate">
                    {log.reason}
                  </td>
                  <td className="px-7 py-4">
                    <Badge
                      className={cn(
                        "border-none font-black italic text-[9px] uppercase",
                        log.status === "approved"
                          ? "bg-emerald-50 text-emerald-700"
                          : log.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700",
                      )}
                    >
                      {log.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
