export type AnalyticsTimeRange =
  | "TODAY"
  | "YESTERDAY"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "CUSTOM_RANGE";

export interface RevenueMetric {
  date: string;
  revenue: number;
  orders: number;
  refunds: number;
  grossMargin: number;
}

export interface PaymentDistribution {
  method: string;
  value: number;
  percentage: number;
}

export interface RevenueAnalytics {
  daily: RevenueMetric[];
  weekly: RevenueMetric[];
  monthly: RevenueMetric[];
  growthPercentage: number;
  refundRatio: number;
  paymentMethodDistribution: PaymentDistribution[];
}

export interface OperationalEfficiency {
  ordersPerHourHeatmap: { hour: number; day: number; value: number }[];
  avgProcessingTimeTrend: { time: string; minutes: number }[];
  fulfillmentBacklogTrend: { time: string; count: number }[];
  slowestSkus: { sku: string; name: string; avgTime: number }[];
}

export interface InventoryIntelligence {
  stockAging: { bracket: string; value: number }[];
  deadStock: { sku: string; name: string; daysIdle: number; value: number }[];
  lowStockPrediction: {
    sku: string;
    name: string;
    predictedOutDate: string;
    currentStock: number;
  }[];
  turnoverRatioTrend: { month: string; ratio: number }[];
  movingSpeedDistribution: {
    category: "fast" | "slow";
    count: number;
    value: number;
  }[];
}

export interface WorkforceAnalytics {
  staffPerformance: {
    staffId: string;
    name: string;
    sales: number;
    orders: number;
  }[];
  shiftUtilization: number;
  overtimeSummary: { staffId: string; name: string; overtimeHours: number }[];
  revenuePerCashier: { name: string; revenue: number }[];
}

export interface InfrastructureHealth {
  uptimePercentage: number;
  incidentHistory: { time: string; count: number }[];
  posCrashTrend: { time: string; count: number }[];
  networkLatency: number;
}

export interface RiskCompliance {
  refundSpikes: { time: string; count: number }[];
  suspiciousTransactions: {
    id: string;
    type: string;
    reason: string;
    amount: number;
    time: string;
  }[];
  manualOverrides: {
    staffId: string;
    name: string;
    count: number;
    totalValue: number;
  }[];
  auditActivityTrend: { time: string; activityCount: number }[];
}

export interface GlobalKpis {
  totalRevenueToday: number;
  revenueVsTarget: number;
  orderCount: number;
  avgTicketSize: number;
  grossMarginPercentage: number;
  activeDevices: number;
  openShifts: number;
  criticalAlertsCount: number;
  sparklineData?: {
    revenue: number[];
    orders: number[];
    conversion: number[];
    ticket: number[];
  };
}

export interface CommandCenterAnalytics {
  kpis: GlobalKpis;
  revenue: RevenueAnalytics;
  efficiency: OperationalEfficiency;
  inventory: InventoryIntelligence;
  workforce: WorkforceAnalytics;
  infrastructure: InfrastructureHealth;
  risk: RiskCompliance;
}
