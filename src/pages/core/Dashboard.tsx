import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageShell } from "@/core/ui/PageShell";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import {
  AlertTriangle,
  ArrowUpRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  Users,
} from "lucide-react";

const kpis = [
  {
    label: "Revenue",
    value: "$2.48M",
    delta: "+6.2% vs last month",
    icon: Briefcase,
  },
  {
    label: "Active Staff",
    value: "482",
    delta: "12 on shift now",
    icon: Users,
  },
  {
    label: "Alerts",
    value: "9",
    delta: "3 high priority",
    icon: AlertTriangle,
  },
  {
    label: "Module Status",
    value: "18/20",
    delta: "2 paused modules",
    icon: ClipboardCheck,
  },
];

const activities = [
  {
    title: "Procurement approval queued",
    detail: "PO-24291 pending Finance approval",
    time: "5 minutes ago",
    status: "Pending",
  },
  {
    title: "Store compliance check passed",
    detail: "Region West audit completed",
    time: "38 minutes ago",
    status: "Completed",
  },
  {
    title: "Access role updated",
    detail: "Admin role granted to 2 staff",
    time: "2 hours ago",
    status: "Reviewed",
  },
  {
    title: "Integration sync delayed",
    detail: "Payments connector awaiting retry",
    time: "Today, 08:45",
    status: "Attention",
  },
];

const quickActions = [
  {
    title: "Review approvals",
    description: "Purchase orders and expense claims",
  },
  {
    title: "Launch incident bridge",
    description: "Create war-room and notify teams",
  },
  {
    title: "Provision new tenant",
    description: "Onboard a new organization",
  },
  {
    title: "Publish system bulletin",
    description: "Notify all users in-app",
  },
];

const complianceItems = [
  {
    label: "Access reviews",
    status: "On track",
    note: "Next review in 12 days",
    badge: "Compliant",
  },
  {
    label: "Data retention",
    status: "Requires review",
    note: "Policy update requested",
    badge: "Attention",
  },
  {
    label: "Audit logs",
    status: "Healthy",
    note: "No gaps detected",
    badge: "Healthy",
  },
];

export default function CoreDashboard() {
  return (
    <PageShell
      header={
        <PageHeader
          title="Executive Overview"
          subtitle="Consolidated operations, risk, and platform health across all tenants."
          primaryAction={
            <Button>
              Open reports
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          }
          secondaryActions={<Button variant="outline">Export summary</Button>}
        />
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <WorkspacePanel key={kpi.label} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {kpi.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {kpi.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{kpi.delta}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </WorkspacePanel>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <WorkspacePanel
            title="Operational activity"
            description="Latest workflow updates and escalations across core services."
          >
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.title} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.detail}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{activity.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                  {index < activities.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Quick admin actions"
            description="Operational shortcuts for platform administrators."
          >
            <div className="space-y-3">
              {quickActions.map((action) => (
                <div
                  key={action.title}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </WorkspacePanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <WorkspacePanel
            title="System health"
            description="Platform stability and compliance posture."
          >
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Platform uptime
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">99.97%</p>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Security posture
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">Stable</p>
                  <p className="text-xs text-muted-foreground">
                    No critical incidents
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Tenants online
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">96%</p>
                  <p className="text-xs text-muted-foreground">Operational coverage</p>
                </div>
              </div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Compliance overview"
            description="Policy adherence and audit readiness."
          >
            <div className="space-y-4">
              {complianceItems.map((item, index) => (
                <div key={item.label} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.note}</p>
                    </div>
                    <Badge variant="outline">{item.badge}</Badge>
                  </div>
                  {index < complianceItems.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </WorkspacePanel>
        </div>
      </div>
    </PageShell>
  );
}
