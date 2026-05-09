import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  TrendingUp, 
  MapPin, 
  History, 
  Edit3, 
  Trash2, 
  Activity,
  Box,
  BarChart2,
  Tag
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/core/api/apiClient";
import { useSession } from "@/core/security/session";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ItemDetailsModalProps {
  item: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function ItemDetailsModal({
  item,
  open,
  onOpenChange,
  onUpdated,
}: ItemDetailsModalProps) {
  const session = useSession();
  const [movements, setMovements] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && item) {
      fetchExtraData();
    }
  }, [open, item]);

  const fetchExtraData = async () => {
    setLoading(true);
    try {
      const [moveData, balanceData] = await Promise.all([
        apiRequest<any[]>(`/inventory/movements?item_id=${item.id}`, "GET", session),
        apiRequest<any[]>(`/inventory/balances?item_id=${item.id}`, "GET", session),
      ]);
      setMovements(moveData || []);
      setBalances(balanceData || []);
    } catch (error: any) {
      console.error("Failed to fetch details", error);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-950 p-0 overflow-hidden">
        <div className="bg-slate-900 p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em]">
                <Package className="h-3 w-3" /> SKU: {item.sku}
              </div>
              <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic">
                {item.name}
              </DialogTitle>
            </div>
            <Badge variant="outline" className="border-indigo-500/50 text-indigo-400 font-black tracking-[0.2em] rounded-xl px-4 py-1.5 uppercase">
              {item.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Category</span>
              <p className="font-bold">{item.category || "General"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Unit of Measure</span>
              <p className="font-bold">{item.uom || item.unit || "Units"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Available Stock</span>
              <p className="text-2xl font-black text-indigo-400">{item.currentStock || 0}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Threshold</span>
              <p className="font-bold text-rose-400">{item.minStock || 0}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-slate-100 dark:bg-slate-900 p-1 mb-8">
              <TabsTrigger value="overview" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Overview</TabsTrigger>
              <TabsTrigger value="movements" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Movements</TabsTrigger>
              <TabsTrigger value="locations" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Storage Nodes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Activity className="h-3 w-3" /> Item Description
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium italic">
                    {item.description || "No description provided for this item identity."}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <BarChart2 className="h-3 w-3" /> Quick Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">In Transit</p>
                      <p className="text-xl font-black">0</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Reserved</p>
                      <p className="text-xl font-black">0</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t">
                <Button variant="outline" className="rounded-xl h-12 px-6 font-black text-[10px] uppercase tracking-widest border-slate-200">
                  <Edit3 className="h-3 w-3 mr-2" /> Edit Identity
                </Button>
                <Button variant="outline" className="rounded-xl h-12 px-6 font-black text-[10px] uppercase tracking-widest text-rose-500 border-rose-100 hover:bg-rose-50">
                  <Trash2 className="h-3 w-3 mr-2" /> Decommission
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="movements">
              <ScrollArea className="h-[400px] pr-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                  </div>
                ) : movements.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center opacity-20 italic">
                    <History className="h-12 w-12 mb-2" />
                    <p className="font-bold">No movement history</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {movements.map((move, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${move.quantity > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {move.quantity > 0 ? <TrendingUp className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest">{move.movement_type}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{move.reference_id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${move.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {move.quantity > 0 ? '+' : ''}{move.quantity}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400">{new Date(move.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="locations">
               <ScrollArea className="h-[400px] pr-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                  </div>
                ) : balances.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center opacity-20 italic">
                    <MapPin className="h-12 w-12 mb-2" />
                    <p className="font-bold">No storage data</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {balances.map((bal, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest">Storage Node #{bal.location_id.slice(0,4)}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Available for deployment</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-slate-900 dark:text-white">
                            {bal.quantity}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">On Hand</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
