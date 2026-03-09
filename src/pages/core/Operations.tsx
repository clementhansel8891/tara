import { useState, useEffect } from "react";
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
  ServerCrash,
  Link2,
} from "lucide-react";
import { useSession } from "@/core/security/session";
import { itService } from "@/core/services/it/itService";

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
  {
    id: "check-2",
    label: "Daily financial reconciliation",
    status: "In progress",
  },
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
  const session = useSession();
  const [overviewData, setOverviewData] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await itService.getOverview(session.tenantId, session);
        setOverviewData(data);
      } catch (err) {
        console.error("Failed to load IT overview", err);
      }
    }
    load();
  }, [session]);

  const retailStats = overviewData?.moduleContributions?.retail;

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
        {/* --- MODULE CONTRIBUTIONS --- */}
        {retailStats && (
          <WorkspacePanel
            title="Module Contributions: Retail Infrastructure"
            description="Live device health and ecommerce channel connectivity from the active Retail module."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-5 dark:border-indigo-900/30 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400">
                  <span className="text-sm font-medium">
                    POS Devices Online
                  </span>
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-3xl font-bold tracking-tight text-indigo-900 dark:text-indigo-100">
                    {retailStats.posDevices?.online || 0}
                  </span>
                  <span className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">
                    of {retailStats.posDevices?.total || 0} total
                  </span>
                </div>
                <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                  Payment terminals in active stores
                </div>
              </div>

              <div
                className={`rounded-xl border p-5 shadow-sm ${retailStats.posDevices?.offline > 0 ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20" : ""}`}
              >
                <div
                  className={`flex items-center justify-between ${retailStats.posDevices?.offline > 0 ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground"}`}
                >
                  <span className="text-sm font-medium">Offline Devices</span>
                  <ServerCrash className="h-4 w-4" />
                </div>
                <div className="mt-4">
                  <span
                    className={`text-2xl font-semibold tracking-tight ${retailStats.posDevices?.offline > 0 ? "text-rose-900 dark:text-rose-100" : ""}`}
                  >
                    {retailStats.posDevices?.offline || 0}
                  </span>
                </div>
                <div
                  className={`mt-2 text-xs ${retailStats.posDevices?.offline > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}
                >
                  {retailStats.posDevices?.offline > 0
                    ? "Requires technician dispatch"
                    : "All POS devices healthy"}
                </div>
              </div>

              <div className="rounded-xl border p-5 shadow-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-sm font-medium">
                    Ecommerce Connectors
                  </span>
                  <Link2 className="h-4 w-4" />
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-2xl font-semibold tracking-tight">
                    {retailStats.ecommerceChannels?.active || 0}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1">
                    of {retailStats.ecommerceChannels?.total || 0} active
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Syncing inventory and orders
                </div>
              </div>
            </div>
          </WorkspacePanel>
        )}
        {/* ----------------------------- */}

        <WorkspacePanel
          title="Live module activity"
          description="Operational throughput and stability by service."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {moduleActivity.map((module) => (
              <div key={module.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {module.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Throughput {module.throughput}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={statusBadge(module.status)}
                  >
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
                      <p className="text-sm font-medium text-foreground">
                        {alert.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alert.detail}
                      </p>
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
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.status}
                      </p>
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
                    <p className="text-sm font-semibold text-foreground">
                      {tenant.name}
                    </p>
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
