import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { useSession } from "@/core/security/session";
import { salesService } from "@/core/services/sales/salesService";
import type { SalesAlert, SalesManagerMetrics, SalesOpportunity } from "@/core/types/sales/sales";

export default function ManagerDesk() {
  const session = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [metrics, setMetrics] = useState<SalesManagerMetrics | null>(null);
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [alerts, setAlerts] = useState<SalesAlert[]>([]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [m, o, a] = await Promise.all([
        salesService.getManagerMetrics(session.tenant_id, session),
        salesService.listOpportunities(session.tenant_id, session),
        salesService.listAlerts(session.tenant_id, session),
      ]);
      setMetrics(m);
      setOpportunities(o);
      setAlerts(a);
    } catch (err) {
      console.error("Failed to fetch manager desk data:", err);
    } finally {
      setLoading(false);
    }
  }, [session.tenant_id, session]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  const filteredOpportunities = useMemo(
    () =>
      opportunities.filter((item) =>
        search
          ? `${item.accountName} ${item.ownerName} ${item.stage}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true,
      ),
    [opportunities, search],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager View"
        subtitle="Pipeline health, stalled opportunities, SLA breaches, and approval bottlenecks."
        secondaryActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await salesService.runSlaSweep(session.tenant_id, session);
                setRefreshKey((value) => value + 1);
              }}
            >
              Run Health Sweep
            </Button>
            <Input
              className="min-w-[220px]"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search opportunities"
            />
          </div>
        }
      />

      <WorkspacePanel title="Team Performance Snapshot" description="Manager metrics for coaching and forecasting quality.">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total reps</p>
            <p className="text-2xl font-semibold">{metrics?.totalReps ?? 0}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Open pipeline</p>
            <p className="text-2xl font-semibold">{metrics ? metrics.openPipeline.toLocaleString() : 0}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Weighted forecast</p>
            <p className="text-2xl font-semibold">{metrics ? metrics.weightedForecast.toLocaleString() : 0}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Stalled deals</p>
            <p className="text-2xl font-semibold">{metrics?.stalledDeals ?? 0}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">SLA breaches</p>
            <p className="text-2xl font-semibold">{metrics?.slaBreaches ?? 0}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Approval pending</p>
            <p className="text-2xl font-semibold">{metrics?.approvalsPending ?? 0}</p>
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel title="Deal Risk Watchlist" description="Stalled and high-risk opportunities requiring manager intervention.">
        <DataTableShell total={filteredOpportunities.length} page={1} pageSize={10}>
          {loading ? (
             <div className="p-8 text-center text-muted-foreground italic">Refreshing watchlist...</div>
          ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Account</th>
                <th className="p-3 text-left">Owner</th>
                <th className="p-3 text-left">Stage</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Health</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpportunities.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 font-medium">{item.accountName}</td>
                  <td className="p-3 text-muted-foreground">{item.ownerName}</td>
                  <td className="p-3 text-muted-foreground">{item.stage}</td>
                  <td className="p-3 text-muted-foreground">
                    {item.amount.toLocaleString()} {item.currency}
                  </td>
                  <td className="p-3">
                    <Badge variant={item.health === "HIGH_RISK" ? "destructive" : "outline"}>
                      {item.health}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </DataTableShell>
      </WorkspacePanel>

      <WorkspacePanel title="Alert Queue" description="Actionable SLA, follow-up, and risk alert records.">
        <div className="space-y-2">
          {loading && alerts.length === 0 ? (
             <div className="p-8 text-center text-muted-foreground italic">Refreshing alerts...</div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{alert.type}</p>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={alert.severity === "HIGH" ? "destructive" : "outline"}>
                    {alert.severity}
                  </Badge>
                  {!alert.acknowledged ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await salesService.acknowledgeAlert(session.tenant_id, session, alert.id);
                        setRefreshKey((value) => value + 1);
                      }}
                    >
                      Acknowledge
                    </Button>
                  ) : (
                    <Badge variant="secondary">ACKNOWLEDGED</Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </WorkspacePanel>
    </div>
  );
}
