import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { Badge } from "@/components/ui/badge";

const devices = [
  { id: "DEV-3301", type: "Laptop", location: "HQ-1", owner: "Ava Reynolds", status: "Active" },
  { id: "DEV-3302", type: "Scanner", location: "Warehouse-2", owner: "Operations", status: "Assigned" },
  { id: "DEV-3298", type: "Router", location: "Branch-5", owner: "Network", status: "Monitoring" },
];

export default function DeviceDesk() {
  const [search, setSearch] = useState("");
  const filtered = devices.filter((dev) =>
    search ? dev.id.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Devices"
        subtitle="Assign devices to locations, keep LAN-first inventory in sync."
        primaryAction={<Button>Assign Device</Button>}
        secondaryActions={
          <Input
            placeholder="Search devices"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Device map" description="Physical/logical asset mapping with owners.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Device</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Owner</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((dev) => (
                <tr key={dev.id} className="border-t">
                  <td className="p-3 font-medium">{dev.id}</td>
                  <td className="p-3 text-muted-foreground">{dev.type}</td>
                  <td className="p-3 text-muted-foreground">{dev.location}</td>
                  <td className="p-3 text-muted-foreground">{dev.owner}</td>
                  <td className="p-3">
                    <Badge variant="secondary">{dev.status}</Badge>
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
