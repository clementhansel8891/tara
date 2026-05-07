export interface DashboardKpi {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  sparklineData?: number[];
  icon: string;
  navigateTo?: string;
  currency?: boolean;
}

export interface DashboardTimeseries {
  financialOverview: { month: string; revenue: number; expenses: number; profit?: number }[];
  revenueTrend?: { month: string; revenue: number; expenses: number }[];
  topBranches: { name: string; revenue: number; percentOfTotal?: number; storeId?: string }[];
  hrDistribution: { department: string; count: number; color: string }[];
  alertsByModule: { module: string; count: number; critical?: number; high?: number; medium?: number; low?: number }[];
  moduleHealth: { name: string; value: number; color: string }[];
  campaignCorrelation: { week: string; adSpend: number; sales: number; roi?: number }[];
  payrollTrend?: { month: string; gross: number; net: number; headcount: number }[];
}

export interface DashboardMetrics {
  revenue: number;
  activeStaff: number;
  alerts: number;
  healthScore: number;
  payrollBurnThisMonth?: number;
  openReceivables?: number;
  openPayables?: number;
  pendingApprovals?: number;
  iotOnlineCount?: number;
  iotOfflineCount?: number;
  activeLeadsCount?: number;
  openProcurementValue?: number;
  inventoryAlertCount?: number;
  lowStockItemCount?: number;
  activeShiftsCount?: number;
}

export interface ActivityItem {
  id?: string;
  title: string;
  detail: string;
  time: string;
  status: string;
  module?: string;
  severity?: 'info' | 'warning' | 'critical';
  icon?: string;
}

export interface DashboardPayload {
  success: boolean;
  tenant_id: string;
  data: {
    metrics: DashboardMetrics;
    systemStatus: {
      activeModules: number;
      totalModules: number;
      uptime: string;
      lastBackup: string;
    };
    kpis: DashboardKpi[];
    timeseries: DashboardTimeseries;
    activities: ActivityItem[];
    recentActivity?: ActivityItem[];
    moduleContributions?: any;
  };
}

export interface TacticalPayload {
  success: boolean;
  tenant_id: string;
  data: {
    moduleActivity: {
      name: string;
      status: 'STABLE' | 'DEGRADED' | 'DOWN';
      throughput: number;
      latency: number;
      lastChecked: string;
    }[];
    syncHealth: {
      pending: number;
      failed: number;
      lastSyncAt: string;
      latencyMin: number;
      isHealthy: boolean;
    };
    outboxSummary: {
      pending: number;
      failed: number;
      lastProcessed: string;
    };
    iotDevices: {
      id: string;
      name: string;
      type: string;
      location: string;
      status: 'ONLINE' | 'OFFLINE' | 'ALERT';
      lastSeen: string;
      battery?: number;
    }[];
    alertsQueue: {
      id: string;
      title: string;
      detail: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      module: string;
      time: string;
      actionUrl?: string;
    }[];
    workflowItems: {
      id: string;
      type: string;
      title: string;
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
      assignee?: string;
      timeElapsed: string;
    }[];
    retailShifts?: {
      id: string;
      store: string;
      status: string;
      cashier: string;
      openTime: string;
      closeTime?: string;
      reconciled: boolean;
    }[];
    auditIntegrity: {
      score: number;
      status: 'CLEAN' | 'WARNINGS' | 'BROKEN';
      lastVerified: string;
      brokenCount: number;
    };
  };
}
