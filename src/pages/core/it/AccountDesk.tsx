import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSession } from "@/core/security/session";
import { procurementService } from "@/core/services/procurement/procurementService";

const accounts = [
  { id: "EMP-00112", user: "Ava Reynolds", action: "Create", status: "PENDING", dept: "Finance" },
  { id: "EMP-00145", user: "Henry Pham", action: "Deactivate", status: "IN_PROGRESS", dept: "Facilities" },
  { id: "EMP-00033", user: "Jessie Allan", action: "Create", status: "APPROVED", dept: "Operations" },
];

export default function AccountDesk() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [autoProvision, setAutoProvision] = useState(true);
  const [, setVersion] = useState(0);
  const supplierAccessQueue = procurementService.listSupplierAccessProvisioning(session.tenantId);

  const filtered = accounts.filter((acc) =>
    search ? acc.user.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        subtitle="Create/deactivate accounts triggered by HR with audit-first routing."
        primaryAction={<Button>New Account</Button>}
        secondaryActions={
          <Input
            placeholder="Search users"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Provisioning queue" description="Account actions from HR and Admin.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((acc) => (
                <tr key={acc.id} className="border-t">
                  <td className="p-3 font-medium">{acc.user}</td>
                  <td className="p-3 text-muted-foreground">{acc.action}</td>
                  <td className="p-3 text-muted-foreground">{acc.dept}</td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={acc.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <WorkspacePanel
        title="Supplier portal provisioning"
        description="Procurement-originated supplier access requests."
      >
        <div className="space-y-3 text-sm">
          {supplierAccessQueue.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-muted-foreground">
              No supplier provisioning requests from Procurement.
            </p>
          ) : (
            supplierAccessQueue.slice(0, 8).map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-foreground">
                    Supplier {request.supplierId} / {request.supplierBranchId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Scope: {request.portalScope} | Status: {request.status}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={request.status === "PROVISIONED"}
                  onClick={() => {
                    procurementService.updateSupplierAccessProvisioningStatus(
                      session.tenantId,
                      session,
                      request.id,
                      "PROVISIONED",
                    );
                    setVersion((prev) => prev + 1);
                  }}
                >
                  Mark provisioned
                </Button>
              </div>
            ))
          )}
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        title="Automation"
        description="Sync provisioning with HR hire/terminate events and approvals."
      >
        <div className="flex items-center gap-3">
          <Switch checked={autoProvision} onCheckedChange={setAutoProvision} id="auto-provision" />
          <Label htmlFor="auto-provision">Auto-provision from HR Hire with IT approval</Label>
        </div>
      </WorkspacePanel>
    </div>
  );
}
