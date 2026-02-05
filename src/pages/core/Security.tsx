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
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCog,
} from "lucide-react";

const roleRows = [
  {
    id: "role-1",
    name: "Platform Administrator",
    description: "Full access across tenants, security policies, and billing.",
    users: 8,
    updated: "2 days ago",
  },
  {
    id: "role-2",
    name: "Operations Manager",
    description: "Workflow approvals, reporting, and escalation access.",
    users: 24,
    updated: "1 week ago",
  },
  {
    id: "role-3",
    name: "Compliance Officer",
    description: "Audit logs, policy reviews, and risk assessments.",
    users: 6,
    updated: "3 weeks ago",
  },
];

const auditLogs = [
  {
    id: "audit-1",
    action: "Role permissions updated",
    detail: "Finance Controller gained approval rights",
    actor: "Priya Menon",
    time: "Today, 09:18",
    status: "Reviewed",
  },
  {
    id: "audit-2",
    action: "MFA policy enforced",
    detail: "Applied to all staff with admin access",
    actor: "Security System",
    time: "Yesterday, 20:10",
    status: "Applied",
  },
  {
    id: "audit-3",
    action: "Access review completed",
    detail: "Quarterly access certification finalized",
    actor: "Daniel Cho",
    time: "Jan 28, 2026",
    status: "Completed",
  },
];

const securityAlerts = [
  {
    id: "alert-1",
    title: "Failed login threshold exceeded",
    detail: "7 failed attempts from tenant APAC-03",
    severity: "High",
    time: "12 minutes ago",
  },
  {
    id: "alert-2",
    title: "Unapproved device access",
    detail: "Endpoint blocked for policy violation",
    severity: "Medium",
    time: "45 minutes ago",
  },
  {
    id: "alert-3",
    title: "Policy exception expiring",
    detail: "Contractor access ends in 2 days",
    severity: "Low",
    time: "Today, 07:30",
  },
];

export default function CoreSecurity() {
  return (
    <PageShell
      header={
        <PageHeader
          title="Security & Access Control"
          subtitle="Enforce policies, manage roles, and monitor audit activity."
          primaryAction={
            <Button>
              <UserCog className="mr-2 h-4 w-4" />
              Manage Roles
            </Button>
          }
          secondaryActions={<Button variant="outline">Download report</Button>}
        />
      }
      right={
        <div className="p-4">
          <WorkspacePanel
            title="Security alerts"
            description="Immediate actions required to keep the platform safe."
          >
            <div className="space-y-4">
              {securityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {alert.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.detail}
                      </p>
                    </div>
                    <Badge variant="outline">{alert.severity}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {alert.time}
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
          title="Roles & permissions"
          description="Defined access roles with scoped capabilities and assigned users."
        >
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Last updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleRows.map((role) => (
                  <TableRow key={role.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.description}
                    </TableCell>
                    <TableCell>{role.users}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.updated}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </WorkspacePanel>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <WorkspacePanel
            title="Recent audit log"
            description="Policy changes and access reviews."
          >
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.detail}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Actor: {log.actor}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{log.status}</Badge>
                      <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {log.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Security posture"
            description="Compliance controls and risk status."
          >
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">MFA coverage</p>
                    <p className="text-xs text-muted-foreground">
                      96% of privileged users enrolled
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">Access reviews</p>
                    <p className="text-xs text-muted-foreground">
                      Next certification due in 12 days
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Risk exceptions</p>
                    <p className="text-xs text-muted-foreground">
                      3 open exceptions awaiting review
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </WorkspacePanel>
        </div>
      </div>
    </PageShell>
  );
}
