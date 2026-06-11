import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend, ComposedChart, Line,
} from "recharts";
import {
  CTO_OPEX_BURN, BUDGET_VS_ACTUAL, WORKFLOW_VELOCITY_DATA, CHART_TOOLTIP_STYLE,
} from "./dashboard-data";
import { SimpleKpi, SectionLabel } from "./DashboardPrimitives";
import { CHART_COLORS, CHART_COLORS_DARK, CHART_NEUTRAL, CHART_NEUTRAL_DARK } from "@/lib/chart-colors";
import { useTheme } from "next-themes";

interface CtoProps {
  pendingApprovals: number;
  processedPayments: number;
}

const fmtM = (v: number | string) => [`Rp ${v}M`];

export function CtoChartsSection({ pendingApprovals, processedPayments }: CtoProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? CHART_COLORS_DARK : CHART_COLORS;
  const neutral = theme === 'dark' ? CHART_NEUTRAL_DARK : CHART_NEUTRAL;
  const gridStroke = theme === 'dark' ? '#1e293b' : '#f1f5f9';
  const tickFill = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <section>
      <SectionLabel
        label="CTO & Executive Analytics"
        sub="Technology spend, budget burn & workflow efficiency"
      />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr_1fr]">

        {/* ── OPEX Burn ──────────────────────────────────────────── */}
        <WorkspacePanel
          title="OPEX Budget Burn (Technology)"
          description="IT / SaaS budget vs actual spend & forecast (Rp M)"
          className="rounded-3xl border-slate-100 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-slate-100 my-5">
            <SimpleKpi label="Budget (Apr)"  value="Rp 220M" color="text-muted-foreground"    />
            <div className="h-8 w-px bg-muted" />
            <SimpleKpi label="Actual (Apr)"  value="Rp 205M" color="text-success"  />
            <div className="h-8 w-px bg-muted" />
            <SimpleKpi label="Variance"      value="-6.8%"   color="text-success"  />
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={CTO_OPEX_BURN}>
                <defs>
                  <linearGradient id="gBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={colors[1]} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={colors[1]} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="month" axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 700, fill: tickFill }} dy={10} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 600, fill: tickFill }} dx={-8} />
                <ChartTooltip {...CHART_TOOLTIP_STYLE} formatter={fmtM} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingTop: "10px" }} />
                <Area type="monotone" dataKey="budget" name="Budget"
                  stroke={colors[1]} strokeWidth={2} fill="url(#gBudget)" strokeDasharray="6 3" />
                <Bar dataKey="actual" name="Actual" fill={colors[2]} opacity={0.7}
                  radius={[4,4,0,0]} barSize={16} />
                <Line type="monotone" dataKey="forecast" name="Forecast"
                  stroke={colors[3]} strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </WorkspacePanel>

        {/* ── Budget vs Actual ────────────────────────────────────── */}
        <WorkspacePanel
          title="Budget vs. Actual by Dept"
          description="Over-run detection — red bar = budget exceeded"
          className="rounded-3xl border-slate-100 bg-white shadow-sm"
        >
          <div className="h-[320px] w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BUDGET_VS_ACTUAL} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                <XAxis type="number" hide />
                <YAxis dataKey="dept" type="category" axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 700, fill: tickFill }} width={48} />
                <ChartTooltip {...CHART_TOOLTIP_STYLE} formatter={fmtM} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: 700, paddingTop: "8px" }} />
                <Bar dataKey="budget" name="Budget" fill={neutral} barSize={18} />
                <Bar dataKey="actual" name="Actual" barSize={18} radius={[0,4,4,0]}>
                  {(Array.isArray(BUDGET_VS_ACTUAL) ? BUDGET_VS_ACTUAL : []).map((e, i) => (
                    <Cell key={i} fill={e.actual > e.budget ? (theme === 'dark' ? '#f87171' : '#f43f5e') : colors[2]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WorkspacePanel>

        {/* ── Workflow Velocity ───────────────────────────────────── */}
        <WorkspacePanel
          title="Workflow Request Velocity"
          description="7-day approval throughput and task pipeline — live"
          className="rounded-3xl border-slate-100 bg-white shadow-sm"
        >
          <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
            <div className="rounded-2xl bg-primary/5 border border-primary/10 p-3 text-center">
              <p className="text-2xl font-black text-primary">{pendingApprovals}</p>
              <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mt-0.5">Pending</p>
            </div>
            <div className="rounded-2xl bg-success border border-emerald-100 p-3 text-center">
              <p className="text-2xl font-black text-success">{processedPayments}</p>
              <p className="text-[10px] font-black text-success uppercase tracking-widest mt-0.5">Processed</p>
            </div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WORKFLOW_VELOCITY_DATA}>
                <defs>
                  <linearGradient id="gApprove" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={colors[1]} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={colors[1]} stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gTask" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={colors[2]} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={colors[2]} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 700, fill: tickFill }} dy={10} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 600, fill: tickFill }} dx={-8} />
                <ChartTooltip {...CHART_TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="approvals" name="Approvals"
                  stroke={colors[1]} strokeWidth={3} fill="url(#gApprove)" />
                <Area type="monotone" dataKey="tasks" name="Tasks"
                  stroke={colors[2]} strokeWidth={3} fill="url(#gTask)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </WorkspacePanel>

      </div>
    </section>
  );
}
