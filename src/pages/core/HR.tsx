import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/core/ui/PageShell";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { AlertTriangle, Calendar, CheckCircle2, Clock, Users } from "lucide-react";

const hiringPipeline = [
  { id: "hp-1", role: "Store Manager", stage: "Interview", candidates: 4 },
  { id: "hp-2", role: "Operations Analyst", stage: "Offer", candidates: 2 },
  { id: "hp-3", role: "Regional HR", stage: "Screening", candidates: 6 },
];

const attendanceOverview = [
  { id: "att-1", label: "On-time check-ins", value: "92%" },
  { id: "att-2", label: "Late arrivals", value: "4%" },
  { id: "att-3", label: "Absent", value: "2%" },
];

const payrollCycles = [
  {
    id: "pay-1",
    period: "Jan 16 - Jan 31",
    status: "Processing",
    due: "Due in 2 days",
  },
  {
    id: "pay-2",
    period: "Feb 1 - Feb 15",
    status: "Scheduled",
    due: "Opens Feb 12",
  },
];

const complianceAlerts = [
  {
    id: "comp-1",
    title: "Overtime policy exception",
    detail: "Region East exceeded weekly cap for 6 staff",
    severity: "High",
    time: "35 minutes ago",
  },
  {
    id: "comp-2",
    title: "Work permit renewal pending",
    detail: "3 documents expiring within 14 days",
    severity: "Medium",
    time: "Today, 08:10",
  },
  {
    id: "comp-3",
    title: "Training compliance",
    detail: "Security awareness completion at 89%",
    severity: "Low",
    time: "Yesterday, 19:05",
  },
];

export default function CoreHR() {
  return (
    <PageShell
      header={
        <PageHeader
          title="Human Resources"
          subtitle="Centralized workforce oversight, compliance, and payroll readiness."
          primaryAction={<Button>New requisition</Button>}
          secondaryActions={<Button variant="outline">Export workforce</Button>}
        />
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <WorkspacePanel
            title="Hiring pipeline"
            description="Open requisitions and hiring status."
          >
            <div className="space-y-4">
              {hiringPipeline.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.role}</p>
                    <p className="text-xs text-muted-foreground">
                      Stage: {item.stage}
                    </p>
                  </div>
                  <Badge variant="secondary">{item.candidates} candidates</Badge>
                </div>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Attendance overview"
            description="Daily attendance health snapshot."
          >
            <div className="space-y-4">
              {attendanceOverview.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </WorkspacePanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <WorkspacePanel
            title="Payroll cycle status"
            description="Upcoming payroll runs and processing stages."
          >
            <div className="space-y-4">
              {payrollCycles.map((cycle) => (
                <div key={cycle.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{cycle.period}</p>
                    <p className="text-xs text-muted-foreground">{cycle.due}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{cycle.status}</Badge>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Review payroll inputs before submission
                </div>
                <Button size="sm">Open payroll</Button>
              </div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Workforce compliance alerts"
            description="Exceptions requiring HR attention."
          >
            <div className="space-y-4">
              {complianceAlerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.detail}</p>
                    </div>
                    <Badge variant="outline">{alert.severity}</Badge>
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
              <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  Compliance summary ready for audit export
                </div>
                <Button size="sm" variant="outline">
                  Export
                </Button>
              </div>
            </div>
          </WorkspacePanel>
        </div>
      </div>
    </PageShell>
  );
}
