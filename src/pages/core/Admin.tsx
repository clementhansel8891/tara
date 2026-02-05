import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/core/ui/PageShell";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { AlertTriangle, Database, KeyRound, ShieldCheck } from "lucide-react";

const tenants = [
  { id: "ten-1", name: "Apex Hospitality", status: "Active", users: "142 users" },
  { id: "ten-2", name: "Northline Group", status: "Active", users: "88 users" },
  { id: "ten-3", name: "Zenith Partners", status: "Suspended", users: "23 users" },
];

const systemControls = [
  { id: "sys-1", title: "Global MFA enforcement", status: "Enabled" },
  { id: "sys-2", title: "Session timeout policy", status: "30 minutes" },
  { id: "sys-3", title: "Data retention window", status: "365 days" },
];

const auditLogs = [
  {
    id: "log-1",
    action: "Tenant access updated",
    detail: "Zenith Partners moved to suspended",
    time: "Today, 09:12",
  },
  {
    id: "log-2",
    action: "API key rotated",
    detail: "Finance exports integration",
    time: "Yesterday, 21:30",
  },
  {
    id: "log-3",
    action: "Security policy override",
    detail: "Emergency access granted for 2 hours",
    time: "Jan 30, 2026",
  },
];

export default function CoreAdmin() {
  return (
    <PageShell
      header={
        <PageHeader
          title="Platform Administration"
          subtitle="Super-admin controls for tenants, security, and platform governance."
          primaryAction={<Button>Invite admin</Button>}
          secondaryActions={<Button variant="outline">Generate audit report</Button>}
        />
      }
    >
      <div className="space-y-6">
        <WorkspacePanel
          title="Tenant management"
          description="Manage tenant access, billing status, and operational visibility."
        >
          <div className="space-y-3">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{tenant.name}</p>
                  <p className="text-xs text-muted-foreground">{tenant.users}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{tenant.status}</Badge>
                  <Button size="sm" variant="outline">
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <WorkspacePanel
            title="System-level controls"
            description="Platform-wide security and governance settings."
          >
            <div className="space-y-4">
              {systemControls.map((control) => (
                <div key={control.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">{control.title}</p>
                  </div>
                  <Badge variant="outline">{control.status}</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Configure advanced access policies
                </div>
                <Button size="sm" variant="outline">
                  Open
                </Button>
              </div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Platform audit & logs"
            description="Privileged actions and system activity."
          >
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-foreground">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.detail}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{log.time}</p>
                </div>
              ))}
              <Button variant="outline" size="sm">
                View full audit trail
              </Button>
            </div>
          </WorkspacePanel>
        </div>

        <WorkspacePanel
          title="Dangerous actions"
          description="Restricted actions for emergency use only."
        >
          <div className="space-y-3">
            {[
              "Disable all tenant access",
              "Rotate global encryption keys",
              "Purge audit logs",
            ].map((action) => (
              <div key={action} className="flex items-center justify-between rounded-lg border border-dashed p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  {action}
                </div>
                <Button size="sm" variant="outline" disabled>
                  Disabled
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Emergency actions require elevated approval.
              </div>
              <Button size="sm" variant="outline" disabled>
                Request access
              </Button>
            </div>
          </div>
        </WorkspacePanel>
      </div>
    </PageShell>
  );
}
