import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";

const opportunities = [
  { id: "OP-230", name: "Acme Retail Expansion", value: "$480k", stage: "Proposal", status: "PENDING" },
  { id: "OP-221", name: "Northline Upgrade", value: "$310k", stage: "Negotiation", status: "IN_PROGRESS" },
  { id: "OP-219", name: "Zenith Rollout", value: "$910k", stage: "Committed", status: "APPROVED" },
];

export default function OpportunityDesk() {
  const [search, setSearch] = useState("");
  const filtered = opportunities.filter((op) =>
    search ? op.name.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        subtitle="Track deals with approval for large opportunities."
        primaryAction={<Button>New Opportunity</Button>}
        secondaryActions={
          <Input
            placeholder="Search opportunities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Deal board" description="Opportunities with value thresholds for approvals.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Value</th>
                <th className="p-3 text-left">Stage</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((op) => (
                <tr key={op.id} className="border-t">
                  <td className="p-3 font-medium">{op.name}</td>
                  <td className="p-3 text-muted-foreground">{op.value}</td>
                  <td className="p-3 text-muted-foreground">{op.stage}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={op.status} />
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
