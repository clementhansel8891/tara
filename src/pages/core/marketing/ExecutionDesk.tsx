import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { Badge } from "@/components/ui/badge";

const executions = [
  { id: "EX-1201", audience: "Retail SMB", channel: "Email", status: "Scheduled" },
  { id: "EX-1199", audience: "Enterprise CXOs", channel: "Webinar", status: "Running" },
  { id: "EX-1195", audience: "Partners", channel: "Ads", status: "Completed" },
];

export default function ExecutionDesk() {
  const [search, setSearch] = useState("");
  const filtered = executions.filter((ex) =>
    search ? ex.audience.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaign Execution"
        subtitle="Coordinate audience, content, and execution with automatic lead handoff to Sales."
        primaryAction={<Button>Schedule Execution</Button>}
        secondaryActions={
          <Input
            placeholder="Search execution"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Execution runs" description="Live and scheduled executions.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Audience</th>
                <th className="p-3 text-left">Channel</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex) => (
                <tr key={ex.id} className="border-t">
                  <td className="p-3 font-medium">{ex.audience}</td>
                  <td className="p-3 text-muted-foreground">{ex.channel}</td>
                  <td className="p-3">
                    <Badge variant="outline">{ex.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>
    </div>
  );
}
