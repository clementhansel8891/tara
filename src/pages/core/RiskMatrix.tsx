import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Activity, TrendingDown, Server, Users, ShoppingCart, Wallet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/core/security/session";
import { adminService } from "@/core/services";
import DashboardLayout from "./DashboardLayout";

interface RiskItem {
  module: string;
  icon: any;
  likelihood: "high" | "medium" | "low";
  impact: "critical" | "high" | "medium" | "low";
  description: string;
  mitigation: string;
  status: "active" | "mitigated" | "monitoring";
}

const riskData: RiskItem[] = [
  { module: "Finance", icon: Wallet, likelihood: "low", impact: "critical", description: "Ledger imbalance due to concurrent journal entries", mitigation: "Double-entry validation + atomic transactions", status: "mitigated" },
  { module: "Retail", icon: ShoppingCart, likelihood: "medium", impact: "high", description: "POS offline mode data loss during sync", mitigation: "Local persistence + retry queue with conflict resolution", status: "active" },
  { module: "Inventory", icon: Server, likelihood: "medium", impact: "high", description: "Stock level desync across locations", mitigation: "Event sourcing + periodic reconciliation job", status: "monitoring" },
  { module: "HR", icon: Users, likelihood: "low", impact: "medium", description: "Payroll calculation errors on edge cases", mitigation: "Property-based tests + manual review gate", status: "mitigated" },
  { module: "IT", icon: Activity, likelihood: "high", impact: "medium", description: "SLA breach detection delay", mitigation: "Real-time monitoring + escalation automation", status: "active" },
  { module: "Procurement", icon: TrendingDown, likelihood: "low", impact: "high", description: "Supplier payment double-processing", mitigation: "Idempotency keys + approval workflow", status: "mitigated" },
];

const likelihoodColor = { high: "bg-destructive text-destructive-foreground", medium: "bg-warning text-warning-foreground", low: "bg-success text-success-foreground" };
const impactColor = { critical: "bg-destructive text-destructive-foreground", high: "bg-warning text-warning-foreground", medium: "bg-primary text-primary-foreground", low: "bg-muted text-muted-foreground" };
const statusColor = { active: "border-destructive text-destructive", mitigated: "border-success text-success", monitoring: "border-warning text-warning" };

export default function RiskMatrix() {
  const session = useSession();
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardMetrics(session.tenant_id, session, "6M").then(res => {
      if (res) setDashData(res);
    }).finally(() => setLoading(false));
  }, [session]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Merge real alert data if available
  const alertsByModule = dashData?.timeseries?.alertsByModule || [];
  const enrichedRisks = riskData.map(risk => {
    const moduleAlerts = alertsByModule.find((a: any) => a.module === risk.module);
    if (moduleAlerts && moduleAlerts.critical > 0) {
      return { ...risk, status: "active" as const };
    }
    return risk;
  });

  const riskScore = enrichedRisks.filter(r => r.status === "active").length;
  const mitigated = enrichedRisks.filter(r => r.status === "mitigated").length;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Enterprise Risk Matrix</h1>
            <p className="text-sm text-muted-foreground mt-1">Cross-module risk assessment and mitigation tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("font-bold", riskScore > 2 ? "border-destructive text-destructive" : "border-success text-success")}>
              {riskScore} Active Risks
            </Badge>
            <Badge variant="outline" className="border-success text-success font-bold">
              {mitigated} Mitigated
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Active Risks</p>
                <p className="text-2xl font-black text-foreground">{riskScore}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Mitigated</p>
                <p className="text-2xl font-black text-foreground">{mitigated}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Monitoring</p>
                <p className="text-2xl font-black text-foreground">{enrichedRisks.filter(r => r.status === "monitoring").length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-wide text-foreground">Risk Register</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrichedRisks.map((risk, i) => (
                <div key={i} className={cn("p-5 rounded-xl border bg-card", statusColor[risk.status])}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <risk.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="text-sm font-black text-foreground">{risk.module}</span>
                          <Badge className={cn("text-[9px] font-bold", likelihoodColor[risk.likelihood])}>
                            {risk.likelihood} likelihood
                          </Badge>
                          <Badge className={cn("text-[9px] font-bold", impactColor[risk.impact])}>
                            {risk.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{risk.description}</p>
                        <p className="text-xs text-muted-foreground mt-2"><span className="font-bold text-foreground">Mitigation:</span> {risk.mitigation}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0 text-[9px] font-bold uppercase", statusColor[risk.status])}>
                      {risk.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
