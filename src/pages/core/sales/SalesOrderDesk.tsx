import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";

const orders = [
  { id: "SO-8801", customer: "Acme Retail", value: "$320k", status: "PENDING", handoff: "Finance invoicing" },
  { id: "SO-8799", customer: "Northline Group", value: "$190k", status: "IN_PROGRESS", handoff: "Finance invoicing" },
  { id: "SO-8788", customer: "Zenith Partners", value: "$560k", status: "APPROVED", handoff: "Finance invoicing" },
];

export default function SalesOrderDesk() {
  const [search, setSearch] = useState("");
  const filtered = orders.filter((order) =>
    search ? order.customer.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Orders"
        subtitle="Create sales orders and hand off to Finance for invoicing."
        primaryAction={<Button>Create Sales Order</Button>}
        secondaryActions={
          <Input
            placeholder="Search orders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Order queue" description="Orders awaiting approval and invoicing.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Value</th>
                <th className="p-3 text-left">Handoff</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-3 font-medium">{order.id}</td>
                  <td className="p-3 text-muted-foreground">{order.customer}</td>
                  <td className="p-3 text-muted-foreground">{order.value}</td>
                  <td className="p-3 text-muted-foreground">{order.handoff}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={order.status} />
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
