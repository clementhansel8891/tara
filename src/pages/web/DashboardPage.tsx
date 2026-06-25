import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Users, Clock, CalendarDays, AlertTriangle } from "lucide-react";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const stats = [
    { label: t("dashboard.total_employees"), value: "—", icon: Users },
    { label: t("dashboard.present_today"), value: "—", icon: Clock },
    { label: t("dashboard.pending_leave"), value: "—", icon: CalendarDays },
    { label: t("dashboard.late_today"), value: "—", icon: AlertTriangle },
  ];

  const quickActions = [
    { label: t("dashboard.view_leave_requests"), action: () => navigate("/web/leaves") },
    { label: t("dashboard.attendance_report"), action: () => navigate("/web/attendance") },
    { label: t("dashboard.send_announcement"), action: () => toast("Fitur segera hadir") },
    { label: t("dashboard.add_employee"), action: () => navigate("/web/employees") },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-luxury-heading text-2xl">{t("nav.dashboard")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user?.full_name?.split(" ")[0] || "Admin"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="surface-elevated p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-luxury-label">{stat.label}</span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Status */}
        <div className="lg:col-span-2 surface-elevated p-6">
          <h2 className="text-sm font-semibold mb-4">{t("dashboard.agent_status")}</h2>
          <div className="space-y-3">
            {[
              "Leave Request Agent",
              "Absensi Agent",
              "Clock Confirmation Agent",
              "Weekly Checkin Agent",
              "Late Report Agent",
              "Onboarding Agent",
              "Saldo Cuti Agent",
            ].map((agent) => (
              <div key={agent} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm">{agent}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  {t("dashboard.active")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="surface-elevated p-6">
          <h2 className="text-sm font-semibold mb-4">{t("dashboard.quick_actions")}</h2>
          <div className="space-y-2">
            {quickActions.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full text-left px-3 py-2.5 rounded-md text-sm hover:bg-accent transition-colors border border-transparent hover:border-border/50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
