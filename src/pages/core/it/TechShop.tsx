import { useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  Layers,
  Monitor,
  Smartphone,
  Printer,
  ChevronRight,
  Loader2,
  Package
} from "lucide-react";
import { PageHeader } from "@/core/ui/PageHeader";
import { WorkspacePanel } from "@/core/ui/WorkspacePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSession } from "@/core/security/session";
import { ZENVIX_HARDWARE, itProcurementBridge, ITCatalogItem } from "@/core/services/it/itProcurementBridge";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function TechShop() {
  const session = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isRequesting, setIsRequesting] = useState<string | null>(null);
  const [requestNotes, setRequestNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ITCatalogItem | null>(null);

  const filteredItems = (Array.isArray(ZENVIX_HARDWARE) ? ZENVIX_HARDWARE : []).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRequest = async () => {
    if (!activeItem || !session.tenant_id) return;

    setIsRequesting(activeItem.id);
    try {
      const result = await itProcurementBridge.processCatalogRequest(
        session.tenant_id,
        session,
        activeItem,
        "MAIN_WH", // Default to Main Warehouse for now, can be dynamic
        requestNotes
      );

      if (result.status === "FULFILLED") {
        toast.success("Request Fulfilled", {
          description: result.detail
        });
      } else {
        toast.info("Procurement Triggered", {
          description: result.detail
        });
      }
      setIsDialogOpen(false);
      setRequestNotes("");
    } catch (error) {
      toast.error("Request Failed", {
        description: "An error occurred during orchestration."
      });
    } finally {
      setIsRequesting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-8 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em]">
            <ShoppingBag className="h-3 w-3" /> Hardware Catalog
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">
            Zenvix Tech Shop
          </h1>
          <p className="text-sm text-slate-500 font-medium">Official hardware and provisioning hub for Zenvix infrastructure.</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative w-64 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input 
                placeholder="Search hardware or SKU..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-2xl border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
           </div>
           <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 dark:border-slate-800 p-0">
              <Filter className="h-4 w-4" />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {(Array.isArray(filteredItems) ? filteredItems : []).map((item) => (
          <div 
            key={item.id} 
            className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-2 p-8"
          >
             <div className="absolute top-0 right-0 p-8">
                <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black text-[8px] tracking-[0.2em] uppercase px-3">
                   {item.sku}
                </Badge>
             </div>

             <div className="mb-8">
                <div className="h-16 w-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                   {item.name.includes("Tab") ? <Smartphone className="h-8 w-8" /> : 
                    item.name.includes("Printer") ? <Printer className="h-8 w-8" /> : 
                    <Monitor className="h-8 w-8" />}
                </div>
             </div>

             <div className="space-y-2 mb-8">
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic group-hover:text-indigo-600 transition-colors">
                  {item.name}
                </h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-2">
                   {item.description}
                </p>
             </div>

             <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 mb-8 space-y-3 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <span>Administrative Note</span>
                   <Info className="h-3 w-3" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                   "{item.notes}"
                </p>
             </div>

             <div className="flex items-center justify-between mt-auto">
                <div>
                   <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Est. Cost</p>
                   <p className="text-lg font-black text-slate-900 dark:text-white">
                      Rp {(item.estimatedCost / 1000000).toFixed(1)}M
                   </p>
                </div>
                
                <Dialog open={isDialogOpen && activeItem?.id === item.id} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (open) setActiveItem(item);
                }}>
                  <DialogTrigger asChild>
                    <Button className="rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest px-6 h-12 group-hover:scale-105 transition-all">
                       Request Gear <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] border-none shadow-2xl dark:bg-slate-900 p-8 max-w-md">
                    <DialogHeader className="space-y-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                         <Package className="h-6 w-6" />
                      </div>
                      <DialogTitle className="text-2xl font-black tracking-tighter uppercase italic">Confirm Request</DialogTitle>
                      <DialogDescription className="font-medium">
                        Requesting <span className="text-indigo-600 font-black">{item.name}</span> for branch orchestration. This will trigger inventory check and potential procurement.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Request Notes</label>
                          <Textarea 
                            placeholder="Add specific deployment instructions or search tags..."
                            className="rounded-2xl border-slate-100 dark:border-slate-800 min-h-[100px] font-medium text-sm"
                            value={requestNotes}
                            onChange={(e) => setRequestNotes(e.target.value)}
                          />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                             <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Stock Check</p>
                             <div className="flex items-center gap-2 text-emerald-500">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="text-[10px] font-black uppercase">Automated</span>
                             </div>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                             <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Fiscal Impact</p>
                             <div className="flex items-center gap-2 text-amber-500">
                                <AlertCircle className="h-3 w-3" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">CAPEX Gate</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <DialogFooter className="gap-3 sm:justify-between">
                       <Button variant="ghost" className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-12 px-6" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                       </Button>
                       <Button 
                         onClick={handleRequest}
                         disabled={isRequesting === item.id}
                         className="rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest px-8 h-12 shadow-xl shadow-indigo-500/20 min-w-[140px]"
                       >
                          {isRequesting === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Truck className="h-4 w-4 mr-2" />
                          )}
                          Commit Request
                       </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
             </div>
          </div>
        ))}
      </div>

      <WorkspacePanel title="Deployment Flow" description="Understanding the orchestration sequence." className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-0">
         <div className="grid grid-cols-1 md:grid-cols-4">
            <div className="p-8 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-4 group">
               <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-6 w-6" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step 01</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic">Catalog Selection</p>
               </div>
            </div>
            <div className="p-8 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-4 group">
               <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layers className="h-6 w-6" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step 02</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic">Stock Check Bridge</p>
               </div>
            </div>
            <div className="p-8 border-r border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-4 group">
               <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Truck className="h-6 w-6" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step 03</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic">Fulfill or Procure</p>
               </div>
            </div>
            <div className="p-8 flex flex-col items-center text-center space-y-4 group">
               <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="h-6 w-6" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step 04</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic">Asset Registration</p>
               </div>
            </div>
         </div>
      </WorkspacePanel>
    </div>
  );
}
