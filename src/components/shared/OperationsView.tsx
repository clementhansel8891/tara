import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Globe2,
  Layers,
  Timer,
  ServerCrash,
  Link2,
  Database,
  Loader2,
} from "lucide-react";
import { useSession } from "@/core/security/session";
import { itService } from "@/core/services/it/itService";
import { adminService } from "@/core/services/adminService";
import { RequestModal } from "@/core/ui/RequestModal";
import { useToast } from "@/hooks/use-toast";

const moduleActivity = [
  { id: "mod-1", name: "Retail Ops", status: "Stable", throughput: "2.1k tx/hr", latency: "120 ms" },
  { id: "mod-2", name: "F&B Operations", status: "Degraded", throughput: "1.5k tx/hr", latency: "260 ms" },
  { id: "mod-3", name: "Workforce", status: "Stable", throughput: "840 tx/hr", latency: "95 ms" },
  { id: "mod-4", name: "Compliance", status: "Stable", throughput: "210 checks/hr", latency: "180 ms" },
];

const alertsQueue = [
  { id: "alert-1", title: "Payment gateway retry queue growing", detail: "Asia Pacific region experiencing elevated latency.", severity: "High", time: "7 minutes ago" },
  { id: "alert-2", title: "Store #221 inventory sync delayed", detail: "Last sync 48 minutes ago.", severity: "Medium", time: "38 minutes ago" },
  { id: "alert-3", title: "Workforce onboarding backlog", detail: "12 requests pending in HR queue.", severity: "Low", time: "Today, 06:20" },
];

const checklistItems = [
  { id: "check-1", label: "Morning store health check", status: "Complete" },
  { id: "check-2", label: "Daily financial reconciliation", status: "In progress" },
  { id: "check-3", label: "Critical alerts review", status: "Complete" },
  { id: "check-4", label: "Vendor SLAs verified", status: "Pending" },
];

const tenantVisibility = [
  { id: "ten-1", name: "North America", uptime: "99.98%", incidents: "2 open" },
  { id: "ten-2", name: "Asia Pacific", uptime: "99.72%", incidents: "5 open" },
  { id: "ten-3", name: "EMEA", uptime: "99.91%", incidents: "1 open" },
];

const statusBadge = (status: string) => {
  if (status === "Stable") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Degraded") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
};

export function OperationsView() {
  const session = useSession();
  const { toast } = useToast();
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [iotDevices, setIotDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [itOverview, sync, iot] = await Promise.all([
          itService.getOverview(session.tenant_id, session),
          adminService.getSyncStatus(session),
          adminService.getIotDevices(session)
        ]);
        setOverviewData(itOverview);
        setSyncStatus(sync.data);
        setIotDevices(iot.data);
      } catch (err) {
        console.error("Failed to load operations data", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  const handleInspect = async (component: string) => {
    try {
      const health = await itService.getSystemHealth(session.tenant_id, session);
      const filtered = (Array.isArray(health) ? health : []).filter(h => h.component.toLowerCase().includes(component.toLowerCase()));
      
      if (filtered.length > 0) {
        toast({
          title: `Health Check: ${component}`,
          description: `Nodes: ${filtered.length} | Avg Latency: ${Math.round(filtered.reduce((acc, curr) => acc + curr.latencyMs, 0) / filtered.length)}ms`,
        });
      } else {
        toast({ title: "Health Check", description: `No active nodes found for ${component}.` });
      }
    } catch (err) {
      toast({ title: "Health Check Failed", variant: "destructive" });
    }
  };

  const handleLaunchBridge = async (data: { title: string; reason: string }) => {
    try {
      await adminService.createRequest(session.tenant_id, session, {
        type: "INCIDENT_BRIDGE",
        title: data.title,
        description: data.reason,
      });
      toast({ title: "Incident Bridge Requested" });
    } catch (err) {
      toast({ title: "Bridge Initiation Failed", variant: "destructive" });
    }
  };

  const retailStats = overviewData?.moduleContributions?.retail;

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)}>Launch Incident Bridge</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkspacePanel title="Global Sync Health" description="Operational data synchronization.">
          {syncStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-3">
                  <Database className={`h-5 w-5 ${syncStatus.is_healthy ? 'text-emerald-500' : 'text-rose-500'}`} />
                  <div>
                    <p className="text-sm font-semibold">Persistence Queue</p>
                    <p className="text-xs text-muted-foreground">{syncStatus.pending_count} pending</p>
                  </div>
                </div>
                <Badge variant={syncStatus.is_healthy ? "outline" : "destructive"}>{syncStatus.status}</Badge>
              </div>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          )}
        </WorkspacePanel>

        <WorkspacePanel title="Edge IoT Network" description="Connected hardware telemetry status.">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded bg-muted/30 border">
              <p className="text-xs text-muted-foreground uppercase">Online</p>
              <p className="text-lg font-bold text-emerald-500">{(Array.isArray(iotDevices) ? iotDevices : []).filter(d => d.status === 'ONLINE').length}</p>
            </div>
            <div className="text-center p-2 rounded bg-muted/30 border">
              <p className="text-xs text-muted-foreground uppercase">Offline</p>
              <p className="text-lg font-bold text-rose-500">{(Array.isArray(iotDevices) ? iotDevices : []).filter(d => d.status === 'OFFLINE').length}</p>
            </div>
            <div className="text-center p-2 rounded bg-muted/30 border">
              <p className="text-xs text-muted-foreground uppercase">Alerts</p>
              <p className="text-lg font-bold text-amber-500">{(Array.isArray(iotDevices) ? iotDevices : []).filter(d => d.status === 'ALERT').length}</p>
            </div>
          </div>
        </WorkspacePanel>
      </div>

      {retailStats && (
        <WorkspacePanel title="Retail Infrastructure" description="Live device health from Retail module.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border p-5 bg-indigo-50/30">
              <span className="text-sm font-medium">POS Online</span>
              <p className="text-3xl font-bold">{retailStats.posDevices?.online || 0}</p>
            </div>
            <div className="rounded-xl border p-5 bg-rose-50/30">
              <span className="text-sm font-medium">POS Offline</span>
              <p className="text-3xl font-bold">{retailStats.posDevices?.offline || 0}</p>
            </div>
          </div>
        </WorkspacePanel>
      )}

      <WorkspacePanel title="Live Module Activity" description="Operational throughput.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(Array.isArray(moduleActivity) ? moduleActivity : []).map((module) => (
            <div key={module.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{module.name}</p>
                  <p className="text-xs text-muted-foreground">{module.throughput}</p>
                </div>
                <Badge variant="outline" className={statusBadge(module.status)}>{module.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </WorkspacePanel>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <WorkspacePanel title="Alerts & Issues" description="Escalations requiring review.">
          <div className="space-y-4">
            {(Array.isArray(alertsQueue) ? alertsQueue : []).map((alertItem) => (
              <div key={alertItem.id} className="rounded-lg border p-4">
                <p className="text-sm font-medium">{alertItem.title}</p>
                <p className="text-xs text-muted-foreground">{alertItem.detail}</p>
                <Badge className="mt-2">{alertItem.severity}</Badge>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Operational Checklist" description="Daily control points.">
          <div className="space-y-3">
            {(Array.isArray(checklistItems) ? checklistItems : []).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`h-4 w-4 ${item.status === 'Complete' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>
      </div>

      <RequestModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleLaunchBridge}
        title="Launch Incident Bridge"
        description="Establish emergency communication."
        defaultTitle="Incident Bridge Request"
      />
    </div>
  );
}
