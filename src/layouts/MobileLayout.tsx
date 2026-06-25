import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Clock, CalendarDays, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppFooter } from "@/components/AppFooter";

const bottomNav = [
  { to: "/m", icon: Home, labelKey: "nav.dashboard", end: true },
  { to: "/m/clock", icon: Clock, labelKey: "nav.attendance" },
  { to: "/m/leave", icon: CalendarDays, labelKey: "nav.leaves" },
  { to: "/m/notifications", icon: Bell, labelKey: "nav.notifications" },
  { to: "/m/profile", icon: User, labelKey: "profile.my_profile" },
];

export function MobileLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">
      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <AppFooter className="border-t-0" />

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around h-16 border-t border-border bg-card/80 backdrop-blur-sm safe-area-bottom">
        {bottomNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[48px]",
                isActive
                  ? "text-gold"
                  : "text-muted-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-2xs font-medium">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
