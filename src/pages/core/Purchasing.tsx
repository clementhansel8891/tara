import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShoppingCart,
  Truck,
  FileText,
  Clock,
  DollarSign,
  Package,
  Building,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';

// Mock purchasing data
const purchaseOrders = [
  { id: 'PO-001', supplier: 'Bean Brothers', items: 5, total: 2450, status: 'pending', date: '2024-01-20', eta: '2024-01-25' },
  { id: 'PO-002', supplier: 'Merch Supply Co', items: 12, total: 4800, status: 'approved', date: '2024-01-18', eta: '2024-01-23' },
  { id: 'PO-003', supplier: 'Gift Direct', items: 8, total: 1650, status: 'shipped', date: '2024-01-15', eta: '2024-01-21' },
  { id: 'PO-004', supplier: 'Bean Brothers', items: 3, total: 890, status: 'received', date: '2024-01-10', eta: '2024-01-15' },
];

const suppliers = [
  { id: 1, name: 'Bean Brothers', contact: 'John Bean', email: 'john@beanbros.com', phone: '+1 234 567 890', rating: 4.8, orders: 24, totalSpent: 45600 },
  { id: 2, name: 'Merch Supply Co', contact: 'Sarah Merch', email: 'sarah@merchsupply.com', phone: '+1 234 567 891', rating: 4.5, orders: 18, totalSpent: 32400 },
  { id: 3, name: 'Gift Direct', contact: 'Mike Gift', email: 'mike@giftdirect.com', phone: '+1 234 567 892', rating: 4.2, orders: 12, totalSpent: 18900 },
  { id: 4, name: 'Direct Import', contact: 'Lisa Import', email: 'lisa@directimport.com', phone: '+1 234 567 893', rating: 4.6, orders: 8, totalSpent: 12300 },
];

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  approved: 'bg-blue-500/10 text-blue-500',
  shipped: 'bg-purple-500/10 text-purple-500',
  received: 'bg-green-500/10 text-green-500',
};

export default function Purchasing() {
  const [activeTab, setActiveTab] = useState('orders');
  const [searchTerm, setSearchTerm] = useState('');

  const pendingOrders = purchaseOrders.filter(po => po.status === 'pending').length;
  const totalSpending = purchaseOrders.reduce((sum, po) => sum + po.total, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchasing</h1>
          <p className="text-muted-foreground">Manage suppliers and purchase orders</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">{purchaseOrders.filter(po => po.status !== 'received').length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-500">{pendingOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold">{suppliers.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Month Spending</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpending)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="receiving">Receiving</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Card>
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {purchaseOrders.map((po) => (
                  <div key={po.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{po.id}</p>
                          <Badge className={statusColors[po.status]}>{po.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{po.supplier}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Items</p>
                        <p className="font-medium">{po.items}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-medium">{formatCurrency(po.total)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">ETA</p>
                        <p className="font-medium">{po.eta}</p>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Directory</CardTitle>
              <CardDescription>Manage your supplier relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{supplier.name}</h4>
                          <p className="text-sm text-muted-foreground">{supplier.contact}</p>
                        </div>
                      </div>
                      <Badge variant="outline">⭐ {supplier.rating}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span>{supplier.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span>{supplier.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Orders</span>
                        <span className="font-medium">{supplier.orders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Spent</span>
                        <span className="font-medium">{formatCurrency(supplier.totalSpent)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">Contact</Button>
                      <Button size="sm" className="flex-1">New Order</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receiving" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Deliveries</CardTitle>
              <CardDescription>Orders awaiting delivery and receiving</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchaseOrders.filter(po => po.status === 'shipped').map((po) => (
                  <div key={po.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Truck className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">{po.id} - {po.supplier}</p>
                        <p className="text-sm text-muted-foreground">{po.items} items • {formatCurrency(po.total)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
                          Expected: {po.eta}
                        </div>
                      </div>
                      <Button>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Receive
                      </Button>
                    </div>
                  </div>
                ))}
                {purchaseOrders.filter(po => po.status === 'shipped').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No pending deliveries</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold">Spending Analysis</h3>
                <p className="text-sm text-muted-foreground mt-1">Monthly spending trends</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <Building className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold">Supplier Performance</h3>
                <p className="text-sm text-muted-foreground mt-1">Delivery and quality metrics</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold">Order History</h3>
                <p className="text-sm text-muted-foreground mt-1">Complete order records</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
