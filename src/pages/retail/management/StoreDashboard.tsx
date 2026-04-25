import React, {
  useState,
  useEffect,
  useCallback,
  Suspense,
  useMemo,
} from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import { RefreshCw, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/core/security/session";
import { useToast } from "@/hooks/use-toast";
import { analyticsService } from "@/core/services/retail/analyticsService";
import { Roles } from "@/core/security/roles";
import {
  CommandCenterAnalytics,
  AnalyticsTimeRange,
} from "@/core/types/retail/analytics";

// Modular Components
import { GlobalKpiRow } from "./command-center/GlobalKpiRow";
import { TimeRangeFilter } from "./command-center/TimeRangeFilter";
import { LocationSwitcher } from "./command-center/LocationSwitcher";
import { useRealTimeAwareness } from "@/hooks/retail/useRealTimeAwareness";

// Lazy Loaded Analytics Widgets
const RevenueAnalytics = React.lazy(() =>
  import("./command-center/RevenueAnalytics").then((m) => ({
    default: m.RevenueAnalytics,
  })),
);
const OperationalEfficiency = React.lazy(() =>
  import("./command-center/OperationalEfficiency").then((m) => ({
    default: m.OperationalEfficiency,
  })),
);
const InventoryIntelligence = React.lazy(() =>
  import("./command-center/InventoryIntelligence").then((m) => ({
    default: m.InventoryIntelligence,
  })),
);
const WorkforceAnalytics = React.lazy(() =>
  import("./command-center/WorkforceAnalytics").then((m) => ({
    default: m.WorkforceAnalytics,
  })),
);
const InfrastructureHealth = React.lazy(() =>
  import("./command-center/InfrastructureHealth").then((m) => ({
    default: m.InfrastructureHealth,
  })),
);
const RiskCompliancePanel = React.lazy(() =>
  import("./command-center/RiskCompliancePanel").then((m) => ({
    default: m.RiskCompliancePanel,
  })),
);

const StoreDashboard = () => {
  const session = useSession();
  const { toast } = useToast();

  // Dashboard State
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("TODAY");
  const [scopedLocationId, setScopedLocationId] = useState<string | undefined>(
    session.location_id,
  );
  const [data, setData] = useState<CommandCenterAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // RBAC Helpers
  const permissions = session?.permissions || [];
  const rawRole = (session?.role || "").toString().toUpperCase();

  const isPrivileged =
    rawRole.includes("SUPERADMIN") ||
    rawRole.includes("OWNER") ||
    rawRole.includes("ADMIN") ||
    rawRole === Roles.SUPERADMIN ||
    rawRole === Roles.OWNER ||
    rawRole === Roles.COMPANY_ADMIN;

  const hasPermission = (perm: string) =>
    isPrivileged || permissions.includes(perm);

  const canViewFinancials =
    hasPermission("VIEW_FINANCIALS") || hasPermission("MANAGE_STORE");
  const canViewHR = hasPermission("VIEW_HR") || hasPermission("MANAGE_STORE");
  const canViewInventory =
    hasPermission("VIEW_INVENTORY") || hasPermission("MANAGE_STORE");
  const canViewDevices =
    hasPermission("VIEW_DEVICES") || hasPermission("MANAGE_STORE");
  const canViewRisk =
    hasPermission("VIEW_AUDIT") || hasPermission("MANAGE_STORE");

  // Data Fetching
  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const analytics = await analyticsService.getCommandCenterData(
        session.tenant_id!,
        session,
        {
          timeRange,
          locationId: scopedLocationId,
        },
      );
      setData(analytics);
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Failed to establish uplink with analytics engine.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, timeRange, scopedLocationId, toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-Time Awareness
  useRealTimeAwareness((event) => {
    // Incrementally update UI or trigger partial re-fetch
    if (event.type === "ORDER_CREATED" || event.type === "INVENTORY_CRITICAL") {
      fetchAnalytics();
    }
  });

  if (isLoading && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-xs font-black italic uppercase tracking-widest text-slate-400">
            Calibrating Command Rituals...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative overflow-hidden">
      {/* V3 Atmospheric Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[5%] w-[30%] h-[30%] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Glassmorphic Command Header */}
      <div className="px-8 py-5 bg-white/70 backdrop-blur-xl border-b border-white/50 flex items-center justify-between sticky top-0 z-50 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200 group hover:rotate-3 transition-transform">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <PageHeader
            title="Operational Command Center"
            subtitle={`Node: ${scopedLocationId || "GLOBAL_ROOT"} • Security: ${permissions.length} GRANTS • ROLE: ${rawRole}`}
          />
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-1.5 bg-slate-100/50 rounded-2xl flex items-center gap-2 border border-slate-200/50 backdrop-blur-md">
            <LocationSwitcher
              currentLocationId={scopedLocationId}
              onLocationChange={setScopedLocationId}
            />
            <div className="h-6 w-[1px] bg-slate-200" />
            <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
          </div>

          <Button
            variant="ghost"
            className="w-10 h-10 rounded-xl p-0 hover:bg-white hover:shadow-sm"
            onClick={fetchAnalytics}
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-400 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Main Command Surface */}
      <div className="flex-1 p-6 lg:p-8">
        <div className="max-w-[1920px] mx-auto space-y-10">
          {/* TIER 1: KPI Overview */}
          {data && <GlobalKpiRow kpis={data.kpis} />}

          {/* TIER 2: Financial + Operational Analytics */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                Core Performance Matrix
              </h2>
            </div>

            <Suspense
              fallback={
                <div className="h-[400px] bg-white rounded-3xl animate-pulse" />
              }
            >
              {canViewFinancials ? (
                data && <RevenueAnalytics data={data.revenue} />
              ) : (
                <div className="h-[200px] bg-slate-100 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Financial Data Restricted
                  </p>
                </div>
              )}
            </Suspense>

            <Suspense
              fallback={
                <div className="h-[400px] bg-white rounded-3xl animate-pulse" />
              }
            >
              {data && <OperationalEfficiency data={data.efficiency} />}
            </Suspense>
          </div>

          {/* TIER 3: Specialized Intelligence Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Suspense
              fallback={
                <div className="h-[300px] bg-white rounded-3xl animate-pulse" />
              }
            >
              {canViewInventory ? (
                data && <InventoryIntelligence data={data.inventory} />
              ) : (
                <div className="h-[300px] bg-slate-100 rounded-3xl flex items-center justify-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Inventory Restricted
                  </p>
                </div>
              )}
            </Suspense>

            <Suspense
              fallback={
                <div className="h-[300px] bg-white rounded-3xl animate-pulse" />
              }
            >
              {canViewHR ? (
                data && <WorkforceAnalytics data={data.workforce} />
              ) : (
                <div className="h-[300px] bg-slate-100 rounded-3xl flex items-center justify-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    HR Restricted
                  </p>
                </div>
              )}
            </Suspense>

            <Suspense
              fallback={
                <div className="h-[300px] bg-white rounded-3xl animate-pulse" />
              }
            >
              {canViewDevices ? (
                data && <InfrastructureHealth data={data.infrastructure} />
              ) : (
                <div className="h-[300px] bg-slate-100 rounded-3xl flex items-center justify-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Infra Restricted
                  </p>
                </div>
              )}
            </Suspense>

            <Suspense
              fallback={
                <div className="h-[300px] bg-white rounded-3xl animate-pulse" />
              }
            >
              {canViewRisk ? (
                data && <RiskCompliancePanel data={data.risk} />
              ) : (
                <div className="h-[300px] bg-slate-100 rounded-3xl flex items-center justify-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Risk Restricted
                  </p>
                </div>
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDashboard;
