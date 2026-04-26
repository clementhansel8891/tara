import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { useSession } from "@/core/security/session";
import { incentivesService } from "@/core/services/sales/incentivesService";
import type { IncentivePlan, SalesAttribution } from "@/core/types/sales/incentives";
import { 
  Plus, 
  Settings2, 
  History, 
  CheckCircle2, 
  TrendingUp,
  Split,
  Calendar,
  User,
  Activity,
  ArrowRight
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { 
  IncentivePlan, 
  SalesAttribution, 
  IncentiveAuditLog 
} from "@/core/types/sales/incentives";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function IncentiveDesk() {
  const session = useSession();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plans, setPlans] = useState<IncentivePlan[]>([]);
  const [attributions, setAttributions] = useState<SalesAttribution[]>([]);
  const [auditLogs, setAuditLogs] = useState<IncentiveAuditLog[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRecalcOpen, setIsRecalcOpen] = useState(false);
  const [recalcDates, setRecalcDates] = useState({ start: "", end: "" });


  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [p, a, stats] = await Promise.all([
        incentivesService.listPlans(session),
        incentivesService.listAttributions(session),
        incentivesService.getAnalytics(session),
      ]);
      setPlans(p);
      setAttributions(a);
      setAnalytics(stats);

    } catch (err) {
      console.error("Failed to fetch incentive data:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Initializing Incentive Engine...</p>
      </div>
    );
  }

  const togglePlanStatus = async (plan: IncentivePlan) => {
    try {
      await incentivesService.updateStatus(plan.id, !plan.is_active, session, session.user_id);
      toast.success(`Plan ${!plan.is_active ? 'activated' : 'deactivated'} successfully`);
      refresh();
    } catch (err) {
      toast.error("Failed to update plan status");
    }
  };

  const showHistory = async (planId: string) => {
    try {
      const logs = await incentivesService.getAuditLogs(planId, session);
      setAuditLogs(logs);
      setSelectedPlanId(planId);
      setIsHistoryOpen(true);
    } catch (err) {
      toast.error("Failed to fetch audit history");
    }
  };

  const handleProcessPayouts = async () => {
    if (!confirm("Are you sure you want to process and accrue all pending incentives? This will post entries to the general ledger.")) return;
    
    try {
      setProcessing(true);
      await incentivesService.processPayouts(session);
      toast.success("Payouts processed and accrued to ledger");
      refresh();
    } catch (err) {
      toast.error("Failed to process payouts");
    } finally {
      setProcessing(false);
    }
  };

  const handleRecalculate = async () => {
    if (!recalcDates.start || !recalcDates.end) {
      toast.error("Please select a date range");
      return;
    }

    try {
      setProcessing(true);
      const res = await incentivesService.recalculate(
        { start_date: recalcDates.start, end_date: recalcDates.end },
        session
      );
      toast.success(`Recalculated ${res.processed} orders successfully`);
      setIsRecalcOpen(false);
      refresh();
    } catch (err) {
      toast.error("Failed to recalculate period");
    } finally {
      setProcessing(false);
    }
  };


  const activePlans = plans.filter(p => p.is_active);
  const pendingAmount = attributions
    .filter(a => a.status === "PENDING")
    .reduce((sum, a) => sum + Number(a.incentive_amount), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Revenue Incentive Desk"
        subtitle="Manage dynamic commission structures, staff eligibility, and automated payout accruals."
        secondaryActions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              History
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
              <Plus className="h-4 w-4" />
              New Plan
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <WorkspacePanel className="border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Plans</p>
              <h3 className="text-2xl font-bold mt-1">{activePlans.length}</h3>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Settings2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accrued Incentives</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                ${pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue Acceleration</p>
              <h3 className="text-2xl font-bold mt-1">
                {analytics?.roi?.toFixed(1) || "0.0"}x
                <span className="text-xs font-normal text-muted-foreground ml-1">ROI</span>
              </h3>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </WorkspacePanel>
      </div>

      {analytics && (
        <div className="grid gap-6 md:grid-cols-2">
            <WorkspacePanel title="Top Performance Leaders" description="Highest staff incentive contributions this period.">
                <div className="space-y-4 mt-2">
                    {analytics.topEarners?.map((earner: any, i: number) => (
                        <div key={earner.employee_id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600">
                                    #{i+1}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Employee {earner.employee_id.slice(0, 8)}</p>
                                    <p className="text-[10px] text-muted-foreground">ID: {earner.employee_id}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-emerald-600">${earner.amount.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                    {(!analytics.topEarners || analytics.topEarners.length === 0) && (
                        <p className="text-center py-4 text-xs text-muted-foreground">No data for leaderboard yet.</p>
                    )}
                </div>
            </WorkspacePanel>

            <WorkspacePanel title="Efficiency Metrics" description="Platform-wide incentive utilization.">
                <div className="space-y-6 mt-4">
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-muted-foreground font-medium">Incentive vs Revenue</span>
                            <span className="font-bold">{((analytics.totalIncentive / analytics.totalRevenue) * 100 || 0).toFixed(1)}% Ratio</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 rounded-full" 
                                style={{ width: `${Math.min((analytics.totalIncentive / analytics.totalRevenue) * 100 || 0, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/30 rounded-lg border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Total Payouts</p>
                            <p className="text-lg font-bold">${analytics.totalIncentive?.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Revenue Impact</p>
                            <p className="text-lg font-bold">${analytics.totalRevenue?.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </WorkspacePanel>
        </div>
      )}


      <div className="grid gap-6">
        <Tabs defaultValue="plans" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="plans" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Incentive Plans
              </TabsTrigger>
              <TabsTrigger value="attributions" className="gap-2">
                <Activity className="h-4 w-4" />
                Live Attributions
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className="gap-2 text-indigo-600"
                    onClick={() => setIsRecalcOpen(true)}
                >
                    <History className="h-4 w-4" />
                    Correction Engine
                </Button>
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2 text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                    onClick={handleProcessPayouts}
                    disabled={processing || pendingAmount === 0}
                >
                    <CheckCircle2 className="h-4 w-4" />
                    {processing ? "Accruing..." : "Process Accruals"}
                </Button>
            </div>

          </div>

          <TabsContent value="plans">
            <WorkspacePanel 
              title="Configuration Desk" 
              description="Active and scheduled revenue acceleration programs."
            >
              <DataTableShell total={plans.length}>
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">Plan Name</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Period</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {plan.description || "No description"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Switch 
                              checked={plan.is_active} 
                              onCheckedChange={() => togglePlanStatus(plan)}
                            />
                            <Badge variant={plan.is_active ? "default" : "secondary"}>
                              {plan.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(plan.start_date).toLocaleDateString()} - 
                          {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : "Ongoing"}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => showHistory(plan.id)}>
                              <History className="h-4 w-4 mr-1" />
                              Logs
                            </Button>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTableShell>
            </WorkspacePanel>
          </TabsContent>

          <TabsContent value="attributions">
            <WorkspacePanel 
              title="Transaction Stream" 
              description="Live stream of attributed sales incentives across all channels."
            >
              <DataTableShell total={attributions.length}>
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">Staff</th>
                      <th className="p-3 text-left">Order</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attributions.map((attr) => (
                      <tr key={attr.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="font-medium text-xs">Employee ID: {attr.employee_id}</div>
                          {attr.share_percent < 100 && (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-semibold">
                              <Split className="h-3 w-3" />
                              {attr.share_percent}% Split
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground font-mono">
                          {attr.entity_id.slice(0, 8)}...
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          ${Number(attr.incentive_amount).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {attr.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTableShell>
            </WorkspacePanel>
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-500" />
              Audit History
            </SheetTitle>
            <SheetDescription>
              Technical change logs and lifecycle events for this incentive plan.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                No history recorded yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="relative pl-6 pb-6 border-l-2 border-muted last:pb-0 last:border-l-0">
                  <div className="absolute -left-[9px] top-0 p-1 bg-background border-2 border-indigo-500 rounded-full">
                    <Activity className="h-3 w-3 text-indigo-500" />
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] bg-background">
                        {log.action}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      Actor: {log.actor_id}
                    </div>
                    {log.changes?.before?.is_active !== log.changes?.after?.is_active && (
                      <div className="flex items-center gap-2 mt-1 text-xs font-medium">
                        <Badge variant={log.changes.before?.is_active ? "default" : "secondary"}>
                          {log.changes.before?.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant={log.changes.after?.is_active ? "default" : "secondary"}>
                          {log.changes.after?.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isRecalcOpen} onOpenChange={setIsRecalcOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-indigo-600">
              <History className="h-5 w-5" />
              Correction Engine
            </SheetTitle>
            <SheetDescription>
              Retrospectively recalculate incentives for a specific period. This will re-evaluate all orders and update pending attributions.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Date</label>
                    <input 
                        type="date" 
                        className="w-full p-2 rounded-md border bg-background"
                        value={recalcDates.start}
                        onChange={(e) => setRecalcDates(prev => ({ ...prev, start: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">End Date</label>
                    <input 
                        type="date" 
                        className="w-full p-2 rounded-md border bg-background"
                        value={recalcDates.end}
                        onChange={(e) => setRecalcDates(prev => ({ ...prev, end: e.target.value }))}
                    />
                </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    <strong>Note:</strong> This operation is idempotent for pending attributions. It will NOT affect attributions that have already been processed into payouts or ledger entries.
                </p>
            </div>

            <Button 
                className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleRecalculate}
                disabled={processing || !recalcDates.start || !recalcDates.end}
            >
                {processing ? "Recalculating..." : "Execute Recalculation"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>

  );
}
