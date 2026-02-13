import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { Progress } from "@/components/ui/progress";

const metrics = [
  { id: "mt-1", campaign: "Q2 Launch", leads: 240, cost: 62000, roi: 180 },
  { id: "mt-2", campaign: "Retail Push", leads: 190, cost: 41000, roi: 140 },
  { id: "mt-3", campaign: "Partner Summit", leads: 120, cost: 35000, roi: 210 },
];

export default function MarketingAnalytics() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      metrics.filter((m) =>
        search ? m.campaign.toLowerCase().includes(search.toLowerCase()) : true,
      ),
    [search],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Campaign performance and lead outcomes."
        secondaryActions={
          <Input
            placeholder="Search campaign"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Performance" description="ROI and lead outcomes by campaign.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Campaign</th>
                <th className="p-3 text-left">Leads</th>
                <th className="p-3 text-left">Spend</th>
                <th className="p-3 text-left">ROI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3 font-medium">{m.campaign}</td>
                  <td className="p-3 text-muted-foreground">{m.leads}</td>
                  <td className="p-3 text-muted-foreground">${m.cost.toLocaleString()}</td>
                  <td className="p-3">
                    <Progress value={Math.min(m.roi / 3, 100)} className="h-2" />
                    <p className="mt-1 text-xs text-muted-foreground">{m.roi}% ROI</p>
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
