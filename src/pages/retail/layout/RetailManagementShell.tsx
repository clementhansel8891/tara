import * as React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PageHeader } from "@/core/ui/PageHeader";
import { PageShell } from "@/core/ui/PageShell";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { useSession } from "@/core/security/session";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Store,
  Users,
  Clock,
  Globe,
  PackageCheck,
  Tag,
  Eye,
  Layout,
  Home,
  Clock,
  UserCircle,
  ShoppingCart,
  ArrowDownLeft,
  Archive,
  History,
  ShieldCheck,
  GitBranch,
  Cpu,
  Briefcase,
  Settings
} from "lucide-react";
import { useRetail } from "../context/RetailContext";
import { RetailModeSwitchControl } from "../components/RetailModeSwitchControl";
import { RetailContextSwitcher } from "../components/RetailContextSwitcher";

type MenuItem = { label: string; to: string; icon: React.ElementType };
type MenuSection = { title: string; items: MenuItem[] };

const SECTIONS: MenuSection[] = [
  {
    title: "Core Governance",
    items: [
      { label: "Retail Home", to: "/m/retail/workspace", icon: Layout },
      { label: "Command Center", to: "/m/retail/management/dashboard", icon: BarChart3 },
      { label: "Store Profile", to: "/m/retail/management/profile", icon: Store },
      { label: "Audit Ledger", to: "/m/retail/management/audit", icon: ShieldCheck },
    ],
  },
  {
    title: "Inventory & Fulfilment",
    items: [
      { label: "Fulfillment Hub", to: "/m/retail/management/orders", icon: PackageCheck },
      { label: "Inventory Visibility", to: "/m/retail/management/inventory", icon: Eye },
      { label: "Pricing Desk", to: "/m/retail/management/pricing", icon: Tag },
      { label: "Stock Request", to: "/m/retail/management/prs?dept=RETAIL", icon: ShoppingCart },
      { label: "Stock Intake", to: "/m/retail/operational/receiving", icon: ArrowDownLeft },
      { label: "Stock Opname", to: "/m/retail/operational/opname", icon: Archive },
    ],
  },
  {
    title: "Workforce & Compliance",
    items: [
      { label: "Shift Control", to: "/m/retail/management/shifts", icon: Clock },
      { label: "Staff Assignments", to: "/m/retail/management/staff", icon: Users },
      { label: "Staff Schedule", to: "/m/retail/management/schedule", icon: Briefcase },
      { label: "Attendance Tracker", to: "/m/retail/management/attendance", icon: Clock },
      { label: "Staff Portal", to: "/m/retail/management/portal", icon: UserCircle },
    ],
  },
  {
    title: "Infrastructure & Logs",
    items: [
      { label: "Device Control", to: "/m/retail/management/devices", icon: Cpu },
      { label: "Infra Control", to: "/m/retail/management/infrastructure", icon: Globe },
      { label: "Administrative", to: "/m/retail/management/admin", icon: Settings },
      { label: "System Logs", to: "/m/retail/management/logs?scope=RETAIL", icon: History },
      { label: "Workflow Inbox", to: "/m/retail/management/workflow?scope=RETAIL", icon: GitBranch },
    ],
  },
];

const ROUTE_LABELS: Record<string, string> = Object.fromEntries(
  SECTIONS.flatMap((section) =>
    (Array.isArray(section.items) ? section.items : []).map((item) => [
      item.to.replace("/m/retail/", ""),
      item.label,
    ]),
  ),
);

