import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { WorkflowRequestCard } from "@/core/tools/WorkflowRequestCard";
import { ApprovalStatusBadge } from "@/core/tools/ApprovalStatusBadge";
import { useSession } from "@/core/security/session";
import { hrWorkstreamService } from "@/core/services/hr/hrWorkstreamService";
import { workflowService } from "@/core/services/hr/workflowService";
import { hrService } from "@/core/services/hr/hrService";
import { useBackgroundRefresh } from "@/core/runtime/events/useBackgroundRefresh";
import { ZenTooltip } from "@/core/ui/ZenTooltip";
import { Users, Clock, AlertCircle, PlusCircle } from "lucide-react";

export default function PulseDesk() {
  const session = useSession();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [version, setVersion] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");

  const refresh = useCallback(() => setVersion((prev) => prev + 1), []);
  useBackgroundRefresh(refresh, 20000);

  const [pulseItems, setPulseItems] = useState<any[]>([]);
  const [overviewData, setOverviewData] = useState<any | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const [items, overview] = await Promise.all([
          hrWorkstreamService.getPulseItems(session.tenantId, session),
          hrService.getHrOverview(session.tenantId, session).catch(() => null),
        ]);
        let filtered = items;
        if (statusFilter !== "all") {
          filtered = filtered.filter(
            (item) => item.status.toLowerCase() === statusFilter,
          );
        }
        if (search) {
          filtered = filtered.filter((item) =>
            item.title.toLowerCase().includes(search.toLowerCase()),
          );
        }
        setPulseItems(filtered);
        if (overview) setOverviewData(overview);
      } catch (err) {
        console.error("Failed to load pulse items", err);
      }
    };
    loadItems();
  }, [session.tenantId, session, search, statusFilter, version]);

  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  useEffect(() => {
    const loadInbox = async () => {
      const items = await workflowService.listInbox(session.tenantId, session, session.departmentId);
      setPendingApprovals(items);
    };
    loadInbox();
  }, [session, version]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return pulseItems.slice(start, start + pageSize);
  }, [pulseItems, page, pageSize]);

  const retailStats = overviewData?.moduleContributions?.retail;

  return (
    <div className="space-y-6">
      <PageHeader
        title="PulseDesk"
        subtitle="Operational command inbox for HR workstreams."
        primaryAction={
          <ZenTooltip content="Submit a new request for multi-level approval via FlowGate.">
            <Button
              onClick={async () => {
                await workflowService.createRequest(session.tenantId, session, {
                  entityType: "GENERAL",
                  entityId: session.userId,
                  makerDept: session.departmentId,
                  destinationDept: "HR",
                  notes: "Manual request from PulseDesk",
                });
                refresh();
              }}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Route to FlowGate
            </Button>
          </ZenTooltip>
        }
        secondaryActions={
          <Input
            placeholder="Search workstreams"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-[200px]"
          />
        }
      />

      {/* --- MODULE CONTRIBUTIONS --- */}
      {retailStats && (
        <WorkspacePanel
          title="Module Contributions: Retail Workforce"
          description="Live workforce and operational metrics from the active Retail module."
        >
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                <span className="text-sm font-medium">Active Shifts</span>
                <Clock className="h-4 w-4" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">
                  {retailStats.activeShiftsToday}
                </span>
              </div>
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                Stores currently operating
              </div>
            </div>

            <div className="rounded-xl border p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Headcount</span>
                <Users className="h-4 w-4" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-semibold tracking-tight">
                  {retailStats.retailStaffCount}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Total active retail staff
              </div>
            </div>

            <div className="rounded-xl border p-5 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm font-medium">Completed Shifts</span>
                <Clock className="h-4 w-4" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-semibold tracking-tight">
                  {retailStats.completedShiftsToday}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Successfully closed today
              </div>
            </div>

            <div
              className={`rounded-xl border p-5 shadow-sm ${retailStats.pendingShiftClosures > 0 ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20" : ""}`}
            >
              <div
                className={`flex items-center justify-between ${retailStats.pendingShiftClosures > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}
              >
                <span className="text-sm font-medium">Pending Closures</span>
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="mt-4">
                <span
                  className={`text-2xl font-semibold tracking-tight ${retailStats.pendingShiftClosures > 0 ? "text-amber-900 dark:text-amber-100" : ""}`}
                >
                  {retailStats.pendingShiftClosures}
                </span>
              </div>
              <div
                className={`mt-2 text-xs ${retailStats.pendingShiftClosures > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}
              >
                {retailStats.pendingShiftClosures > 0
                  ? "Requires manager review"
                  : "All shifts healthy"}
              </div>
            </div>
          </div>
        </WorkspacePanel>
      )}
      {/* ----------------------------- */}

      <WorkspacePanel
        title="WorkQueue"
        description="High urgency items that need immediate action."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pulseItems.slice(0, 6).map((item) => (
            <WorkflowRequestCard
              key={item.id}
              title={item.title}
              subtitle={item.source}
              status={item.status}
              urgency={item.urgency}
              owner={item.owner}
              actionLabel={item.nextAction}
              onAction={() => navigate("/core/hr/flowgate")}
            />
          ))}
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        title="Active Records"
        description="Live operational stream."
      >
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search pulse items"
          filters={
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All status</option>
                {Array.from(
                  new Set(pulseItems.map((item) => item.status.toLowerCase())),
                ).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          }
          onReset={() => {
            setSearch("");
            setStatusFilter("all");
          }}
        />
        <DataTableShell
          title="Pulse items"
          subtitle="Workflow, compliance, payroll, and attendance signals."
          total={pulseItems.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        >
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Item</th>
                <th className="p-3 text-left">Owner</th>
                <th className="p-3 text-left">Urgency</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium text-foreground">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.source}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {item.owner}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">{item.urgency}</Badge>
                  </td>
                  <td className="p-3">
                    <ApprovalStatusBadge status={item.status.toUpperCase()} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <WorkspacePanel
          title="Pending Approvals"
          description="Requests waiting on your department."
        >
          <div className="space-y-3">
            {pendingApprovals.slice(0, 5).map((flow) => (
              <div
                key={flow.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {flow.entityType}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dept: {flow.destinationDept}
                  </p>
                </div>
                <ApprovalStatusBadge status={flow.status} />
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Insights"
          description="Operational signals and risk exposure."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>Total pulse items</span>
              <span className="font-semibold text-foreground">
                {pulseItems.length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>Pending approvals</span>
              <span className="font-semibold text-foreground">
                {pendingApprovals.length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span>High urgency items</span>
              <span className="font-semibold text-foreground">
                {pulseItems.filter((item) => item.urgency >= 80).length}
              </span>
            </div>
          </div>
        </WorkspacePanel>
      </div>
    </div>
  );
}
