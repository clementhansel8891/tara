import React from "react";
import { Smartphone, Plus, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { BranchDevice } from "@/core/types/retail/retail";

interface TerminalNetworkHealthProps {
  devices: BranchDevice[];
}

export const TerminalNetworkHealth: React.FC<TerminalNetworkHealthProps> = ({
  devices,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="rounded-[2.5rem] bg-slate-900 border-none shadow-2xl overflow-hidden group">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 italic">
          Terminal Network Health
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0 space-y-6">
        <div className="grid grid-cols-4 gap-3">
          {devices.length > 0 ? (
            devices.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "aspect-square rounded-xl flex items-center justify-center transition-all",
                  d.isActive
                    ? "bg-blue-600/20 border border-blue-500/30 text-blue-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-500",
                )}
              >
                <Smartphone className="w-4 h-4" />
              </div>
            ))
          ) : (
            <div className="col-span-4 text-[10px] font-bold text-slate-600 italic uppercase py-4">
              No Terminals Registered
            </div>
          )}
          <button
            onClick={() => navigate("/m/retail/management/devices")}
            className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 cursor-pointer hover:bg-white/10 hover:text-white transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <Separator className="bg-white/10" />
        <div className="flex justify-between items-center">
          <div className="text-[10px] font-black italic text-slate-400 uppercase">
            Status: <span className="text-blue-400">Stable</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-black italic text-white/40 hover:text-white p-0 h-auto"
            onClick={() => navigate("/m/retail/management/devices")}
          >
            Remote Hub <ArrowUpRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
