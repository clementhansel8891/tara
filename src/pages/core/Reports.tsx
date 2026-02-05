import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/core/ui/PageShell";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import {
  Download,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  Users,
  Layers,
} from "lucide-react";

const categories = [
  {
    id: "finance",
    title: "Finance",
    description: "Revenue, margin, cashflow, and billing performance.",
    icon: FileSpreadsheet,
  },
  {
    id: "ops",
    title: "Operations",
    description: "Operational throughput and SLA performance.",
    icon: Layers,
  },
  {
    id: "hr",
    title: "HR",
    description: "Headcount, staffing, and attendance analytics.",
    icon: Users,
  },
  {
    id: "compliance",
    title: "Compliance",
    description: "Audit trails, risk monitoring, and regulatory reporting.",
    icon: ShieldCheck,
  },
];

const recentReports = [
  {
    id: "rep-1",
    title: "Executive KPI Summary",
    owner: "Finance Ops",
    updated: "Today, 09:40",
    status: "Ready",
  },
  {
    id: "rep-2",
    title: "Regional Operational Scorecard",
    owner: "Ops Analytics",
    updated: "Yesterday, 18:22",
    status: "Ready",
  },
  {
    id: "rep-3",
    title: "Quarterly Access Review",
    owner: "Security",
    updated: "Jan 30, 2026",
    status: "Draft",
  },
];

const scheduledReports = [
  {
    id: "sch-1",
    title: "Weekly Finance Digest",
    cadence: "Every Monday 07:00",
    recipients: "Finance Leadership",
  },
  {
    id: "sch-2",
    title: "Monthly Compliance Pack",
    cadence: "1st of month 08:00",
    recipients: "Risk & Compliance",
  },
  {
    id: "sch-3",
    title: "Daily Ops Pulse",
    cadence: "Daily 06:00",
    recipients: "Operations Command",
  },
];

export default function CoreReports() {
  return (
    <PageShell
      header={
        <PageHeader
          title="Reports & Analytics"
          subtitle="Generate, schedule, and export executive-ready reports."
          primaryAction={<Button>New report</Button>}
          secondaryActions={<Button variant="outline">Manage schedules</Button>}
        />
      }
    >
      <div className="space-y-6">
        <WorkspacePanel
          title="Report categories"
          description="Start from a curated template library."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  className="rounded-lg border p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg border bg-muted/50 p-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Button size="sm" variant="outline">
                      Browse
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground">{category.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </WorkspacePanel>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <WorkspacePanel
            title="Recent reports"
            description="Latest generated reports across teams."
          >
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{report.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.owner} • {report.updated}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{report.status}</Badge>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Scheduled reports"
            description="Automated delivery for recurring stakeholders."
          >
            <div className="space-y-4">
              {scheduledReports.map((schedule) => (
                <div key={schedule.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {schedule.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{schedule.cadence}</p>
                      <p className="text-xs text-muted-foreground">
                        Recipients: {schedule.recipients}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Schedule a new report delivery
                </div>
                <Button size="sm">Create schedule</Button>
              </div>
            </div>
          </WorkspacePanel>
        </div>
      </div>
    </PageShell>
  );
}
