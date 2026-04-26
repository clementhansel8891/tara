import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { useSession } from "@/core/security/session";
import { salesService } from "@/core/services/sales/salesService";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from "recharts";
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight,
  Medal,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function SalesOverview() {
  const session = useSession();
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [projection, setProjection] = useState<any[]>([]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [f, a, p] = await Promise.all([
        salesService.getExecutiveForecast(session.tenant_id, session),
        salesService.getAnalytics(session.tenant_id, session),
        salesService.getForecast(session.tenant_id, session),
      ]);
      setForecast(f);
      setAnalytics(a);
      setProjection(p);
    } catch (err) {
      console.error("Failed to fetch executive sales data:", err);
    } finally {
      setLoading(false);
    }
  }, [session.tenant_id, session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading || !forecast) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Assembling Sales Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        title="Executive Sales Overview"
        subtitle="Global revenue velocity, weighted pipeline forecasting, and conversion efficiency metrics."
      />

      {/* --- EXECUTIVE KPI GRID --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIItem 
          title="Won Revenue" 
          value={`$${forecast.wonThisPeriod.toLocaleString()}`} 
          trend="+12.5%" 
          trendUp={true}
          icon={TrendingUp}
          description="Total won deals this period"
        />
        <KPIItem 
          title="Weighted Pipeline" 
          value={`$${forecast.weightedForecastValue.toLocaleString()}`} 
          trend="+5.2%" 
          trendUp={true}
          icon={Target}
          description="Probability-adjusted open deals"
        />
        <KPIItem 
          title="Conversion Rate" 
          value={`${forecast.conversionRate}%`} 
          trend="-1.2%" 
          trendUp={false}
          icon={Percent}
          description="Won vs. closed opportunities"
        />
        <KPIItem 
          title="Avg. Deal Cycle" 
          value={`${forecast.avgDealCycleDays} Days`} 
          trend="Flat" 
          trendUp={true}
          icon={Clock}
          description="Time from creation to close"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* --- REVENUE PROJECTION CHART --- */}
        <WorkspacePanel 
          className="lg:col-span-2"
          title="6-Month Revenue Projection" 
          description="Commit vs. Weighted pipeline forecast."
        >
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection}>
                <defs>
                  <linearGradient id="colorWeighted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="weighted" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorWeighted)" 
                  name="Weighted Forecast"
                />
                <Area 
                  type="monotone" 
                  dataKey="commit" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  fill="transparent"
                  strokeDasharray="5 5"
                  name="Commit (80%+ Prob)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </WorkspacePanel>

        {/* --- TOP PERFORMANCE LEADERBOARD --- */}
        <WorkspacePanel 
          title="Top Performance" 
          description="Leading reps by won revenue this year."
        >
          <div className="space-y-5 pt-2">
            {analytics.topReps.map((rep: any, idx: number) => (
              <div key={rep.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-transform group-hover:scale-110",
                    idx === 0 ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                    idx === 1 ? "bg-slate-300/30 text-slate-500" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {idx === 0 ? <Medal className="h-4 w-4" /> : idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{rep.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Rep ID: {rep.name.substring(0, 3)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">${Number(rep.total).toLocaleString()}</p>
                  <div className="h-1 w-24 bg-muted rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${(rep.total / analytics.topReps[0].total) * 100}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* --- REVENUE TREND LINE --- */}
        <WorkspacePanel 
          title="Revenue Trend" 
          description="Monthly revenue capture (Won deals)."
        >
          <div className="h-[200px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                  name="Revenue ($)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WorkspacePanel>

        {/* --- SALES VELOCITY WIDGET --- */}
        <WorkspacePanel 
          title="Sales Velocity & Health" 
          description="Efficiency signals and funnel integrity."
        >
          <div className="grid grid-cols-2 gap-4 pt-2">
             <HealthMetric 
                label="Funnel Integrity" 
                value="High" 
                detail="SLA Compliance: 94%" 
                color="text-emerald-500"
             />
             <HealthMetric 
                label="Stalled Deals" 
                value="4" 
                detail="> 30 days stagnant" 
                color="text-amber-500"
             />
             <HealthMetric 
                label="Lost Deal Value" 
                value={`$${forecast.lostThisPeriod.toLocaleString()}`} 
                detail="This month" 
                color="text-destructive"
             />
             <HealthMetric 
                label="Pipeline Health" 
                value="Strong" 
                detail="Growth: +8.3%" 
                color="text-primary"
             />
          </div>
        </WorkspacePanel>
      </div>
    </div>
  );
}

function KPIItem({ title, value, trend, trendUp, description, icon: Icon }: any) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <h3 className="mt-1 text-3xl font-bold tracking-tight">{value}</h3>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className={cn(
          "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
          trendUp ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
        )}>
          {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trend}
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">{description}</span>
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary transition-all group-hover:w-full" />
    </div>
  );
}

function HealthMetric({ label, value, detail, color }: any) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={cn("text-xl font-bold", color)}>{value}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 font-medium">{detail}</p>
    </div>
  );
}