export const RetailManagementShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const session = useSession();
  const { activeStore, activeChannel, isConfigured } = useRetail();
  const location = useLocation();

  const segments = location.pathname
    .replace("/m/retail", "")
    .split("/")
    .filter(Boolean);
  const breadcrumbs = (Array.isArray(segments) ? segments : []).map((segment, index) => ({
    label: ROUTE_LABELS[segment] ?? segment.replace(/-/g, " "),
    path: `/m/retail/${segments.slice(0, index + 1).join("/")}`,
  }));

  return (
    <div className="min-h-screen bg-background">
      <PageShell
        header={
          <div className="space-y-1.5 p-4 md:p-6 bg-surface-2/40 backdrop-blur-xl border-b border-border/50 transition-premium">
            <Breadcrumb>
              <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/core">CORE</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-primary/40" />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/m/retail/workspace">RETAIL HUB</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
                {(Array.isArray(breadcrumbs) ? breadcrumbs : []).map((item, index) => (
                  <React.Fragment key={item.path}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={item.path}>
                            {item.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex justify-between items-center py-2 px-1">
              <PageHeader
                title="Retail Management"
                subtitle="Enterprise-grade multi-store governance and control."
              />
              <div className="flex items-center gap-4">
                <RetailContextSwitcher />
                <div className="h-6 w-px bg-border/40" />
                <RetailModeSwitchControl />
              </div>
            </div>
          </div>
        }
        left={
          <div className="space-y-6 p-6">
            <WorkspacePanel className="grad-primary text-primary-foreground p-6 rounded-[2rem] shadow-2xl overflow-hidden relative border border-white/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 animate-glow" />
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl">
                    {activeChannel ? (
                      <Globe className="w-6 h-6 text-white" />
                    ) : (
                      <Store className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 leading-none mb-1">
                      Business Entity
                    </span>
                    <p className="text-sm font-black italic tracking-tighter truncate max-w-[140px] uppercase">
                      {activeStore?.name ||
                        activeChannel?.name ||
                        "Zenvix Retail Hub"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                      Scope
                    </span>
                    <span className="text-[10px] font-black truncate max-w-[100px] text-white uppercase italic">
                      {activeStore?.name ? "Enterprise" : "Global"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                      Branch ID
                    </span>
                    <span className="text-[10px] font-black text-white uppercase truncate max-w-[100px] italic">
                      {activeStore?.name || "RETAIL_ROOT"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
                      Operator
                    </span>
                    <span className="text-[10px] font-black text-white uppercase truncate max-w-[100px] italic">
                      {session?.user_id?.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>
            </WorkspacePanel>

            <div className="space-y-8">
              {(Array.isArray(SECTIONS) ? SECTIONS : []).map((section) => (
                <div key={section.title} className="space-y-4">
                  <p className="px-4 text-label">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {(Array.isArray(section.items) ? section.items : []).map((item) => {
                      const Icon = item.icon;
                      const isDisabled =
                        !isConfigured && item.to !== "/m/retail/workspace";
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.to === "/m/retail/workspace"}
                          onClick={(e) => {
                            if (isDisabled) e.preventDefault();
                          }}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-4 rounded-xl px-4 py-3 text-[13px] font-black italic uppercase tracking-tighter transition-premium group",
                              isDisabled
                                ? "opacity-30 cursor-not-allowed pointer-events-none grayscale"
                                : isActive
                                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02] border border-white/10"
                                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                            )
                          }
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 transition-colors",
                              !isDisabled && "text-primary group-hover:text-primary",
                            )}
                          />
                          <span className="tracking-tight uppercase">
                            {item.label}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
        footer={
          <div className="pt-12 pb-8 border-t border-border/50 flex justify-between items-center px-4 transition-premium hover:opacity-100 opacity-80">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-label-foreground">© 2026 ZENVIX RETAIL SYSTEM • V1.0.X_PATCH_EST</p>
              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span>IDENTITY: {activeStore?.name || "GLOBAL"}</span>
                <span>OS: WINDOWS_X64</span>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <span className="flex items-center gap-2 group cursor-default">
                <div className="w-1.5 h-1.5 rounded-full bg-success shadow-success/40 status-glow" />
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">API_UPLINK: <span className="text-success">ACTIVE</span></span>
              </span>
              <span className="flex items-center gap-2 group cursor-default">
                <div className="w-1.5 h-1.5 rounded-full bg-success shadow-success/40 status-glow" />
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">WEBSOCKET: <span className="text-success">ENCRYPTED</span></span>
              </span>
              <span className="flex items-center gap-2 group cursor-default">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-primary/40 status-glow" />
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">NODE_HEALTH: <span className="text-primary">NOMINAL</span></span>
              </span>
            </div>
          </div>
        }
      >
        {children}
      </PageShell>
    </div>
  );
};

