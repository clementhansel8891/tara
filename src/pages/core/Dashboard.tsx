import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as React from "react";
import { 
  RefreshCw, 
  Search, 
  Rocket, 
  LayoutDashboard,
  Bell,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/core/security/session";
import { adminService } from "@/core/services";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperationsView } from "@/components/shared/OperationsView";
import { PageShell } from "@/core/ui/PageShell";
import { PageHeader } from "@/core/ui/PageHeader";
import { ExecutiveKpiRow } from "@/components/dashboard/ExecutiveKpiRow";
import { FinancialTrajectoryChart } from "@/components/dashboard/FinancialTrajectoryChart";
import { ArApWaterfallChart } from "@/components/dashboard/ArApWaterfallChart";
import { CashPositionWidget } from "@/components/dashboard/CashPositionWidget";
import { BranchLeaderboard } from "@/components/dashboard/BranchLeaderboard";
import { HrCapitalWidget } from "@/components/dashboard/HrCapitalWidget";
import { PayrollBurnTrendChart } from "@/components/dashboard/PayrollBurnTrendChart";
import { AttendanceGauge } from "@/components/dashboard/AttendanceGauge";
import { InventoryHealthWidget } from "@/components/dashboard/InventoryHealthWidget";
import { ProcurementPipelineWidget } from "@/components/dashboard/ProcurementPipelineWidget";
import { SalesPipelineFunnel } from "@/components/dashboard/SalesPipelineFunnel";
import { AlertsRiskMatrix } from "@/components/dashboard/AlertsRiskMatrix";
import { MarketingRoiChart } from "@/components/dashboard/MarketingRoiChart";
import { GlobalEventFeed } from "@/components/dashboard/GlobalEventFeed";
import { StrategicScorecard } from "@/components/dashboard/StrategicScorecard";
import { SystemHealthDonut } from "@/components/dashboard/SystemHealthDonut";
import { ComplianceHeatmap } from "@/components/dashboard/ComplianceHeatmap";
import { DashboardPayload } from "@/types/dashboard.types";
import { StrategicExpansionModal } from "@/components/ui/StrategicExpansionModal";

export default function CoreDashboard() {
  const session = useSession();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardPayload['data'] | null>(null);
  const [expansionOpen, setExpansionOpen] = useState(false);

  const refresh = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      
      const res = await adminService.getDashboardMetrics(session.tenant_id, session);
      if (res) {
        setDashboardData(res);
      }
      
      if (isManual) toast.success("Executive telemetry synchronized.");
    } catch (err) {
      console.error("Dashboard sync failure:", err);
      toast.error("Telemetry failure in executive suite.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.tenant_id, session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading || !dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 bg-indigo-600 rounded-[2.5rem] animate-pulse flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <LayoutDashboard className="h-10 w-10 text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Executive Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      header={
        <PageHeader
          title="Executive Command Center"
          subtitle="Enterprise-wide intelligence, growth telemetry, and strategic governance."
          primaryAction={
            <Button onClick={() => setExpansionOpen(true)} className="rounded-[1.2rem] px-8 h-12 gap-3 font-black text-xs uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95">
              <Rocket className="h-4 w-4" /> STRATEGIC EXPANSION
            </Button>
          }
          secondaryActions={
            <Button 
              variant="outline" 
              className="rounded-[1.2rem] px-6 h-12 font-black text-xs uppercase tracking-widest border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white transition-all"
              onClick={() => refresh(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          }
        />
      }
    >
      <div className="grid gap-8 xl:grid-cols-[1fr_380px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-8">
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl h-14 w-full sm:w-auto border border-slate-200/30 dark:border-slate-800/30 backdrop-blur-md">
              <TabsTrigger value="overview" className="rounded-xl px-8 h-11 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 font-black text-[11px] uppercase tracking-widest transition-all">
                Strategic Overview
              </TabsTrigger>
              <TabsTrigger value="operations" className="rounded-xl px-8 h-11 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-indigo-600 font-black text-[11px] uppercase tracking-widest transition-all">
                Tactical Flow
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-10 m-0">
              {/* Executive KPI Matrix */}
              <ExecutiveKpiRow kpis={dashboardData.kpis} />

              {/* Tier 1: Financial & Treasury Intelligence */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <FinancialTrajectoryChart data={dashboardData.timeseries.financialOverview} />
                </div>
                <div className="space-y-6">
                  <CashPositionWidget />
                  <ArApWaterfallChart />
                </div>
              </div>

              {/* Tier 2: Human Capital & Regional Leaders */}
              <div className="grid gap-6 lg:grid-cols-3">
                <HrCapitalWidget distribution={dashboardData.timeseries.hrDistribution} />
                <div className="space-y-6">
                  <PayrollBurnTrendChart />
                  <AttendanceGauge />
                </div>
                <BranchLeaderboard data={dashboardData.timeseries.topBranches} />
              </div>

              {/* Tier 3: Inventory, Procurement & Sales */}
              <div className="grid gap-6 lg:grid-cols-3">
                <InventoryHealthWidget />
                <ProcurementPipelineWidget />
                <SalesPipelineFunnel />
              </div>

              {/* Tier 4: Risk, Marketing & System Health */}
              <div className="grid gap-6 lg:grid-cols-4">
                <AlertsRiskMatrix data={dashboardData.timeseries.alertsByModule as any} />
                <MarketingRoiChart data={dashboardData.timeseries.campaignCorrelation} />
                <ComplianceHeatmap />
                <SystemHealthDonut data={dashboardData.timeseries.moduleHealth} />
              </div>

              {/* Tier 5: Global Event Stream */}
              <GlobalEventFeed activities={dashboardData.activities} />
            </TabsContent>

            <TabsContent value="operations" className="m-0">
              <OperationsView />
            </TabsContent>
          </Tabs>
        </div>

        {/* Executive Sidebar: Scorecard & Support */}
        <div className="space-y-8">
          <StrategicScorecard />

          <div className="rounded-[2.5rem] bg-indigo-600 p-8 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden">
             <div className="absolute bottom-0 right-0 h-32 w-32 bg-white/10 rounded-full -mb-16 -mr-16 blur-2xl" />
             <div className="relative z-10 space-y-6">
                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                   <Briefcase className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                   <h4 className="text-lg font-black italic uppercase tracking-tighter">Strategic Support</h4>
                   <p className="text-xs text-indigo-100 font-medium">Your dedicated executive assistant is ready for tactical support.</p>
                </div>
                <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest rounded-xl h-11">
                   CONNECT NOW
                </Button>
             </div>
          </div>
        </div>
      </div>

      <StrategicExpansionModal 
        isOpen={expansionOpen} 
        onClose={() => setExpansionOpen(false)}
        feature=""
      />
    </PageShell>
  );
}

