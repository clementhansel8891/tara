import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";

const leads = [
  { id: "LD-101", name: "Acme Retail", owner: "Jessie Allan", value: "$120k", status: "PENDING" },
  { id: "LD-099", name: "Northline Group", owner: "Ava Reynolds", value: "$80k", status: "IN_PROGRESS" },
  { id: "LD-095", name: "Zenith Partners", owner: "Henry Pham", value: "$200k", status: "APPROVED" },
];

export default function LeadDesk() {
  const [search, setSearch] = useState("");
  const filtered = leads.filter((lead) =>
    search ? lead.name.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        subtitle="Create and qualify leads; escalate large deals to HOD."
        primaryAction={<Button>New Lead</Button>}
        secondaryActions={
          <Input
            placeholder="Search leads"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Lead queue" description="Leads with qualification and approvals.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Lead</th>
                <th className="p-3 text-left">Owner</th>
                <th className="p-3 text-left">Potential</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-t">
                  <td className="p-3 font-medium">{lead.name}</td>
                  <td className="p-3 text-muted-foreground">{lead.owner}</td>
                  <td className="p-3 text-muted-foreground">{lead.value}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={lead.status} />
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
