import React, { useState, useMemo } from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import {
  FileText,
  ShieldCheck,
  Download,
  ExternalLink,
  Search,
  Filter,
  Lock,
  Fingerprint,
  AlertTriangle,
  CheckCircle2,
  History,
  ChevronRight,
  Database,
  Key,
  Calendar,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const AUDIT_LOGS = [
  {
    time: "2026-02-15 14:22:10",
    type: "FISCAL_VOID",
    actor: "Siti Rahma (ID: 009)",
    impact: "-Rp 50,000",
    hash: "8f2d...b41a",
    status: "VERIFIED",
  },
  {
    time: "2026-02-15 13:05:44",
    type: "PERMISSION_CHANGE",
    actor: "Andi Wijaya (ID: ADMIN)",
    impact: "ELEVATED",
    hash: "9a31...fe02",
    status: "VERIFIED",
  },
  {
    time: "2026-02-15 11:45:12",
    type: "MANUAL_ADJUST",
    actor: "System Agent (Auto)",
    impact: "INV_SYNC",
    hash: "7c12...da99",
    status: "VERIFIED",
  },
  {
    time: "2026-02-15 09:00:01",
    type: "STORE_OPEN",
    actor: "Budi Santoso (ID: 001)",
    impact: "NORMAL",
    hash: "2e44...cc81",
    status: "VERIFIED",
  },
  {
    time: "2026-02-14 17:48:33",
    type: "DISCOUNT_APPLIED",
    actor: "Dewi Kusuma (ID: 012)",
    impact: "-Rp 125,000",
    hash: "1b3a...c209",
    status: "VERIFIED",
  },
  {
    time: "2026-02-14 16:10:05",
    type: "REFUND_ISSUED",
    actor: "Reza Pratama (ID: 005)",
    impact: "-Rp 299,000",
    hash: "4d5e...a901",
    status: "VERIFIED",
  },
  {
    time: "2026-02-14 14:00:00",
    type: "STORE_CLOSE",
    actor: "Budi Santoso (ID: 001)",
    impact: "NORMAL",
    hash: "6c7f...b123",
    status: "VERIFIED",
  },
];

const eventColors: Record<string, string> = {
  FISCAL_VOID: "text-red-600 bg-red-50",
  PERMISSION_CHANGE: "text-amber-700 bg-amber-50",
  MANUAL_ADJUST: "text-blue-700 bg-blue-50",
  STORE_OPEN: "text-emerald-700 bg-emerald-50",
  STORE_CLOSE: "text-slate-700 bg-slate-100",
  DISCOUNT_APPLIED: "text-indigo-700 bg-indigo-50",
  REFUND_ISSUED: "text-rose-700 bg-rose-50",
};

const ComplianceAuditLedger = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return AUDIT_LOGS;
    const q = searchTerm.toLowerCase();
    return AUDIT_LOGS.filter(
      (l) =>
        l.type.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        l.hash.toLowerCase().includes(q) ||
        l.time.includes(q),
    );
  }, [searchTerm]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-white shrink-0 flex items-center justify-between">
        <PageHeader
          title="Compliance & Audit Ledger"
          subtitle="Immutable fiscal record-keeping • Regulatory event log • Chain of custody"
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl px-4 font-black italic border-slate-200 text-xs uppercase tracking-widest gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </Button>
          <Button className="h-11 px-5 rounded-xl bg-slate-900 text-white font-black italic uppercase text-xs tracking-widest gap-2">
            <ExternalLink className="w-3.5 h-3.5" /> Verify Chain
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-slate-50/50">
        <div className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10">
          {/* Integrity Header */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Card className="lg:col-span-3 bg-slate-900 border-none shadow-2xl rounded-[2.5rem] overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck className="w-36 h-36 text-blue-400" />
              </div>
              <CardContent className="p-10 lg:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10 text-white">
                <div className="space-y-5 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Fingerprint className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 italic">
                        Global Integrity State
                      </div>
                      <div className="text-2xl font-black italic tracking-tighter">
                        SECURED & SEALED
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">
                      Current Block Hash
                    </div>
                    <code className="bg-white/5 px-4 py-2 rounded-xl text-indigo-400 font-mono text-xs border border-white/10 block w-fit">
                      zenvix-prod-0x8F2DA4C7B41A9902EDC
                    </code>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase italic">
                    Last reconciliation:{" "}
                    <span className="text-slate-400">14 minutes ago</span> •{" "}
                    {AUDIT_LOGS.length} blocks sealed
                  </div>
                </div>
                <div className="w-full md:w-56 bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4 text-center shrink-0">
                  <div className="text-5xl font-black italic tracking-tighter text-blue-400">
                    100%
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Audit Score
                  </div>
                  <Progress value={100} className="h-2 bg-slate-800" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-xl border-2 border-slate-100 rounded-[2rem]">
                <CardHeader className="p-6 pb-0">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                    Anomaly Watch
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black italic text-slate-900">
                        Zero Flags
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">
                        No suspicious voids today
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-slate-100" />
                  <div className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                    AI scanner processed 1.2K transaction blocks with no
                    deviation.
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 border-indigo-50 bg-indigo-50/20 rounded-[2rem] group cursor-pointer hover:bg-indigo-50 transition-all">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm mx-auto group-hover:scale-110 transition-transform">
                    <Database className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-black italic text-slate-900">
                    Cold Storage Vault
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                    Logs older than 90 days
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex gap-3 bg-white rounded-[2rem] p-3 border border-slate-100 shadow-lg">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <Input
                className="pl-12 h-12 bg-slate-50 border-none rounded-xl text-sm font-bold italic placeholder:text-slate-300 focus-visible:ring-blue-500"
                placeholder="Search Timestamp, Event Type, Actor ID, or Hash Signature..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="h-12 px-5 rounded-xl gap-2 font-black italic border-slate-100 hover:bg-slate-50 uppercase text-[10px] tracking-widest"
            >
              <Calendar className="w-4 h-4" /> Range
            </Button>
            <Button
              variant="outline"
              className="h-12 px-5 rounded-xl gap-2 font-black italic border-slate-100 hover:bg-slate-50 uppercase text-[10px] tracking-widest"
            >
              <Filter className="w-4 h-4" /> Types
            </Button>
          </div>

          {/* Audit Log Table */}
          <DataTableShell
            title="Immutable Audit Stream"
            subtitle="Non-repudiable logs backed by Zenvix Signature Hub"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "Temporal Context",
                    "Event Typology",
                    "Operational Actor",
                    "Delta / Impact",
                    "Integrity Seal",
                    "Block ID",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className={`px-8 py-5 ${i === 4 ? "text-center" : i === 5 ? "text-right" : "text-left"} text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-8 py-20 text-center text-[10px] font-black italic uppercase tracking-widest text-slate-400"
                    >
                      No matching log entries
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, i) => (
                    <tr
                      key={i}
                      className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none cursor-pointer"
                    >
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                            <History className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-xs font-bold text-slate-900 font-mono tracking-tight">
                            {log.time}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <Badge
                          className={`border-none text-[8px] font-black italic tracking-widest px-3 py-1 ${eventColors[log.type] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {log.type}
                        </Badge>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-xs font-black italic text-slate-700">
                          {log.actor}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div
                          className={`text-xs font-black italic ${log.impact.startsWith("-") ? "text-red-500" : log.impact === "ELEVATED" ? "text-amber-600" : "text-slate-700"}`}
                        >
                          {log.impact}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Lock className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] font-black italic text-emerald-600 uppercase">
                            Sealed
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-mono text-[10px] text-slate-400">
                        {log.hash}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[10px] font-black italic text-slate-400 uppercase tracking-widest">
                {filteredLogs.length} records visible
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="font-black italic text-[10px] uppercase text-blue-600 hover:bg-blue-50 rounded-xl gap-2"
              >
                Verify All Historical Blocks{" "}
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </DataTableShell>
        </div>
      </div>
    </div>
  );
};

export default ComplianceAuditLedger;
