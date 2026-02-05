import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/core/ui/PageShell";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Globe2,
  Layers,
  Timer,
} from "lucide-react";

const moduleActivity = [
  {
    id: "mod-1",
    name: "Retail Ops",
    status: "Stable",
    throughput: "2.1k tx/hr",
    latency: "120 ms",
  },
  {
    id: "mod-2",
    name: "F&B Operations",
    status: "Degraded",
    throughput: "1.5k tx/hr",
    latency: "260 ms",
  },
  {
    id: "mod-3",
    name: "Workforce",
    status: "Stable",
    throughput: "840 tx/hr",
    latency: "95 ms",
  },
  {
    id: "mod-4",
    name: "Compliance",
    status: "Stable",
    throughput: "210 checks/hr",
    latency: "180 ms",
  },
];

const alertsQueue = [
  {
    id: "alert-1",
    title: "Payment gateway retry queue growing",
    detail: "Asia Pacific region experiencing elevated latency.",
    severity: "High",
    time: "7 minutes ago",
  },
  {
    id: "alert-2",
    title: "Store #221 inventory sync delayed",
    detail: "Last sync 48 minutes ago.",
    severity: "Medium",
    time: "38 minutes ago",
  },
  {
    id: "alert-3",
    title: "Workforce onboarding backlog",
    detail: "12 requests pending in HR queue.",
    severity: "Low",
    time: "Today, 06:20",
  },
];

const checklistItems = [
  { id: "check-1", label: "Morning store health check", status: "Complete" },
  { id: "check-2", label: "Daily financial reconciliation", status: "In progress" },
  { id: "check-3", label: "Critical alerts review", status: "Complete" },
  { id: "check-4", label: "Vendor SLAs verified", status: "Pending" },
];

const tenantVisibility = [
  { id: "ten-1", name: "North America", uptime: "99.98%", incidents: "2 open" },
  { id: "ten-2", name: "Asia Pacific", uptime: "99.72%", incidents: "5 open" },
  { id: "ten-3", name: "EMEA", uptime: "99.91%", incidents: "1 open" },
];

const statusBadge = (status: string) => {
  if (status === "Stable") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status === "Degraded") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-slate-50 text-slate-600 border-slate-200";
};

export default function CoreOperations() {
  return (
    <PageShell
      header={
        <PageHeader
          title="Operations Command Center"
          subtitle="Real-time visibility into platform operations, incidents, and tenant health."
          primaryAction={<Button>Launch incident bridge</Button>}
          secondaryActions={<Button variant="outline">Export daily log</Button>}
        />
      }
    >
      <div className="space-y-6">
        <WorkspacePanel
          title="Live module activity"
          description="Operational throughput and stability by service."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {moduleActivity.map((module) => (
              <div key={module.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{module.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Throughput {module.throughput}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusBadge(module.status)}>
                    {module.status}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Latency {module.latency}
                  </div>
                  <Button size="sm" variant="outline">
                    Inspect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <WorkspacePanel
            title="Alerts & issues queue"
            description="Escalations requiring immediate review."
          >
            <div className="space-y-4">
              {alertsQueue.map((alert) => (
                <div key={alert.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.detail}</p>
                    </div>
                    <Badge variant="secondary">{alert.severity}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {alert.time}
                    </div>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Daily operational checklist"
            description="Core tasks and control points for today."
          >
            <div className="space-y-3">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {item.status === "Complete" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : item.status === "In progress" ? (
                      <ClipboardCheck className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Layers className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.status}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </WorkspacePanel>
        </div>

        <WorkspacePanel
          title="Cross-tenant operational visibility"
          description="Performance and incident posture across regions."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {tenantVisibility.map((tenant) => (
              <div key={tenant.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Uptime {tenant.uptime}
                    </p>
                  </div>
                  <Globe2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{tenant.incidents}</span>
                  <Button size="sm" variant="outline">
                    Drill in
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>
      </div>
    </PageShell>
  );
}
