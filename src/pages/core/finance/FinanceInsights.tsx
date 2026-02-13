import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { FilterBar } from "@/core/tools/FilterBar";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { useSession } from "@/core/security/session";
import { financeService } from "@/core/services/finance/financeService";

export default function FinanceInsights() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [timeFrame, setTimeFrame] = useState("30");
  const [category, setCategory] = useState("ALL");

  const insights = useMemo(
    () => financeService.getFinanceInsights(session.tenantId),
    [session],
  );

  const filteredInsights = useMemo(
    () =>
      insights.filter(
        (item) =>
          (!search || item.title.toLowerCase().includes(search.toLowerCase())) &&
          (category === "ALL" || item.category === category),
      ),
    [insights, search, category],
  );

  const trendCards = useMemo(
    () =>
      filteredInsights.slice(0, 3).map((item, index) => ({
        ...item,
        label: `${index + 1}. ${item.title}`,
      })),
    [filteredInsights],
  );

  const breakdown = useMemo(() => {
    const group: Record<string, number> = {};
    filteredInsights.forEach((item) => {
      group[item.category] = (group[item.category] ?? 0) + 1;
    });
    return Object.entries(group).map(([categoryName, count]) => ({
      category: categoryName,
      count,
    }));
  }, [filteredInsights]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Insights"
        subtitle="Operational dashboards, KPIs, and predictive signals."
        primaryAction={
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger>
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        }
        secondaryActions={
          <div className="flex gap-2 items-center">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PAYMENTS">Payments</SelectItem>
                <SelectItem value="CASHFLOW">Cashflow</SelectItem>
                <SelectItem value="APPROVALS">Approvals</SelectItem>
                <SelectItem value="PERIODS">Periods</SelectItem>
              </SelectContent>
            </Select>
            <FilterBar searchValue={search} onSearchChange={setSearch} />
          </div>
        }
      />

      <WorkspacePanel
        title="Top Insights"
        description="Signal cards surface the most critical metrics this cycle."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {trendCards.map((item) => (
            <div key={item.id} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{item.category}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-semibold text-foreground">{item.value}</p>
              <Badge variant="outline">{timeFrame}d</Badge>
            </div>
          ))}
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        title="Approval Workflow Insights"
        description="Monitor approval time, bottlenecks, and status."
      >
        <DataTableShell total={filteredInsights.length} page={1} pageSize={5}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Metric</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredInsights.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 font-medium">{item.title}</td>
                  <td className="p-3 text-muted-foreground">{item.category}</td>
                  <td className="p-3">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <WorkspacePanel
        title="Category Breakdown"
        description="Distribution of insight categories for this timeframe."
      >
        <div className="flex flex-wrap gap-2">
          {breakdown.map((row) => (
            <Badge key={row.category} variant="outline">
              {row.category}: {row.count}
            </Badge>
          ))}
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        title="Period Closing Status"
        description="Track the latest closing cycle and readiness."
      >
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Last period closed on 31-Jan-2026. Average closing duration: 3.2 days.
        </div>
      </WorkspacePanel>
    </div>
  );
}
