import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Laptop, Network, ShieldCheck } from "lucide-react";
import { FeedbackAlert } from "@/core/tools/FeedbackAlert";
import { useSession } from "@/core/security/session";
import { itSettingsService, type ITDevice } from "@/core/services/it/itSettingsService";

export default function DeviceDesk() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [devices, setDevices] = useState<ITDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<ITDevice | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const data = await itSettingsService.getDevices(session.tenant_id, session);
        // Hierarchical filtering: 
        // - Super Admin sees all
        // - Owner sees all in tenant
        // - Branch IT sees only their location
        const filteredData = (Array.isArray(data) ? data : []).filter(d => {
          if (session.role === 'SUPERADMIN') return true;
          if (session.role === 'OWNER') return d.tenantId === session.tenant_id;
          return d.locationId === session.location_id;
        });
        setDevices(filteredData);
      } catch (err) {
        setErrorMessage("Failed to fetch devices.");
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, [session, version]);

  const clearStatus = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const filtered = (Array.isArray(devices) ? devices : []).filter((dev) =>
    search ? dev.id.toLowerCase().includes(search.toLowerCase()) || dev.deviceName.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-6">
      <FeedbackAlert message={statusMessage} error={errorMessage} onClear={clearStatus} />
      <PageHeader
        title="Device Matrix"
        subtitle="Hierarchical asset mapping and connectivity orchestration."
        primaryAction={<Button onClick={() => setCreateOpen(true)}>Assign Device</Button>}
        secondaryActions={
          <Input
            placeholder="Search matrix..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px]"
          />
        }
      />

      <WorkspacePanel title="Infrastructure Inventory" description="Physical/logical asset mapping with hierarchical scope.">
        <FilterBar searchValue={search} onSearchChange={setSearch} />
        <DataTableShell total={filtered.length} page={1} pageSize={10}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Device Identity</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Scanning frequency...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">No assets mapped in this scope.</td></tr>
              ) : (
                (Array.isArray(filtered) ? filtered : []).map((dev) => (
                   <tr
                    key={dev.id}
                    className="border-t cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedDevice(dev)}
                  >
                    <td className="p-3 font-medium">
                       <div className="flex flex-col">
                          <span>{dev.deviceName}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{dev.id}</span>
                       </div>
                    </td>
                    <td className="p-3">
                       <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{dev.deviceType}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{dev.locationId || "UNASSIGNED"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                         <span className={cn("h-1.5 w-1.5 rounded-full", dev.status === 'active' || dev.status === 'online' ? "bg-success" : "bg-destructive")} />
                         <span className="text-xs uppercase font-bold">{dev.status}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground text-[10px] italic">{new Date(dev.lastSeen).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableShell>
      </WorkspacePanel>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden" aria-describedby="device-create-description">
          <DialogHeader className="sr-only">
            <DialogTitle>Assign New Device</DialogTitle>
          </DialogHeader>
          <div id="device-create-description" className="sr-only">Register a new IT asset.</div>
          <div className="grid md:grid-cols-[1fr_2fr]">
            <div className="bg-muted p-6 flex flex-col justify-between">
              <div>
                <Laptop className="w-8 h-8 text-primary mb-4" />
                <DialogTitle className="text-xl mb-2">Assign Node</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Register a physical or logical IT asset to the centralized inventory matrix.
                </p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5"><Network className="w-4 h-4 text-muted-foreground" /></div>
                    <div>
                      <p className="font-medium">Topological Mapping</p>
                      <p className="text-muted-foreground text-xs">Define parent connections for visual graph.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg mt-8 border border-primary/10">
                <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Policy Enforcement
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered devices are subject to MDM policies.
                </p>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity</label>
                      <Input placeholder="Device Name" id="reg-device-name" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Class</label>
                      <Select onValueChange={(val) => ((window as any)._regDeviceType = val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="laptop">Workstation</SelectItem>
                          <SelectItem value="mobile">Mobile Node</SelectItem>
                          <SelectItem value="iot">IoT / Edge</SelectItem>
                          <SelectItem value="server">Core Server</SelectItem>
                          <SelectItem value="database">Database Host</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location Context</label>
                      <Input placeholder="Location ID" id="reg-location-id" defaultValue={session.location_id} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Topological Parent</label>
                      <Select onValueChange={(val) => ((window as any)._regParentId = val)}>
                         <SelectTrigger>
                            <SelectValue placeholder="Core Connection" />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="ROOT">ROOT / Gateway</SelectItem>
                            {(Array.isArray(devices) ? devices : []).filter(d => d.deviceType === 'server').map(d => (
                               <SelectItem key={d.id} value={d.id}>{d.deviceName}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border">
                  <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl px-6">Cancel</Button>
                  <Button
                    className="rounded-xl bg-primary text-white px-8"
                    onClick={async () => {
                      try {
                        const deviceName = (document.getElementById("reg-device-name") as HTMLInputElement).value;
                        const locationId = (document.getElementById("reg-location-id") as HTMLInputElement).value;
                        const deviceType = (window as any)._regDeviceType || "iot";
                        const parentId = (window as any)._regParentId;

                        await itSettingsService.registerDevice(session.tenant_id, session, {
                          deviceName,
                          deviceType,
                          locationId,
                          parentId,
                          status: "active",
                        });
                        
                        setCreateOpen(false);
                        setStatusMessage("Infrastructure node registered successfully.");
                        setVersion((prev) => prev + 1);
                      } catch (err) {
                        setErrorMessage("Failed to register node.");
                      }
                    }}
                  >
                    Provision Node
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedDevice} onOpenChange={() => setSelectedDevice(null)}>
        <DialogContent className="max-w-md bg-background p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-8 text-white relative">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Laptop className="h-24 w-24" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Device Management</p>
             <h3 className="text-3xl font-black tracking-tighter uppercase italic">{selectedDevice?.deviceName}</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 text-[10px] font-black uppercase tracking-widest gap-y-4">
              <div className="space-y-1">
                 <span className="text-muted-foreground">Node Identity</span>
                 <p className="text-xs font-mono font-bold">{selectedDevice?.id}</p>
              </div>
              <div className="space-y-1">
                 <span className="text-muted-foreground">Classification</span>
                 <p className="text-xs font-bold">{selectedDevice?.deviceType}</p>
              </div>
              <div className="space-y-1">
                 <span className="text-muted-foreground">Assigned Domain</span>
                 <p className="text-xs font-bold text-primary">{selectedDevice?.locationId || "UNASSIGNED"}</p>
              </div>
              <div className="space-y-1">
                 <span className="text-muted-foreground">Current Vector</span>
                 <p className="text-xs font-bold">{selectedDevice?.status}</p>
              </div>
            </div>
            
            <div className="p-4 rounded-2xl bg-card border border-border text-[9px] text-muted-foreground italic leading-relaxed">
              Managed via LAN-first physical mapping. Last seen: {selectedDevice ? new Date(selectedDevice.lastSeen).toLocaleString() : "N/A"}. Security policies active.
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest py-6 border-slate-200 dark:border-slate-800"
                onClick={async () => {
                  try {
                    if (selectedDevice) {
                      await itSettingsService.updateDeviceStatus(session.tenant_id, session, selectedDevice.id, "audited");
                      setStatusMessage(`Audit signal sent for device ${selectedDevice.deviceName}.`);
                      setVersion((prev) => prev + 1);
                      setSelectedDevice(null);
                    }
                  } catch (err) {
                    setErrorMessage("Failed to trigger audit.");
                  }
                }}
              >
                Trigger Deep Audit
              </Button>
              <Button
                variant="destructive"
                className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest py-6 shadow-xl shadow-rose-500/20"
                onClick={async () => {
                  try {
                    if (selectedDevice) {
                      await itSettingsService.updateDeviceStatus(session.tenant_id, session, selectedDevice.id, "wiped");
                      setStatusMessage(`Wipe command queued for ${selectedDevice.deviceName}. Security policy enforced.`);
                      setVersion((prev) => prev + 1);
                      setSelectedDevice(null);
                    }
                  } catch (err) {
                    setErrorMessage("Remote wipe failed.");
                  }
                }}
              >
                Execute Remote Wipe
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
