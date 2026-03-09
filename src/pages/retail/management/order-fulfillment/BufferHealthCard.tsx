import React from "react";
import { Card } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export const BufferHealthCard = () => {
  // Hardcoded for demo purposes as requested by the prompt's layout description
  const safePercentage = 92.4;

  return (
    <Card className="rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group p-6">
      <ShieldAlert className="absolute -right-8 -bottom-8 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform" />
      <div className="relative z-10">
        <div className="text-[10px] font-black italic uppercase tracking-widest text-indigo-400 mb-4">
          Buffer Health
        </div>
        <div className="text-4xl font-black italic tracking-tighter text-emerald-400 flex items-baseline gap-1">
          {safePercentage}%
        </div>
        <div className="text-[10px] font-bold italic opacity-60 mt-4 uppercase leading-relaxed">
          Catalog Safe for E-Commerce Visibility
          <br />
          ATS {"=>"} SOH - Safety Buffer
        </div>
      </div>
    </Card>
  );
};
