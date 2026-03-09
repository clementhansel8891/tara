import React from "react";
import { Zap, Power, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { RetailShift } from "@/core/types/retail/retail";

interface ShiftStatusCardProps {
  activeShift: RetailShift | undefined;
}

export const ShiftStatusCard: React.FC<ShiftStatusCardProps> = ({
  activeShift,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      className={cn(
        "lg:col-span-2 rounded-[2.5rem] border-4 transition-all shadow-2xl relative overflow-hidden group min-h-[220px] flex items-center p-12",
        activeShift
          ? "bg-slate-900 border-blue-600/20 text-white"
          : "bg-white border-red-500/20 text-slate-900",
      )}
    >
      {activeShift && (
        <Activity className="absolute -right-12 -top-12 w-64 h-64 opacity-5 text-blue-400 group-hover:rotate-12 transition-transform duration-1000" />
      )}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 w-full">
        <div
          className={cn(
            "w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 border-2",
            activeShift
              ? "bg-blue-600 border-blue-400/50 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
              : "bg-red-50 border-red-200 text-red-500",
          )}
        >
          {activeShift ? (
            <Zap className="w-10 h-10 text-white animate-pulse" />
          ) : (
            <Power className="w-10 h-10" />
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase">
              {activeShift ? "Node Session Live" : "Terminals Locked"}
            </h2>
            {activeShift && (
              <Badge className="bg-emerald-500 font-black italic animate-pulse">
                ACTIVE
              </Badge>
            )}
          </div>
          <p
            className={cn(
              "text-xs font-bold uppercase tracking-widest italic opacity-60",
              activeShift ? "text-blue-200" : "text-slate-400",
            )}
          >
            {activeShift
              ? `SID: ${activeShift.id} • Operator: ${activeShift.employeeId}`
              : "Branch requires manual initialization ritual."}
          </p>
        </div>
        <Button
          onClick={() => navigate("/m/retail/management/shifts")}
          className={cn(
            "h-14 px-10 rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl transition-all",
            activeShift
              ? "bg-white text-slate-900 hover:bg-slate-100"
              : "bg-red-600 text-white hover:bg-red-700",
          )}
        >
          {activeShift ? "Manage Session" : "Go to Shift Control"}
        </Button>
      </div>
    </Card>
  );
};
