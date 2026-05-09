import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTableShell } from "@/core/tools/DataTableShell";
import { inventoryService } from "@/core/services/inventory/inventoryService";
import { useSession } from "@/core/security/session";
import { FeedbackAlert } from "@/core/tools/FeedbackAlert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";

export function TransferDesk() {
  const session = useSession();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Action Dialogs
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null);
  const [isShipOpen, setIsShipOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryService.listStockTransfers(session.tenant_id, session);
      setTransfers(data);
    } catch (err: any) {
      setErrorMessage("Failed to load transfers: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handlePick = async (id: string) => {
    setIsBusy(true);
    try {
      await inventoryService.pickStockTransfer(session.tenant_id, session, id);
      setStatusMessage("Transfer items picked and reserved.");
      refresh();
    } catch (err: any) {
      setErrorMessage("Picking failed: " + err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleShip = async () => {
    if (!trackingNumber.trim()) {
      setErrorMessage("Tracking number is required.");
      return;
    }
    setIsBusy(true);
    try {
      await inventoryService.shipStockTransfer(session.tenant_id, session, selectedTransfer.id, trackingNumber);
      setStatusMessage("Transfer marked as In-Transit.");
      setIsShipOpen(false);
      setTrackingNumber("");
      refresh();
    } catch (err: any) {
      setErrorMessage("Shipping failed: " + err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleReceive = async (id: string) => {
    setIsBusy(true);
    try {
      await inventoryService.receiveStockTransfer(session.tenant_id, session, id);
      setStatusMessage("Shipment accepted and stock updated.");
      refresh();
    } catch (err: any) {
      setErrorMessage("Receiving failed: " + err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-black italic text-[10px] uppercase">Requested</Badge>;
      case "PICKED":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black italic text-[10px] uppercase">Picked</Badge>;
      case "IN_TRANSIT":
        return <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-black italic text-[10px] uppercase animate-pulse">In-Transit</Badge>;
      case "RECEIVED":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black italic text-[10px] uppercase">Received</Badge>;
      default:
        return <Badge variant="outline" className="font-black italic text-[10px] uppercase">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <FeedbackAlert
        message={statusMessage}
        error={errorMessage}
        onClear={() => {
          setStatusMessage(null);
          setErrorMessage(null);
        }}
      />

      <Card className="rounded-[3rem] border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl overflow-hidden border border-white/10">
        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                 <Truck className="h-6 w-6 text-indigo-400" />
              </div>
              Transfer Desk
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> INTERNAL_LOGISTICS_PIPELINE
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Transfers</p>
                <p className="text-xl font-black text-white italic tracking-tighter">{transfers.length}</p>
             </div>
          </div>
        </div>
        
        <div className="p-0">
          <DataTableShell total={transfers.length} page={1} pageSize={20}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-white/5 text-[10px] uppercase text-slate-500 border-b border-white/5">
                  <th className="p-8 text-left font-black tracking-[0.2em]">Asset Configuration</th>
                  <th className="p-8 text-left font-black tracking-[0.2em]">Logistics Route</th>
                  <th className="p-8 text-left font-black tracking-[0.2em]">Telemetry Status</th>
                  <th className="p-8 text-left font-black tracking-[0.2em]">Temporal Node</th>
                  <th className="p-8 text-right font-black tracking-[0.2em]">Command actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transfers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-slate-600 italic font-black uppercase tracking-widest text-xs">
                      No active telemetry data found in pipeline.
                    </td>
                  </tr>
                )}
                {(Array.isArray(transfers) ? transfers : []).map((t) => (
                  <tr key={t.id} className="group hover:bg-white/5 transition-all duration-300">
                    <td className="p-8">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-black text-white italic tracking-tight text-lg uppercase leading-tight">{t.item_masters.name}</span>
                        <span className="text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase">{t.item_masters.sku}</span>
                        <div className="flex items-center gap-2 mt-2">
                           <div className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                              <Package className="h-3 w-3 text-indigo-400" />
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Qty: {t.quantity}</span>
                           </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Origin</span>
                          <span className="text-xs font-black text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 uppercase italic">{t.from_location.code}</span>
                        </div>
                        <div className="h-px w-8 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent relative">
                           <ArrowRight className="h-3 w-3 text-indigo-400 absolute -top-1.5 left-1/2 -translate-x-1/2" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Target</span>
                          <span className="text-xs font-black text-indigo-400 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 uppercase italic">{t.to_location.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="space-y-3">
                        {getStatusBadge(t.status)}
                        {t.tracking_number && (
                          <div className="text-[10px] text-slate-500 font-black flex items-center gap-2 font-mono uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 w-fit">
                            <Truck className="h-3 w-3 text-indigo-400" /> {t.tracking_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col gap-3">
                        {t.requested_at && (
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Initialization</p>
                             <p className="text-[11px] font-black text-slate-400 uppercase italic">{format(new Date(t.requested_at), "MMM d, HH:mm")}</p>
                          </div>
                        )}
                        {t.received_at && (
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Completion</p>
                             <p className="text-[11px] font-black text-emerald-400 uppercase italic flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3" /> {format(new Date(t.received_at), "MMM d, HH:mm")}
                             </p>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.status === "REQUESTED" && (
                          <Button 
                             size="sm" 
                             variant="outline" 
                             className="h-10 px-6 rounded-xl border-white/10 bg-white/5 font-black italic text-[10px] uppercase tracking-widest gap-2 text-white hover:bg-white/10 transition-all"
                             onClick={() => handlePick(t.id)} 
                             disabled={isBusy}
                          >
                            <ClipboardList className="h-3.5 w-3.5" /> Pick Order
                          </Button>
                        )}
                        {(t.status === "PICKED" || t.status === "REQUESTED") && (
                          <Button 
                             size="sm" 
                             className="h-10 px-6 rounded-xl bg-indigo-600 text-white font-black italic text-[10px] uppercase tracking-widest gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
                             onClick={() => {
                               setSelectedTransfer(t);
                               setIsShipOpen(true);
                             }} 
                             disabled={isBusy}
                          >
                            <Truck className="h-3.5 w-3.5" /> Deploy
                          </Button>
                        )}
                        {t.status === "IN_TRANSIT" && (
                          <Button 
                             size="sm" 
                             className="h-10 px-6 rounded-xl bg-emerald-600 text-white font-black italic text-[10px] uppercase tracking-widest gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
                             onClick={() => handleReceive(t.id)} 
                             disabled={isBusy}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Receipt
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableShell>
        </div>
      </Card>

      {/* Shipping Dialog */}
      <Dialog open={isShipOpen} onOpenChange={setIsShipOpen}>
        <DialogContent className="rounded-[3rem] border-white/10 bg-slate-900/90 backdrop-blur-3xl shadow-2xl sm:max-w-[550px] p-0 overflow-hidden">
          <DialogHeader className="p-10 bg-white/5 border-b border-white/5">
            <DialogTitle className="flex items-center gap-5 text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 border border-white/20">
                <Truck className="h-7 w-7" />
              </div>
              Deploy Shipment
            </DialogTitle>
          </DialogHeader>
          <div className="p-10 space-y-8">
            <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] flex gap-5 text-xs text-indigo-200 leading-relaxed italic font-black uppercase tracking-widest">
               <AlertCircle className="h-6 w-6 text-indigo-400 shrink-0" />
               <p>Initiating deployment protocol. Assets will be transferred to the <strong className="text-white">Transit Pool</strong>. This sequence is irreversible until endpoint verification.</p>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-4">Waybill Telemetry ID</label>
              <Input 
                className="h-16 rounded-2xl bg-white/5 border-white/10 text-white shadow-inner font-black italic tracking-widest placeholder:text-slate-600 focus:ring-indigo-500/50 focus:border-indigo-500"
                placeholder="e.g. TRK_ZVX_9821" 
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-3 p-10 pt-0 bg-transparent">
            <Button 
               variant="outline" 
               className="rounded-2xl font-black italic text-[10px] uppercase tracking-widest h-14 px-8 border-white/10 bg-white/5 text-white hover:bg-white/10" 
               onClick={() => setIsShipOpen(false)} 
               disabled={isBusy}
            >
               Abort Sequence
            </Button>
            <Button 
               className="rounded-2xl bg-white text-slate-950 font-black italic text-[10px] uppercase tracking-widest h-14 px-10 hover:bg-slate-100 shadow-2xl transition-all hover:scale-105" 
               onClick={handleShip} 
               disabled={isBusy}
            >
               Authorize Deployment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
