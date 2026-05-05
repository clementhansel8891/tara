import React from "react";
import { Button } from "@/components/ui/button";
import { useRetail } from "../context/RetailContext";
import { useSession } from "@/core/security/session";
import { Roles } from "@/core/security/roles";
import { Layout, MonitorPlay } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export const RetailModeSwitchControl = ({ variant = "default" }: { variant?: "default" | "tactical" }) => {
  const { mode, setMode } = useRetail();
  const session = useSession();
  const navigate = useNavigate();

  // Visibility Check: Store Admin, Owner, Superadmin
  const isEligible = (
    [Roles.SUPERADMIN, Roles.OWNER, Roles.COMPANY_ADMIN] as string[]
  )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .includes(session.role as any);

  if (!isEligible) return null;

  const handleSwitch = (newMode: "management" | "operational") => {
    setMode(newMode);
    if (newMode === "operational") {
      navigate("/m/retail/operational/gateway");
    } else {
      navigate("/m/retail/workspace");
    }
  };

  const isTactical = variant === "tactical";

  return (
    <div className={cn(
      "flex items-center p-1 rounded-xl transition-all",
      isTactical 
        ? "bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl" 
        : "bg-slate-100 border border-slate-200 shadow-inner"
    )}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-4 font-black text-[10px] uppercase tracking-widest gap-2 rounded-lg transition-all",
          mode === "management"
            ? isTactical ? "bg-white/10 text-white shadow-sm shadow-indigo-500/20" : "bg-white text-blue-600 shadow-sm"
            : isTactical ? "text-white/40 hover:text-white" : "text-slate-500 hover:text-blue-600",
        )}
        onClick={() => handleSwitch("management")}
      >
        <Layout className="w-3 h-3" />
        Management
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-4 font-black text-[10px] uppercase tracking-widest gap-2 rounded-lg transition-all",
          mode === "operational"
            ? isTactical ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40" : "bg-white text-indigo-600 shadow-sm"
            : isTactical ? "text-white/40 hover:text-white" : "text-slate-500 hover:text-indigo-600",
        )}
        onClick={() => handleSwitch("operational")}
      >
        <MonitorPlay className="w-3 h-3" />
        Operational
      </Button>
    </div>
  );
};
