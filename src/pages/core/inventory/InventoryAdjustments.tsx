import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input as UIInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { FilterBar } from "@/core/tools/FilterBar";
import { useSession } from "@/core/security/session";
import { inventoryService } from "@/core/services/inventory/inventoryService";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import type {
  InventoryAdjustmentRequest,
  InventoryItemMaster,
} from "@/core/types/inventory/inventory";
import { Activity, Box, Database, History, MapPin, User, FileText, PlusCircle, LayoutList } from "lucide-react";

export default function InventoryAdjustments() {
  const session = useSession();
  const [search, setSearch] = useState("");
  const [itemId, setItemId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [delta, setDelta] = useState("0");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [adjustments, setAdjustments] = useState<InventoryAdjustmentRequest[]>([]);
  const [items, setItems] = useState<InventoryItemMaster[]>([]);
  const [locations, setLocations] = useState<Record<string, unknown>[]>([]);
  const [departments, setDepartments] = useState<Record<string, unknown>[]>([]);
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);
  
  const [selectedAdj, setSelectedAdj] = useState<InventoryAdjustmentRequest | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [adj, itm, loc, dep, emp] = await Promise.all([
        inventoryService.listAdjustments(session.tenant_id, session),
        inventoryService.listItems(session.tenant_id, session),
        inventoryService.listLocations(session.tenant_id, session),
        inventoryService.listDepartments(session.tenant_id, session),
        inventoryService.listEmployees(session.tenant_id, session),
      ]);
      setAdjustments(adj);
      setItems(itm);
      setLocations(loc);
      setDepartments(dep);
      setEmployees(emp);
    } catch (err) {
      console.error("Failed to fetch inventory adjustments data:", err);
      toast({
        title: "Error",
        description: "Failed to load adjustment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const list = Array.isArray(adjustments) ? adjustments : [];
    return list.filter((item) =>
      search
        ? `${item.id} ${item.reason} ${item.status}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
    );
  }, [adjustments, search]);

  const pendingAdjustments = useMemo(
    () => filtered.filter(a => a.status.toUpperCase() === "PENDING_APPROVAL"),
    [filtered]
  );

  const processedAdjustments = useMemo(
    () => filtered.filter(a => ["APPROVED", "REJECTED"].includes(a.status.toUpperCase())),
    [filtered]
  );


  const handleRequest = async () => {
    if (!itemId || !locationId || !delta || !reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.requestAdjustment(
        session.tenant_id,
        session,
        {
          item_id: itemId,
          location_id: locationId,
          department_id: departmentId || undefined,
          requested_delta: Number(delta || "0"),
          reason: reason,
        },
      );
      
      toast({
        title: "Success",
        description: "Adjustment request submitted successfully.",
      });
      
      setItemId("");
      setReason("");
      setDelta("0");
      refresh();
    } catch (err: unknown) {
      toast({
        title: "Request Failed",
        description: err instanceof Error ? err.message : "Could not submit adjustment request.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await inventoryService.approveAdjustment(
        session.tenant_id,
        session,
        id,
      );
      toast({
        title: "Approved",
        description: "Adjustment has been applied to stock levels.",
      });
      setSelectedAdj(null);
      refresh();
    } catch (err: unknown) {
      toast({
        title: "Approval Failed",
        description: err instanceof Error ? err.message : "Could not approve adjustment.",
        variant: "destructive"
      });
    }
  };

  const getRequesterInfo = (userId: string) => {
    if (userId === 'system') return { name: 'System Automator', role: 'CORE_ENGINE' };
    const emp = employees.find(e => e.userId === userId || e.id === userId);
    if (emp) return { name: `${emp.firstName} ${emp.lastName}`, role: emp.role || emp.positions || 'MEMBER' };
    return { name: `ID: ${userId.slice(0, 8)}...`, role: 'EXTERNAL_USER' };
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground font-bold italic animate-pulse">Loading adjustments engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      <PageHeader
        title="Adjustment Command"
        subtitle="Stock reconciliation & approval-gated corrections hub"
        secondaryActions={
          <div className="flex items-center gap-3 bg-secondary/40 p-1.5 rounded-2xl border border-border">
            <FilterBar searchValue={search} onSearchChange={setSearch} />
          </div>
        }
      />

      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3 rounded-2xl bg-secondary/40 p-1 mb-8 border border-border">
          <TabsTrigger value="queue" className="rounded-xl flex items-center gap-2">
            <LayoutList className="h-4 w-4" />
            Adjustment Queue
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="create" className="rounded-xl flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            New Request
          </TabsTrigger>
        </TabsList>


        <TabsContent value="queue">
          <WorkspacePanel
            title="Active Queue"
            description="View and manage pending stock correction requests."
            icon={Activity}
          >
            <DataTableShell total={pendingAdjustments.length} page={1} pageSize={10}>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reference</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item Info</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Storage Node</th>
                    <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Delta Impact</th>
                    <th className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {pendingAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-muted-foreground font-bold italic">
                        No pending adjustment requests.
                      </td>
                    </tr>
                  ) : (
                    pendingAdjustments.map((item) => (

                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedAdj(item)}
                        className="group hover:bg-secondary/20 cursor-pointer transition-all border-l-2 border-l-transparent hover:border-l-primary"
                      >
                        <td className="p-4">
                          <div className="font-mono text-[11px] font-bold text-muted-foreground">
                            #{item.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-foreground">
                            {items.find(i => i.id === item.item_id)?.name || item.item_id}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
                            {items.find(i => i.id === item.item_id)?.sku || "N/A"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span className="font-bold text-muted-foreground text-xs">
                              {locations.find(l => l.id === item.location_id)?.name || item.location_id}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className={cn(
                            "font-black text-sm",
                            item.requested_delta > 0 ? "text-success" : "text-destructive"
                          )}>
                            {item.requested_delta > 0 ? "+" : ""}{item.requested_delta} Units
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className={cn(
                            "font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border-none shadow-sm",
                            item.status.toUpperCase() === "APPROVED" ? "bg-success/10 text-success" :
                            item.status.toUpperCase() === "REJECTED" ? "bg-destructive/10 text-destructive" :
                            "bg-primary/10 text-primary animate-pulse"
                          )}>
                            {item.status.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </DataTableShell>
          </WorkspacePanel>
        </TabsContent>

        <TabsContent value="history">
          <WorkspacePanel
            title="Processed History"
            description="Archive of approved and rejected stock corrections."
            icon={History}
          >
            <DataTableShell total={processedAdjustments.length} page={1} pageSize={10}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reference</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item Info</th>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Storage Node</th>
                    <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Delta Impact</th>
                    <th className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {processedAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-muted-foreground font-bold italic">
                        No historical records found.
                      </td>
                    </tr>
                  ) : (
                    processedAdjustments.map((item) => (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedAdj(item)}
                        className="group hover:bg-secondary/20 cursor-pointer transition-all border-l-2 border-l-transparent hover:border-l-success/50"
                      >
                        <td className="p-4">
                          <div className="font-mono text-[11px] font-bold text-muted-foreground">
                            #{item.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-foreground">
                            {items.find(i => i.id === item.item_id)?.name || item.item_id}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
                            {items.find(i => i.id === item.item_id)?.sku || "N/A"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-success/50" />
                            <span className="font-bold text-muted-foreground text-xs">
                              {locations.find(l => l.id === item.location_id)?.name || item.location_id}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className={cn(
                            "font-black text-sm",
                            item.requested_delta > 0 ? "text-success/80" : "text-destructive/80"
                          )}>
                            {item.requested_delta > 0 ? "+" : ""}{item.requested_delta} Units
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className={cn(
                            "font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border-none shadow-sm",
                            item.status.toUpperCase() === "APPROVED" ? "bg-success/10 text-success" :
                            "bg-destructive/10 text-destructive"
                          )}>
                            {item.status.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </DataTableShell>
          </WorkspacePanel>
        </TabsContent>


        <TabsContent value="create">
          <WorkspacePanel
            title="New Adjustment Protocol"
            description="Submit stock correction for manager approval."
            icon={Box}
          >
            <div className="max-w-2xl space-y-8 p-4">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Product</label>
                <Select value={itemId} onValueChange={setItemId}>
                  <SelectTrigger className="w-full bg-secondary/40 border-border rounded-xl font-bold h-14">
                    <SelectValue placeholder="Identify product to adjust..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-background max-h-80">
                    {items.map(item => (
                      <SelectItem key={item.id} value={item.id} className="font-bold">
                        {item.name} <span className="text-muted-foreground opacity-50 ml-2">[{item.sku}]</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Location / Node</label>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger className="w-full bg-secondary/40 border-border rounded-xl font-bold h-14">
                      <SelectValue placeholder="Select warehouse..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border bg-background">
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id} className="font-bold">
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Department</label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger className="w-full bg-secondary/40 border-border rounded-xl font-bold h-14">
                      <SelectValue placeholder="Departmental scope..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border bg-background">
                      {departments.map(dep => (
                        <SelectItem key={dep.id} value={dep.id} className="font-bold">
                          {dep.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="md:col-span-1 space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Delta Delta (+/-)</label>
                  <UIInput
                    type="number"
                    placeholder="0"
                    value={delta}
                    onChange={(e) => setDelta(e.target.value)}
                    className="h-14 bg-secondary/40 border-border rounded-xl font-black text-2xl text-center text-primary focus:border-primary"
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Justification Reason</label>
                  <UIInput
                    placeholder="Briefly explain this correction..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-14 bg-secondary/40 border-border rounded-xl font-bold"
                  />
                </div>
              </div>

              <Button 
                onClick={handleRequest} 
                disabled={submitting}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 font-black uppercase tracking-widest shadow-xl shadow-primary/10 group transition-all transform hover:scale-[1.01] active:scale-[0.99] text-foreground"
              >
                {submitting ? "Processing Correction..." : "Authenticate & Request"}
                {!submitting && <Activity className="ml-2 h-5 w-5 group-hover:animate-pulse" />}
              </Button>
            </div>
          </WorkspacePanel>
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      <Dialog open={!!selectedAdj} onOpenChange={(open) => !open && setSelectedAdj(null)}>
        <DialogContent className="max-w-xl bg-background border-border rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          {selectedAdj && (
            <>
              <DialogHeader className="h-24 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border p-8 flex flex-row items-end justify-between m-0 space-y-0 rounded-t-[2.5rem]">
                <div>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Adjustment Analysis</DialogTitle>
                  <DialogDescription className="sr-only">Detailed analysis of the requested inventory adjustment.</DialogDescription>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Request ID #{selectedAdj.id.slice(0, 8)}</p>
                </div>
              </DialogHeader>
              
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                        <Box className="h-5 w-5 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product</p>
                        <p className="font-bold text-foreground truncate">{items.find(i => i.id === selectedAdj.item_id)?.name || "Unknown"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</p>
                        <p className="font-bold text-foreground">{locations.find(l => l.id === selectedAdj.location_id)?.name || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Delta Impact</p>
                        <p className={cn("font-black text-2xl tracking-tighter", selectedAdj.requested_delta > 0 ? "text-success" : "text-destructive")}>
                          {selectedAdj.requested_delta > 0 ? "+" : ""}{selectedAdj.requested_delta} Units
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Requested By</p>
                        <p className="font-bold text-foreground text-sm">{getRequesterInfo(selectedAdj.requested_by).name}</p>
                        <p className="text-[9px] font-black uppercase text-primary/70">{getRequesterInfo(selectedAdj.requested_by).role}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-secondary/40 rounded-[2rem] border border-border space-y-3 shadow-inner">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Justification Statement</span>
                  </div>
                  <p className="text-sm font-bold text-foreground leading-relaxed italic opacity-90">
                    "{selectedAdj.reason}"
                  </p>
                </div>
              </div>

              <DialogFooter className="p-8 bg-secondary/20 border-t border-border gap-3">
                {selectedAdj.status.toUpperCase() === "PENDING_APPROVAL" ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedAdj(null)}
                      className="rounded-xl font-black uppercase tracking-widest border-border px-6"
                    >
                      Hold
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        toast({ title: "Feature Pending", description: "Rejection logic coming soon." });
                      }}
                      className="rounded-xl font-black uppercase tracking-widest px-6"
                    >
                      Reject
                    </Button>
                    <Button 
                      onClick={() => handleApprove(selectedAdj.id)}
                      className="rounded-xl font-black uppercase tracking-widest bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20 flex-1 h-12"
                    >
                      Approve & Apply
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedAdj(null)}
                    className="w-full h-12 rounded-xl font-black uppercase tracking-widest border-border"
                  >
                    Close Record
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
