import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageShell } from "@/core/ui/PageShell";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { ClipboardList, PackageSearch, UserCheck } from "lucide-react";

const purchaseRequests = [
  {
    id: "PR-02491",
    requester: "Jessie Allan",
    department: "Operations",
    vendor: "Unified Supply",
    amount: "$18,450",
    status: "Pending approval",
  },
  {
    id: "PR-02490",
    requester: "Henry Pham",
    department: "Facilities",
    vendor: "Nordic Systems",
    amount: "$6,120",
    status: "In review",
  },
  {
    id: "PR-02486",
    requester: "Ava Reynolds",
    department: "Finance",
    vendor: "Delta Office",
    amount: "$3,980",
    status: "Approved",
  },
];

const vendors = [
  {
    id: "ven-1",
    name: "Unified Supply Co.",
    category: "Office & Consumables",
    rating: "4.7",
    status: "Preferred",
  },
  {
    id: "ven-2",
    name: "Nordic Systems",
    category: "IT & Hardware",
    rating: "4.3",
    status: "Approved",
  },
  {
    id: "ven-3",
    name: "Delta Office",
    category: "Facilities",
    rating: "4.5",
    status: "Approved",
  },
];

const approvals = [
  {
    id: "appr-1",
    title: "PR-02491 · Unified Supply",
    detail: "Awaiting Finance approval",
    due: "Due today",
  },
  {
    id: "appr-2",
    title: "PR-02490 · Nordic Systems",
    detail: "Needs Procurement validation",
    due: "Due tomorrow",
  },
  {
    id: "appr-3",
    title: "PR-02482 · Delta Office",
    detail: "Pending budget confirmation",
    due: "Due in 3 days",
  },
];

export default function CorePurchasing() {
  return (
    <PageShell
      header={
        <PageHeader
          title="Purchasing"
          subtitle="Coordinate requests, approvals, and vendor performance."
          primaryAction={<Button>New Purchase Request</Button>}
          secondaryActions={<Button variant="outline">Export</Button>}
        />
      }
      right={
        <div className="p-4">
          <WorkspacePanel
            title="Approval queue"
            description="Requests that require your attention."
          >
            <div className="space-y-4">
              {approvals.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <Badge variant="outline">{item.due}</Badge>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                    <Button size="sm">Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          </WorkspacePanel>
        </div>
      }
    >
      <div className="space-y-6">
        <WorkspacePanel
          title="Purchase requests"
          description="Track incoming requests and current approval status."
        >
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.requester}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.department}
                    </TableCell>
                    <TableCell>{request.vendor}</TableCell>
                    <TableCell>{request.amount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{request.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Vendor management"
          description="Preferred suppliers and performance tracking."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">{vendor.category}</p>
                  </div>
                  <Badge variant="outline">{vendor.status}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Rating {vendor.rating}
                  </div>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <WorkspacePanel
            title="Open sourcing"
            description="Requests awaiting vendor assignment."
          >
            <div className="space-y-4">
              {[
                { id: "PR-02488", detail: "Facilities equipment renewal" },
                { id: "PR-02484", detail: "Regional packaging supplies" },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <PackageSearch className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.id}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Assign vendor
                  </Button>
                </div>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Approval coverage"
            description="Governance status for the current cycle."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Approvals on time</p>
                    <p className="text-xs text-muted-foreground">
                      92% of requests this month
                    </p>
                  </div>
                </div>
                <Badge variant="outline">On track</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Escalations open</p>
                    <p className="text-xs text-muted-foreground">
                      4 approvals pending escalation
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Attention</Badge>
              </div>
            </div>
          </WorkspacePanel>
        </div>
      </div>
    </PageShell>
  );
}
