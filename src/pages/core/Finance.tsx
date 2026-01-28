import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PiggyBank,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Calendar,
  Building,
  BarChart3,
} from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Mock financial data
const revenueData = [
  { month: 'Jan', revenue: 45000, expenses: 32000 },
  { month: 'Feb', revenue: 52000, expenses: 35000 },
  { month: 'Mar', revenue: 48000, expenses: 33000 },
  { month: 'Apr', revenue: 61000, expenses: 38000 },
  { month: 'May', revenue: 55000, expenses: 36000 },
  { month: 'Jun', revenue: 67000, expenses: 41000 },
];

const expenseCategories = [
  { name: 'Salaries', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Rent', value: 20, color: 'hsl(var(--chart-2))' },
  { name: 'Supplies', value: 15, color: 'hsl(var(--chart-3))' },
  { name: 'Marketing', value: 10, color: 'hsl(var(--chart-4))' },
  { name: 'Other', value: 10, color: 'hsl(var(--chart-5))' },
];

const recentTransactions = [
  { id: 1, description: 'POS Sales - Retail', amount: 2450, type: 'income', date: '2024-01-20' },
  { id: 2, description: 'Supplier Payment - Bean Brothers', amount: -1200, type: 'expense', date: '2024-01-19' },
  { id: 3, description: 'POS Sales - Cafe', amount: 1850, type: 'income', date: '2024-01-19' },
  { id: 4, description: 'Staff Salaries', amount: -8500, type: 'expense', date: '2024-01-15' },
  { id: 5, description: 'Equipment Maintenance', amount: -350, type: 'expense', date: '2024-01-14' },
];

const pendingInvoices = [
  { id: 'INV-001', client: 'Corporate Order', amount: 5200, dueDate: '2024-01-25', status: 'pending' },
  { id: 'INV-002', client: 'Event Catering', amount: 3800, dueDate: '2024-01-28', status: 'pending' },
  { id: 'INV-003', client: 'Monthly Subscription', amount: 1200, dueDate: '2024-01-30', status: 'overdue' },
];

export default function Finance() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finance</h1>
          <p className="text-muted-foreground">Financial overview and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button>
            <Receipt className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(328000)}</p>
                <div className="flex items-center gap-1 mt-1 text-green-500 text-sm">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>12.5% from last month</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(215000)}</p>
                <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                  <ArrowDownRight className="h-4 w-4" />
                  <span>5.2% from last month</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className="text-2xl font-bold">{formatCurrency(113000)}</p>
                <div className="flex items-center gap-1 mt-1 text-green-500 text-sm">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>18.3% margin</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cash Flow</p>
                <p className="text-2xl font-bold">{formatCurrency(45200)}</p>
                <p className="text-sm text-muted-foreground mt-1">Available balance</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Wallet className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Revenue vs Expenses Chart */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>Monthly comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        name="Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stackId="2"
                        stroke="hsl(var(--destructive))"
                        fill="hsl(var(--destructive))"
                        fillOpacity={0.3}
                        name="Expenses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>By category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {expenseCategories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span>{cat.name}</span>
                      </div>
                      <span className="font-medium">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {tx.type === 'income' ? (
                          <ArrowUpRight className={`h-4 w-4 ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`} />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-sm text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Complete transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Transaction management interface - connect to data source for full functionality
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{inv.client}</p>
                        <p className="text-sm text-muted-foreground">{inv.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(inv.amount)}</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Due: {inv.dueDate}</span>
                      </div>
                    </div>
                    <Badge variant={inv.status === 'overdue' ? 'destructive' : 'secondary'}>
                      {inv.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold">Profit & Loss</h3>
                <p className="text-sm text-muted-foreground mt-1">Monthly P&L statement</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <Building className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold">Balance Sheet</h3>
                <p className="text-sm text-muted-foreground mt-1">Assets & liabilities</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <PiggyBank className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold">Cash Flow</h3>
                <p className="text-sm text-muted-foreground mt-1">Cash flow analysis</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
