import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { useSession } from "@/core/security/session";
import { salesService } from "@/core/services/sales/salesService";
import type { SalesExecutiveForecast, SalesOpportunity } from "@/core/types/sales/sales";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Legend
} from "recharts";

export default function ForecastDesk() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<SalesExecutiveForecast | null>(null);
  const [projections, setProjections] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [f, o, proj, an] = await Promise.all([
        salesService.getExecutiveForecast(session.tenant_id, session),
        salesService.listOpportunities(session.tenant_id, session),
        salesService.getForecast(session.tenant_id, session),
        salesService.getAnalytics(session.tenant_id, session)
      ]);
      setForecast(f);
      setOpportunities(o);
      setProjections(proj);
      setAnalytics(an);
    } catch (err) {
      console.error("Failed to fetch forecast data:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openOpportunities = useMemo(() => 
    opportunities.filter(
      (item) => item.stage !== "CLOSED_WON" && item.stage !== "CLOSED_LOST",
    ),
    [opportunities]
  );

  const filtered = useMemo(
    () =>
      openOpportunities.filter((item) =>
        search
          ? `${item.accountName} ${item.ownerName} ${item.stage}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true,
      ),
    [openOpportunities, search],
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Executive Forecast"
        subtitle="Real-time revenue projection, conversion metrics, and pipeline quality for leadership."
        secondaryActions={
          <Input
            className="min-w-[220px]"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search opportunities"
          />
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <WorkspacePanel title="Revenue Projection" description="Weighted vs. Commit forecast (6 Months)">
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projections}>
                <defs>
                  <linearGradient id="colorWeighted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${(value/1000)}k`} />
                <Tooltip 
                   formatter={(value: any) => `$${value.toLocaleString()}`}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Area type="monotone" dataKey="weighted" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWeighted)" name="Weighted Forecast" />
                <Area type="monotone" dataKey="commit" stroke="#10b981" fillOpacity={0.1} fill="#10b981" name="Commit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Monthly Closed Revenue" description="Historical trends for current fiscal year">
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.revenueByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${(value/1000)}k`} />
                <Tooltip 
                  formatter={(value: any) => `$${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Won Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WorkspacePanel>
      </div>

      <WorkspacePanel title="Forecast Summary" description="Core pipeline health and efficiency metrics.">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
          <div className="rounded-lg border p-3 bg-muted/20">
            <p className="text-xs text-muted-foreground">Open pipeline</p>
            <p className="text-2xl font-semibold">{forecast ? forecast.openPipelineValue.toLocaleString() : 0}</p>
          </div>
          <div className="rounded-lg border p-3 border-blue-500/20 bg-blue-500/5">
            <p className="text-xs text-muted-foreground text-blue-600 dark:text-blue-400 font-medium">Weighted forecast</p>
            <p className="text-2xl font-semibold">{forecast ? forecast.weightedForecastValue.toLocaleString() : 0}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Won this period</p>
            <p className="text-2xl font-semibold">{forecast ? forecast.wonThisPeriod.toLocaleString() : 0}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Lost this period</p>
            <p className="text-2xl font-semibold">{forecast ? forecast.lostThisPeriod.toLocaleString() : 0}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Conversion rate</p>
            <p className="text-2xl font-semibold">{forecast ? forecast.conversionRate : 0}%</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Avg cycle (days)</p>
            <p className="text-2xl font-semibold">{forecast ? forecast.avgDealCycleDays : 0}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Rep Count</p>
            <p className="text-2xl font-semibold">{analytics?.topReps?.length || 0}</p>
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel title="Opportunity Table" description="Granular weighted revenue visibility.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          {loading ? (
             <div className="p-8 text-center text-muted-foreground italic">Refreshing forecast table...</div>
          ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Account</th>
                <th className="p-3 text-left">Owner</th>
                <th className="p-3 text-left">Stage</th>
                <th className="p-3 text-left text-right">Amount</th>
                <th className="p-3 text-left text-center">Prob %</th>
                <th className="p-3 text-left text-right">Weighted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium">{item.accountName}</td>
                  <td className="p-3 text-muted-foreground">{item.ownerName}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="font-normal capitalize">{item.stage.replace('_', ' ')}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground text-right">{item.amount.toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground text-center">
                    <div className="flex items-center justify-center gap-2">
                       <div className="w-8 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${item.probability}%` }} />
                       </div>
                       <span>{item.probability}%</span>
                    </div>
                  </td>
                  <td className="p-3 font-medium text-right">
                    {Math.round(item.amount * (item.probability / 100)).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={6} className="p-8 text-center text-muted-foreground italic">No open opportunities found</td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </DataTableShell>
      </WorkspacePanel>
    </div>
  );
}
