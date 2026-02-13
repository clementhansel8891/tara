import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { useSession } from "@/core/security/session";
import { auditLedger } from "@/core/logging/auditLedger";
import { logService } from "@/core/services/finance/logService";

type AuditSource = "ALL" | "AUDIT_LEDGER" | "FINANCE_LOG";

type AuditRow = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  source: AuditSource;
};

export default function AuditVault() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [source, setSource] = useState<AuditSource>("ALL");

  const rows = useMemo(() => {
    const ledgerRows: AuditRow[] = auditLedger.list(session.tenantId).map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      actor: entry.actorId,
      action: entry.action,
      detail: entry.entityType,
      source: "AUDIT_LEDGER",
    }));

    const financeRows: AuditRow[] = logService.listLogs(session.tenantId).map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      actor: entry.userId,
      action: entry.action,
      detail: entry.details,
      source: "FINANCE_LOG",
    }));

    return [...ledgerRows, ...financeRows].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [session.tenantId]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesSource = source === "ALL" ? true : row.source === source;
        const haystack = `${row.action} ${row.actor} ${row.detail}`.toLowerCase();
        const matchesSearch = search ? haystack.includes(search.toLowerCase()) : true;
        const matchesFrom = dateFrom ? new Date(row.timestamp) >= new Date(dateFrom) : true;
        const matchesTo = dateTo ? new Date(row.timestamp) <= new Date(dateTo) : true;
        return matchesSource && matchesSearch && matchesFrom && matchesTo;
      }),
    [rows, source, search, dateFrom, dateTo],
  );

  const summary = useMemo(
    () => ({
      total: filteredRows.length,
      uniqueActors: new Set(filteredRows.map((row) => row.actor)).size,
      financeLogs: filteredRows.filter((row) => row.source === "FINANCE_LOG").length,
      auditEntries: filteredRows.filter((row) => row.source === "AUDIT_LEDGER").length,
    }),
    [filteredRows],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Vault"
        subtitle="Unified audit timeline from immutable ledger events and finance operation logs."
      />

      <WorkspacePanel title="Audit Summary" description="Scope and activity coverage for current filter set.">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total events</p>
            <p className="text-lg font-semibold">{summary.total}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Unique actors</p>
            <p className="text-lg font-semibold">{summary.uniqueActors}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Finance logs</p>
            <p className="text-lg font-semibold">{summary.financeLogs}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Audit ledger</p>
            <p className="text-lg font-semibold">{summary.auditEntries}</p>
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel title="Filters" description="Narrow audit entries by source, actor, action, and date range.">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={source} onValueChange={(value) => setSource(value as AuditSource)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All sources</SelectItem>
              <SelectItem value="AUDIT_LEDGER">Audit ledger</SelectItem>
              <SelectItem value="FINANCE_LOG">Finance logs</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search action, actor, detail"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[220px]"
          />
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          <Button
            onClick={() => {
              setSearch("");
              setDateFrom("");
              setDateTo("");
              setSource("ALL");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </WorkspacePanel>

      <WorkspacePanel title="Audit Events" description="Trace every finance mutation and decision event.">
        <DataTableShell total={filteredRows.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Timestamp</th>
                <th className="p-3 text-left">Actor</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Detail</th>
                <th className="p-3 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3">{new Date(row.timestamp).toLocaleString()}</td>
                  <td className="p-3 font-medium">{row.actor}</td>
                  <td className="p-3 text-muted-foreground">{row.action}</td>
                  <td className="p-3 text-muted-foreground">{row.detail || "-"}</td>
                  <td className="p-3">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>
    </div>
  );
}
