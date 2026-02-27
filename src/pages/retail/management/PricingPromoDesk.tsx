import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/core/ui/PageHeader";
import {
  Tag,
  Zap,
  Percent,
  ShieldCheck,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronRight,
  Plus,
  Search,
  Lock,
  Calculator,
  MoreVertical,
  Filter,
  CheckSquare,
  Square,
  Play,
  RotateCcw,
  ShieldAlert,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { retailService } from "@/core/services/retail/retailService";
import { useSession } from "@/core/security/session";
import type { RetailPromotion } from "@/core/types/retail/retail";
import { cn } from "@/lib/utils";

const PricingPromoDesk = () => {
  const session = useSession();
  const [promotions, setPromotions] = useState<RetailPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPromos, setSelectedPromos] = useState<string[]>([]);
  const [governancePhase, setGovernancePhase] = useState(2); // Mocking current approval phase

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await retailService.listPromotions(
          session.tenantId!,
          session,
        );
        setPromotions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch promotions", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [session.tenantId, session]);

  const stats = useMemo(() => {
    const active = promotions.filter((p) => p.status === "active").length;
    const marginImpact = -2.4; // Mocked aggregate impact
    const pending = promotions.filter((p) => p.status === "draft").length;

    return { active, marginImpact, pending };
  }, [promotions]);

  const toggleSelect = (id: string) => {
    setSelectedPromos((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleBatchAction = (action: string) => {
    toast({
      title: "Batch Action Ritual",
      description: `${action} executed for ${selectedPromos.length} entities. Syncing to edge nodes...`,
    });
    setSelectedPromos([]);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RotateCcw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-black italic uppercase tracking-widest text-slate-400">
            Calibrating Revenue Ratios...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      <div className="px-8 py-6 border-b bg-white shrink-0 flex items-center justify-between">
        <PageHeader
          title="Revenue Control Desk"
          subtitle={`Governance Layer: ROBUST • Margin Integrity: ${stats.marginImpact > -3 ? "OPTIMAL" : "CRITICAL"}`}
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl px-4 font-black italic border-slate-200 text-xs uppercase tracking-widest gap-2"
          >
            <Filter className="w-3.5 h-3.5" /> Strategy Filter
          </Button>
          <Button className="h-11 px-6 rounded-xl bg-slate-900 font-black italic uppercase text-xs tracking-widest gap-2">
            <Plus className="w-4 h-4" /> Create Proposal
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-slate-50/50">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Tactical Intelligence Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-[2rem] p-6 bg-white border-slate-200 shadow-xl border-l-4 border-l-blue-600">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
                  <Percent className="w-5 h-5" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 font-black italic text-[8px] uppercase tracking-widest border-none">
                  LIVE
                </Badge>
              </div>
              <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 mb-1">
                Active Tactical Pricing
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-slate-900">
                {stats.active} Promos
              </div>
              <div className="text-[10px] font-bold italic text-slate-400 mt-2 uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" /> +15.2%
                Volume Index
              </div>
            </Card>

            <Card className="rounded-[2rem] p-6 bg-white border-slate-200 shadow-xl border-l-4 border-l-amber-500">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <Badge
                  variant="destructive"
                  className="font-black italic text-[8px] tracking-widest"
                >
                  URGENT
                </Badge>
              </div>
              <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 mb-1">
                Pending Governance
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-slate-900">
                {stats.pending} Requests
              </div>
              <div className="text-[10px] font-bold italic text-slate-400 mt-2 uppercase">
                Awaiting Compliance Ritual
              </div>
            </Card>

            <Card className="rounded-[2rem] p-6 bg-white border-slate-200 shadow-xl border-l-4 border-l-indigo-600">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <Badge className="bg-indigo-50 text-indigo-700 font-black italic text-[8px] uppercase tracking-widest border-none">
                  AGGREGATE
                </Badge>
              </div>
              <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400 mb-1">
                Margin Erosion
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-slate-900">
                {stats.marginImpact}%
              </div>
              <div className="text-[10px] font-bold italic text-slate-400 mt-2 uppercase">
                Balanced for Liquidity
              </div>
            </Card>

            <Card className="rounded-[2rem] p-6 bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
              <ShieldCheck className="absolute -right-8 -bottom-8 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <div className="text-[10px] font-black italic uppercase tracking-widest text-blue-400 mb-4">
                  Guardrail Status
                </div>
                <div className="text-4xl font-black italic tracking-tighter">
                  SECURED
                </div>
                <div className="text-[10px] font-bold italic opacity-60 mt-4 uppercase">
                  No Policy Violations Detected
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Batch Action Bar */}
              {selectedPromos.length > 0 && (
                <div className="bg-slate-900 text-white p-6 rounded-[2rem] flex items-center justify-between shadow-[0_20px_50px_rgba(15,23,42,0.3)] animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-6">
                    <div className="text-xs font-black italic uppercase tracking-widest text-blue-400">
                      {selectedPromos.length} Promos Selected
                    </div>
                    <Separator
                      orientation="vertical"
                      className="h-4 bg-white/20"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleBatchAction("Activate")}
                        className="bg-emerald-600 hover:bg-emerald-700 h-9 px-4 rounded-xl font-black italic text-[10px] uppercase gap-2"
                      >
                        <Play className="w-3 h-3" /> Execute
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleBatchAction("Archive")}
                        className="bg-white/10 hover:bg-white/20 h-9 px-4 rounded-xl font-black italic text-[10px] uppercase"
                      >
                        Archive
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPromos([])}
                    className="text-white/40 hover:text-white font-black italic text-[10px] uppercase"
                  >
                    Deselect All
                  </Button>
                </div>
              )}

              <Card className="rounded-[2.5rem] shadow-2xl border-none bg-white overflow-hidden">
                <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black italic uppercase tracking-widest text-slate-500">
                      Tactical Campaign Registry
                    </h3>
                    <Badge className="bg-blue-600 font-black italic text-[8px] uppercase">
                      SYNCED
                    </Badge>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      className="pl-12 h-10 bg-white border-slate-200 rounded-xl text-xs font-bold italic"
                      placeholder="Search Strategy..."
                    />
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {promotions.map((promo) => (
                    <div
                      key={promo.id}
                      className={cn(
                        "group p-8 flex items-center justify-between transition-all cursor-pointer",
                        selectedPromos.includes(promo.id)
                          ? "bg-blue-50/50"
                          : "hover:bg-slate-50/50",
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(promo.id);
                          }}
                          className={cn(
                            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                            selectedPromos.includes(promo.id)
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-200 bg-white",
                          )}
                        >
                          {selectedPromos.includes(promo.id) && (
                            <CheckSquare className="w-4 h-4" />
                          )}
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-105 transition-transform">
                          <Tag className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-base font-black italic tracking-tight text-slate-900">
                            {promo.title}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3 mt-1">
                            {promo.id} • {promo.type} •{" "}
                            {promo.target || "GENERAL"}
                            <Badge
                              className={cn(
                                "text-[8px] font-black italic border-none h-4 px-1 ml-2",
                                promo.status === "active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700",
                              )}
                            >
                              {promo.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="text-2xl font-black italic text-slate-900 tracking-tighter">
                            {promo.type === "percentage"
                              ? `${promo.value}%`
                              : `Rp ${promo.value.toLocaleString()}`}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase italic">
                            Markdown Applied
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-slate-400 hover:text-slate-900 rounded-xl"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-8">
              {/* Margin Guard Widget */}
              <Card className="rounded-[2.5rem] bg-white border-slate-200 shadow-xl overflow-hidden p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-400">
                    Margin Guard Sensor
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 font-black italic border-none">
                    OPTIMAL
                  </Badge>
                </div>
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-black italic tracking-tighter text-slate-900">
                        42.4%
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase italic">
                        Current Gross Profit
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-slate-100 animate-spin" />
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    {[
                      {
                        label: "Category: Beverages",
                        impact: "-1.2%",
                        status: "safe",
                      },
                      {
                        label: "Category: Electronics",
                        impact: "0.0%",
                        status: "neutral",
                      },
                      {
                        label: "Category: Apparels",
                        impact: "-4.5%",
                        status: "critical",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-[10px] font-black uppercase italic"
                      >
                        <span className="text-slate-500">{item.label}</span>
                        <span
                          className={cn(
                            item.status === "critical"
                              ? "text-red-500"
                              : "text-emerald-500",
                          )}
                        >
                          {item.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Governance Timeline */}
              <Card className="rounded-[2.5rem] bg-slate-900 text-white shadow-2xl overflow-hidden p-8">
                <div className="text-[10px] font-black italic uppercase tracking-widest text-blue-400 mb-8 mt-2">
                  Governance Workflow
                </div>
                <div className="relative space-y-12 pl-6 border-l border-slate-800">
                  {[
                    {
                      phase: "MAKER",
                      role: "Pricing Specialist",
                      status: "COMPLETED",
                      icon: Calculator,
                      color: "blue",
                    },
                    {
                      phase: "CHECKER",
                      role: "Category Head",
                      status: "ACTIVE",
                      icon: Search,
                      color: "amber",
                    },
                    {
                      phase: "FINALIZER",
                      role: "Finance HOD",
                      status: "LOCKED",
                      icon: Lock,
                      color: "slate",
                    },
                  ].map((p, i) => (
                    <div key={i} className="relative">
                      <div
                        className={cn(
                          "absolute -left-[35px] top-0 w-8 h-8 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-lg",
                          p.status === "ACTIVE"
                            ? `bg-${p.color}-500 animate-pulse`
                            : p.status === "COMPLETED"
                              ? "bg-emerald-500"
                              : "bg-slate-700",
                        )}
                      >
                        <p.icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div
                        className={cn(
                          "text-[9px] font-black uppercase italic mb-1",
                          `text-${p.color}-400`,
                        )}
                      >
                        {p.phase}
                      </div>
                      <div className="text-sm font-black italic text-slate-100">
                        {p.role}
                      </div>
                      <div className="text-[9px] font-bold opacity-40 uppercase tracking-tighter mt-1">
                        {p.status}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Strategy Suggestion */}
              <Card className="rounded-[2.5rem] bg-indigo-600 text-white p-8 group cursor-pointer hover:bg-indigo-700 transition-all overflow-hidden relative">
                <Target className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
                <div className="relative space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black italic tracking-tighter uppercase">
                    Elasticity Suggestion
                  </h4>
                  <p className="text-xs font-medium opacity-70 leading-relaxed italic">
                    Increasing "Artisan Coffee" by 5% will yield 2.4% margin
                    growth with minimal volume disruption.
                  </p>
                  <Button className="w-full bg-white text-indigo-900 hover:bg-white/90 h-12 font-black italic uppercase tracking-widest rounded-xl text-[10px]">
                    Generate Impact Draft
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPromoDesk;
