import { LayoutDashboard, TrendingUp, Target, History, Activity } from "lucide-react";
import DepartmentWorkspaceLayout from "@/components/layouts/DepartmentWorkspaceLayout";

export const DASHBOARD_SECTIONS = [
  {
    title: "STRATEGIC",
    items: [
      { id: 'overview', icon: LayoutDashboard, label: "Command Overview", to: "/core" },
      { id: 'trajectory', icon: TrendingUp, label: "Growth Trajectory", to: "/core/trajectory" },
      { id: 'risk', icon: Target, label: "Risk Matrix", to: "/core/risk" },
    ]
  },
  {
    title: "HISTORICAL",
    items: [
      { id: 'archives', icon: History, label: "Data Archives", to: "/core/archives" },
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DepartmentWorkspaceLayout
      title="Command Center"
      subtitle="Enterprise-wide intelligence & strategic growth telemetry."
      headerIcon={LayoutDashboard}
      accentColor="indigo"
      engineName="INTELLIGENCE_ENGINE"
      pulseLabel="Global Sync Active"
      pulseIcon={Activity}
      sections={DASHBOARD_SECTIONS}
      routeLabels={{
        trajectory: "Growth Trajectory",
        risk: "Risk Matrix",
        archives: "Data Archives",
      }}
      basePath="/core"
    >
      {children}
    </DepartmentWorkspaceLayout>
  );
}
