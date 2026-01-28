import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  Warehouse,
  Truck,
  BarChart3,
  ShoppingBag,
  Coffee,
} from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Mock inventory data aggregated from all systems
const inventorySummary = {
  totalItems: 156,
  totalValue: 45800,
  lowStockItems: 12,
  outOfStockItems: 3,
  turnoverRate: 4.2,
};

const warehouseData = [
  { name: 'Retail Store', items: 89, value: 28500, lowStock: 5, location: 'Main Floor' },
  { name: 'Cafe Kitchen', items: 45, value: 12300, lowStock: 4, location: 'Kitchen' },
  { name: 'Storage', items: 22, value: 5000, lowStock: 3, location: 'Back Room' },
];

const stockMovement = [
  { date: 'Mon', received: 45, sold: 38 },
  { date: 'Tue', received: 32, sold: 42 },
  { date: 'Wed', received: 28, sold: 35 },
  { date: 'Thu', received: 55, sold: 48 },
  { date: 'Fri', received: 40, sold: 62 },
  { date: 'Sat', received: 25, sold: 78 },
  { date: 'Sun', received: 15, sold: 45 },
];

const topMovingItems = [
  { name: 'House Blend Coffee', category: 'Cafe', sold: 245, trend: 'up' },
  { name: 'Signature Mug', category: 'Retail', sold: 89, trend: 'up' },
  { name: 'Croissant', category: 'Cafe', sold: 156, trend: 'down' },
  { name: 'Coffee Beans 250g', category: 'Retail', sold: 78, trend: 'up' },
  { name: 'Espresso', category: 'Cafe', sold: 198, trend: 'stable' },
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Centralized inventory across all systems</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{inventorySummary.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(inventorySummary.totalValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-500">{inventorySummary.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-destructive">{inventorySummary.outOfStockItems}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Turnover Rate</p>
                <p className="text-2xl font-bold">{inventorySummary.turnoverRate}x</p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="retail">Retail Stock</TabsTrigger>
          <TabsTrigger value="cafe">Cafe Stock</TabsTrigger>
          <TabsTrigger value="warehouse">Warehouse</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Stock Movement Chart */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Stock Movement</CardTitle>
                <CardDescription>Weekly received vs sold</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockMovement}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="received" fill="hsl(var(--primary))" name="Received" />
                      <Bar dataKey="sold" fill="hsl(var(--chart-2))" name="Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Moving Items */}
            <Card>
              <CardHeader>
                <CardTitle>Top Moving Items</CardTitle>
                <CardDescription>This week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topMovingItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {item.category === 'Cafe' ? (
                            <Coffee className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.sold}</span>
                        {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {item.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warehouse Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Location Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {warehouseData.map((wh) => (
                  <div key={wh.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-medium">{wh.name}</h4>
                      </div>
                      {wh.lowStock > 0 && (
                        <Badge variant="secondary">{wh.lowStock} low</Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Items</span>
                        <span className="font-medium">{wh.items}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Value</span>
                        <span className="font-medium">{formatCurrency(wh.value)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium">{wh.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retail" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Retail Inventory</CardTitle>
              <CardDescription>Stock synced from POS Retail system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Retail inventory is managed in POS Retail → Inventory</p>
                <p className="text-sm mt-2">Data is synchronized in real-time</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cafe" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cafe Inventory</CardTitle>
              <CardDescription>Stock synced from POS Cafe system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Coffee className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Cafe inventory is managed in POS Cafe → Inventory</p>
                <p className="text-sm mt-2">Data is synchronized in real-time</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouse" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Management</CardTitle>
              <CardDescription>Central storage and distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Warehouse management for central stock distribution</p>
                <Button className="mt-4">
                  <Truck className="h-4 w-4 mr-2" />
                  Create Transfer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Analytics</CardTitle>
              <CardDescription>Trends and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Advanced inventory analytics and forecasting</p>
                <p className="text-sm mt-2">Connect to data source for full analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
