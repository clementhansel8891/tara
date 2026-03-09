import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReportTemplate } from "./ReportingHubTypes";

interface ReportTemplateCardProps {
  template: ReportTemplate;
  isActive: boolean;
  onClick: () => void;
}

export const ReportTemplateCard: React.FC<ReportTemplateCardProps> = ({
  template,
  isActive,
  onClick,
}) => {
  const Icon = template.icon;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "rounded-[3rem] border-2 cursor-pointer transition-all p-10 group relative overflow-hidden h-[320px] flex flex-col justify-between",
        isActive
          ? "border-indigo-600 bg-white shadow-[0_32px_80px_-20px_rgba(79,70,229,0.15)] ring-8 ring-indigo-50"
          : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-2xl hover:shadow-slate-100 hover:-translate-y-1",
      )}
    >
      {/* Decorative Elements */}
      <div
        className={cn(
          "absolute -right-12 -bottom-12 w-48 h-48 opacity-[0.03] transition-transform duration-1000 group-hover:scale-125 group-hover:-rotate-12",
          isActive ? "text-indigo-600 opacity-[0.08]" : "text-slate-950",
        )}
      >
        <Icon className="w-full h-full" />
      </div>

      <div>
        <div
          className={cn(
            "w-16 h-16 rounded-[2rem] flex items-center justify-center mb-8 transition-all duration-500 group-hover:rotate-12",
            isActive
              ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-200"
              : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500",
          )}
        >
          <Icon className="w-8 h-8" />
        </div>

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3">
            <h3
              className={cn(
                "text-2xl font-black italic uppercase tracking-tighter leading-tight",
                isActive ? "text-slate-950" : "text-slate-800",
              )}
            >
              {template.label}
            </h3>
            {isActive && (
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[90%] italic">
            {template.description}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-end relative z-10 mt-6">
        <Badge
          className={cn(
            "rounded-2xl text-[10px] font-black italic uppercase tracking-widest px-4 py-1.5 border-none shadow-sm transition-all duration-500",
            isActive
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600",
          )}
        >
          {isActive ? "Configuring..." : "Access Report"}
        </Badge>
        {isActive && (
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-4 border-white bg-slate-100"
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
