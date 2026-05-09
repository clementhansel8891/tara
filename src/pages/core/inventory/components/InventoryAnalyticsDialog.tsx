import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, AlertTriangle, ArrowRightLeft } from "lucide-react";

interface InventoryAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: any;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function InventoryAnalyticsDialog({
  open,
  onOpenChange,
  stats,
}: InventoryAnalyticsDialogProps) {
  // Mock data for charts
  const stockByCategory = [
    { name: "Electronics", value: 400 },
    { name: "Clothing", value: 300 },
    { name: "Home", value: 300 },
    { name: "Beauty", value: 200 },
  ];

  const stockTrend = [
    { month: "Jan", stock: 1200 },
    { month: "Feb", stock: 1500 },
    { month: "Mar", stock: 1100 },
    { month: "Apr", stock: 1800 },
    { month: "May", stock: 2100 },
    { month: "Jun", stock: 1900 },
  ];

  const movementData = [
    { day: "Mon", in: 45, out: 30 },
    { day: "Tue", in: 52, out: 40 },
    { day: "Wed", in: 38, out: 45 },
    { day: "Thu", in: 65, out: 50 },
    { day: "Fri", in: 48, out: 60 },
    { day: "Sat", in: 25, out: 20 },
    { day: "Sun", in: 15, out: 10 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl rounded-[3rem] max-h-[90vh] overflow-y-auto border-none shadow-2xl bg-slate-50 dark:bg-slate-950 p-8">
        <DialogHeader className="mb-8">
          <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
            <TrendingUp className="h-3 w-3" /> ANALYTICS_CORE
          </div>
          <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">
            Inventory Insights
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <Card className="border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Package className="h-3 w-3 text-primary" /> Turnover Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">4.2x</div>
              <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase">Top 10% Industry</p>
            </CardContent>
          </Card>

          <Card className="border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-amber-500" /> Stock Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">98.4%</div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Last Audit: 2 days ago</p>
            </CardContent>
          </Card>

          <Card className="border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ArrowRightLeft className="h-3 w-3 text-blue-500" /> Avg. Lead Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">5.2d</div>
              <p className="text-[10px] font-bold text-amber-500 mt-1 uppercase">+12% vs last month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest">Stock Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stockByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest">Stock Level Projection</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="stock" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-none bg-white dark:bg-slate-900 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest">Movement Velocity (Weekly)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="in" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="out" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
