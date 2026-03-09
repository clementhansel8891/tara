import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Database,
  History,
  ArrowRight,
  Fingerprint,
  Link2,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const CommandCenterSidebar = ({
  inventoryStats,
  syncStatus,
  recentOrders,
}: {
  inventoryStats: any;
  syncStatus: any;
  recentOrders: any[];
}) => {
  return (
    <div className="space-y-6">
      {/* Inventory Health */}
      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="p-6 border-b bg-slate-50/50">
          <CardTitle className="text-xs font-black italic uppercase tracking-widest flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            Inventory Health
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center p-3 rounded-2xl bg-red-50 border border-red-100">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-[10px] font-black italic text-red-600 uppercase">
                Critical Depletion
              </span>
            </div>
            <Badge className="bg-red-600 font-black italic text-[9px]">
              {inventoryStats?.outOfStockCount || 0}
            </Badge>
          </div>
          <div className="flex justify-between items-center p-3 rounded-2xl bg-amber-50 border border-amber-100">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] font-black italic text-amber-600 uppercase">
                Low Stock Threshold
              </span>
            </div>
            <Badge className="bg-amber-600 font-black italic text-[9px]">
              {inventoryStats?.lowStockCount || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Core Sync Status */}
      <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden">
        <CardHeader className="p-6 border-b border-white/10">
          <CardTitle className="text-xs font-black italic uppercase tracking-widest flex items-center gap-2 text-blue-400">
            <Link2 className="w-4 h-4" />
            Core Consensus Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {[
            { label: "Finance (Ledger)", status: "LOCKED" },
            { label: "HR (Coverage)", status: "ACTIVE" },
            { label: "IT (Security)", status: "OPTIMAL" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest"
            >
              <span className="text-slate-400">{item.label}</span>
              <span className="text-blue-400 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                {item.status}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Audit Ledger Snippet */}
      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="p-6 border-b bg-slate-50/50">
          <CardTitle className="text-xs font-black italic uppercase tracking-widest flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-blue-600" />
            Real-time Audit
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-mono text-blue-600">
                    {order.id.slice(0, 8)}...
                  </span>
                  <span className="text-[10px] font-black italic text-slate-900">
                    Rp {order.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                  <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
