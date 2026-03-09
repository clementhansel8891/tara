import React from "react";
import { AlertTriangle, ShieldCheck, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BufferCollisionSensorProps {
  currentStock: number;
  promoImpactEstimate: number;
  ecommerceBufferConfig: number;
}

export const BufferCollisionSensor: React.FC<BufferCollisionSensorProps> = ({
  currentStock,
  promoImpactEstimate,
  ecommerceBufferConfig,
}) => {
  const projectedStock = currentStock - promoImpactEstimate;
  const isCollision = projectedStock <= ecommerceBufferConfig;
  const bufferUtilization = Math.min(
    100,
    (promoImpactEstimate / Math.max(1, currentStock - ecommerceBufferConfig)) *
      100,
  );

  return (
    <Card
      className={cn(
        "p-6 md:p-8 rounded-[2.5rem] shadow-xl overflow-hidden relative border-none",
        isCollision ? "bg-red-50" : "bg-white",
      )}
    >
      {isCollision && (
        <AlertTriangle className="absolute -right-8 -top-8 w-48 h-48 text-red-500 opacity-[0.03] group-hover:scale-110 transition-transform" />
      )}
      {!isCollision && (
        <ShieldCheck className="absolute -right-8 -top-8 w-48 h-48 text-emerald-500 opacity-[0.03] group-hover:scale-110 transition-transform" />
      )}

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-6">
            <div
              className={cn(
                "p-4 rounded-2xl flex items-center justify-center",
                isCollision
                  ? "bg-red-100 text-red-600 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                  : "bg-blue-50 text-blue-600",
              )}
            >
              <TrendingDown className="w-5 h-5" />
            </div>
            <div
              className={cn(
                "text-[9px] font-black italic uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm",
                isCollision
                  ? "bg-red-600 text-white"
                  : "bg-slate-900 text-white",
              )}
            >
              E-Com Buffer Sensor
            </div>
          </div>

          <div className="mb-8">
            <div
              className={cn(
                "text-4xl font-black italic tracking-tighter mb-2",
                isCollision ? "text-red-900" : "text-slate-900",
              )}
            >
              {isCollision ? "COLLISION DETECTED" : "SAFE ZONE"}
            </div>
            <div
              className={cn(
                "text-[10px] font-black uppercase italic tracking-widest",
                isCollision ? "text-red-600/70" : "text-slate-400",
              )}
            >
              Projected Final Stock:{" "}
              <span className="text-lg">{projectedStock}</span> units
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-auto">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
            <span>Safety Buffer: {ecommerceBufferConfig}</span>
            <span>Est. Impact: {promoImpactEstimate} units</span>
          </div>
          <Progress
            value={Math.max(0, bufferUtilization)}
            className={cn(
              "h-2.5 rounded-full bg-slate-100",
              isCollision ? "bg-red-100" : "bg-slate-100",
            )}
            indicatorClassName={
              isCollision
                ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                : "bg-blue-500"
            }
          />
          {isCollision && (
            <p className="text-[10px] font-bold text-red-600 italic mt-3 uppercase">
              Warning: E-Commerce operational buffer will be breached
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
