import { useState, useEffect, useMemo } from "react";
import {
  User,
  ShoppingCart,
  Heart,
  History,
  MessageSquare,
  Search,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useSession } from "@/core/security/session";
import { retailService } from "@/core/services/retail/retailService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function RetailCustomerActivity() {
  const session = useSession();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // We use a query param for ecommerce_id if we want to filter, 
      // but the backend will handle RLS and branch/ecommerce scoping.
      const data = await retailService.listCustomers(session.tenant_id, session);
      setCustomers(data);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
    );
  }, [customers, search]);

  const handleOpenDetail = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  return (
    <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
      <CardHeader className="p-8 border-b bg-slate-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600" />
              Ecommerce Customer Registry
            </CardTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-9">
              Unified activity tracking for registered ecommerce users
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search Identity..."
                className="pl-10 h-11 w-[300px] rounded-xl border-slate-200 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-11 w-11 p-0 rounded-xl">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synchronizing Registry...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="group flex items-center justify-between p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => handleOpenDetail(customer)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {customer.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {customer.name}
                    </h3>
                    <p className="text-xs text-slate-500">{customer.email || "No email"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="hidden lg:flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <div className="space-y-1">
                      <p>Tier</p>
                      <Badge variant="outline" className="bg-white rounded-lg px-2 py-0.5 border-slate-200 text-slate-600">
                        {customer.tier}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p>Points</p>
                      <p className="text-slate-900">{customer.points}</p>
                    </div>
                    <div className="space-y-1">
                      <p>Status</p>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 rounded-lg px-2 py-0.5">
                        {customer.status}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CustomerDetailDialog
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        customer={selectedCustomer}
      />
    </Card>
  );
}

function CustomerDetailDialog({ isOpen, onOpenChange, customer }: any) {
  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] p-0 overflow-hidden border-none rounded-[3rem] shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Customer Details - {customer.name}</DialogTitle>
        </DialogHeader>
        <div className="flex h-full">
          {/* Sidebar Info */}
          <div className="w-[300px] bg-slate-900 text-white p-8 space-y-8">
            <div className="space-y-4 text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-blue-600 mx-auto flex items-center justify-center text-3xl font-black italic">
                {customer.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter">{customer.name}</h2>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{customer.tier} Member</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Email</p>
                <p className="text-sm font-medium">{customer.email || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Phone</p>
                <p className="text-sm font-medium">{customer.phone || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Points</p>
                <p className="text-2xl font-black italic text-blue-400">{customer.points}</p>
              </div>
            </div>

            <Button className="w-full bg-white/10 hover:bg-white/20 border-none rounded-xl h-11 text-[10px] font-black uppercase tracking-widest italic">
              Edit Identity
            </Button>
          </div>

          {/* Main Content Tabs */}
          <div className="flex-1 bg-white p-8">
            <Tabs defaultValue="history" className="h-full flex flex-col">
              <TabsList className="bg-slate-100 p-1.5 rounded-2xl w-fit mb-8 h-14">
                <TabsTrigger value="history" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] font-black uppercase italic tracking-widest">
                  <History className="w-4 h-4 mr-2" /> History
                </TabsTrigger>
                <TabsTrigger value="cart" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] font-black uppercase italic tracking-widest">
                  <ShoppingCart className="w-4 h-4 mr-2" /> Cart
                </TabsTrigger>
                <TabsTrigger value="wishlist" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] font-black uppercase italic tracking-widest">
                  <Heart className="w-4 h-4 mr-2" /> Wishlist
                </TabsTrigger>
                <TabsTrigger value="chat" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm text-[10px] font-black uppercase italic tracking-widest">
                  <MessageSquare className="w-4 h-4 mr-2" /> Chat
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="history" className="h-full mt-0">
                  <OrderHistoryList customerId={customer.id} />
                </TabsContent>
                <TabsContent value="cart" className="h-full mt-0">
                  <CustomerCartView cart={customer.retail_carts} />
                </TabsContent>
                <TabsContent value="wishlist" className="h-full mt-0">
                  <CustomerWishlistView wishlist={customer.retail_wishlists} />
                </TabsContent>
                <TabsContent value="chat" className="h-full mt-0">
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 bg-slate-50 rounded-[2rem] border-2 border-dashed">
                    <div className="w-16 h-16 rounded-3xl bg-white border shadow-sm flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black italic uppercase tracking-tighter">WhatsApp Bridge</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect with {customer.name} via standard WhatsApp?</p>
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-14 px-10 text-[10px] font-black uppercase tracking-widest mt-4 shadow-xl shadow-emerald-500/20 gap-3"
                        onClick={() => {
                          const phone = customer.phone?.replace(/[^0-9]/g, "");
                          const text = encodeURIComponent(`Hi ${customer.name}, this is Zenvix Support. How can we help you today?`);
                          window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
                        }}
                      >
                        <MessageSquare className="w-5 h-5" />
                        Open WhatsApp Conversation
                      </Button>
                      <p className="text-[9px] font-bold text-slate-400 mt-4 max-w-[200px] mx-auto">
                        Clicks are documented in the system audit logs for compliance.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderHistoryList({ customerId }: { customerId: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const session = useSession();

  useEffect(() => {
    fetchOrders();
  }, [customerId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Backend listOrders now supports customer_id filter
      const data = await retailService.listOrders(session.tenant_id, session, {
        customer_id: customerId
      });
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch order history", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Scanning Ledger...</div>;

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-[2rem]">No documented transactions</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</p>
                  <p className="text-xs font-bold text-slate-900">{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 rounded-lg">
                  {order.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</p>
                <p className="text-lg font-black italic text-slate-900">${order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

function CustomerCartView({ cart }: any) {
  const items = cart?.retail_cart_items || [];
  
  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-[2rem]">Cart is empty</div>
        ) : (
          items.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.product_id}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="font-black italic text-slate-900">${(item.unit_price * item.quantity).toFixed(2)}</p>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

function CustomerWishlistView({ wishlist }: any) {
  const items = wishlist?.retail_wishlist_items || [];

  return (
    <ScrollArea className="h-full pr-4">
      <div className="grid grid-cols-2 gap-4">
        {items.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-[2rem]">Wishlist is empty</div>
        ) : (
          items.map((item: any) => (
            <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-white border flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-500 fill-pink-500/10" />
              </div>
              <p className="text-xs font-bold text-slate-900">{item.product_id}</p>
              <Button size="sm" variant="outline" className="w-full rounded-xl text-[10px] font-black uppercase italic border-slate-200">View Product</Button>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
