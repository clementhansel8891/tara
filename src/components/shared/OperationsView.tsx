import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Loader2,
  Zap,
  PhoneCall
} from "lucide-react";
import { useSession } from "@/core/security/session";
import { adminService } from "@/core/services/adminService";
import { RequestModal } from "@/core/ui/RequestModal";
import { useToast } from "@/hooks/use-toast";
import { LiveModuleActivity } from "@/components/dashboard/LiveModuleActivity";
import { GlobalSyncHealthPanel } from "@/components/dashboard/GlobalSyncHealthPanel";
import { WorkflowPipeline } from "@/components/dashboard/WorkflowPipeline";
import { OperationalAlertsQueue } from "@/components/dashboard/OperationalAlertsQueue";
import { OperationalChecklist } from "@/components/dashboard/OperationalChecklist";
import { DeviceNetworkTable } from "@/components/dashboard/DeviceNetworkTable";
import { RetailShiftMatrix } from "@/components/dashboard/RetailShiftMatrix";
import { AuditIntegrityPanel } from "@/components/dashboard/AuditIntegrityPanel";
import { TacticalPayload } from "@/types/dashboard.types";

export function OperationsView() {
  const session = useSession();
  const { toast } = useToast();
  const [tacticalData, setTacticalData] = useState<TacticalPayload['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getDashboardTactical(session);
        if (res) {
          setTacticalData(res);
        }
      } catch (err) {
        console.error("Failed to load tactical flow data", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  const handleLaunchBridge = async (data: { title: string; reason: string }) => {
    try {
      await adminService.createRequest(session.tenant_id, session, {
        type: "incident_bridge",
        title: data.title,
        detail: data.reason,
      });
      toast({ title: "Incident Bridge Requested" });
    } catch (err) {
      toast({ title: "Bridge Initiation Failed", variant: "destructive" });
    }
  };

  if (loading || !tacticalData) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading Tactical Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
      {/* Tactical Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-2xl bg-card border border-border shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10 border border-warning/20">
            <Zap className="h-7 w-7 text-warning" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter italic text-foreground">Live Operations Flow</h2>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Tactical Control Layer v2.0</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="h-12 rounded-xl bg-primary text-primary-foreground px-8 font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-primary/90 transition-all active:scale-95"
        >
          <PhoneCall className="mr-3 h-4 w-4" />
          Launch Incident Bridge
        </Button>
      </div>

      {/* Primary Telemetry Layer */}
      <LiveModuleActivity data={tacticalData.moduleActivity} />

      {/* System Integrity Layer */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlobalSyncHealthPanel data={tacticalData.syncHealth} />
        <AuditIntegrityPanel data={tacticalData.auditIntegrity} />
      </div>

      {/* Retail Shift Matrix — full width */}
      <RetailShiftMatrix data={tacticalData.retailShifts} />

      {/* Workflow Pipeline */}
      <WorkflowPipeline data={tacticalData.workflowItems} />

      {/* Edge & Alerts Layer */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DeviceNetworkTable data={tacticalData.iotDevices} />
        <div className="space-y-6">
          <OperationalAlertsQueue data={tacticalData.alertsQueue} />
          <OperationalChecklist />
        </div>
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
