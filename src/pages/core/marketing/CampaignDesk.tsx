import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";

const campaigns = [
  { id: "CMP-220", name: "Q2 Launch", owner: "Jessie Allan", budget: "$60k", status: "PENDING" },
  { id: "CMP-218", name: "Retail Push", owner: "Ava Reynolds", budget: "$40k", status: "IN_PROGRESS" },
  { id: "CMP-211", name: "Partner Summit", owner: "Henry Pham", budget: "$90k", status: "APPROVED" },
];

export default function CampaignDesk() {
  const [search, setSearch] = useState("");
  const filtered = campaigns.filter((c) =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        subtitle="Create campaigns with HOD approval and budget validation."
        primaryAction={<Button>New Campaign</Button>}
        secondaryActions={
          <Input
            placeholder="Search campaigns"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Campaign pipeline" description="Creation flow with approval routing.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Campaign</th>
                <th className="p-3 text-left">Owner</th>
                <th className="p-3 text-left">Budget</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-muted-foreground">{c.owner}</td>
                  <td className="p-3 text-muted-foreground">{c.budget}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={c.status} />
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
