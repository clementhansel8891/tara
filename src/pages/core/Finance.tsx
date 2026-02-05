import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/core/ui/PageShell";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { FileText, Receipt, ShieldCheck, Wallet } from "lucide-react";

const financialSummary = [
  { id: "sum-1", label: "Revenue YTD", value: "$8.42M", delta: "+5.8%" },
  { id: "sum-2", label: "Operating expenses", value: "$5.31M", delta: "-2.1%" },
  { id: "sum-3", label: "Net margin", value: "18.7%", delta: "+0.9%" },
  { id: "sum-4", label: "Cash position", value: "$1.96M", delta: "Stable" },
];

const billingQueue = [
  {
    id: "inv-1",
    title: "INV-4021 - Apex Hospitality",
    amount: "$24,880",
    status: "Pending approval",
    due: "Due in 3 days",
  },
  {
    id: "inv-2",
    title: "INV-4018 - Northline Group",
    amount: "$8,420",
    status: "Overdue",
    due: "2 days overdue",
  },
  {
    id: "inv-3",
    title: "INV-4012 - Zenith Partners",
    amount: "$14,900",
    status: "Processing",
    due: "Due tomorrow",
  },
];

const taxReports = [
  {
    id: "tax-1",
    title: "Monthly VAT Summary",
    status: "Ready",
    due: "Submit by Feb 10, 2026",
  },
  {
    id: "tax-2",
    title: "Quarterly GST Return",
    status: "In review",
    due: "Review by Feb 14, 2026",
  },
];

const auditReadiness = [
  {
    id: "audit-1",
    label: "Ledger reconciliation",
    status: "Complete",
    note: "Jan close complete",
  },
  {
    id: "audit-2",
    label: "Revenue recognition",
    status: "In progress",
    note: "2 adjustments pending",
  },
  {
    id: "audit-3",
    label: "Expense approvals",
    status: "Attention",
    note: "5 approvals overdue",
  },
];

const statusTone = (status: string) => {
  if (status === "Complete" || status === "Ready") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status === "Attention" || status === "Overdue") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-slate-50 text-slate-600 border-slate-200";
};

export default function CoreFinance() {
  return (
    <PageShell
      header={
        <PageHeader
          title="Finance"
          subtitle="Consolidated financial oversight, billing, and audit readiness."
          primaryAction={<Button>New invoice</Button>}
          secondaryActions={<Button variant="outline">Export report</Button>}
        />
      }
    >
      <div className="space-y-6">
        <WorkspacePanel
          title="Financial summary"
          description="Key metrics across all business units."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {financialSummary.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.delta}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-2">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <WorkspacePanel
            title="Invoice & billing queue"
            description="Outstanding invoices and approvals."
          >
            <div className="space-y-4">
              {billingQueue.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.due}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{item.amount}</p>
                      <Badge variant="outline" className={statusTone(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Billing workflow
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
            title="Tax reporting"
            description="Compliance submissions and filing deadlines."
          >
            <div className="space-y-4">
              {taxReports.map((report) => (
                <div key={report.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{report.title}</p>
                      <p className="text-xs text-muted-foreground">{report.due}</p>
                    </div>
                    <Badge variant="outline" className={statusTone(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Filing summary
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  Tax documentation package ready
                </div>
                <Button size="sm" variant="outline">
                  Download
                </Button>
              </div>
            </div>
          </WorkspacePanel>
        </div>

        <WorkspacePanel
          title="Audit readiness"
          description="Evidence and controls for upcoming audits."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {auditReadiness.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.note}</p>
                  </div>
                  <Badge variant="outline" className={statusTone(item.status)}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>
      </div>
    </PageShell>
  );
}
