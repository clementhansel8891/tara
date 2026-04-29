import React from "react";
import { 
  Database, 
  AlertCircle, 
  Lock, 
  RefreshCw,
  SearchX,
  FileQuestion
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "no-data" | "error" | "restricted" | "not-found" | "search";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  actionLabel?: string;
}

export function EmptyState({
  variant = "no-data",
  title,
  description,
  onRetry,
  className,
  actionLabel = "Refresh Telemetry"
}: EmptyStateProps) {
  
  const config = {
    "no-data": {
      icon: Database,
      defaultTitle: "No Data Found",
      defaultDescription: "The requested dataset is currently empty. This might be due to a new tenant environment or missing historical records.",
      color: "text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-900/50"
    },
    "error": {
      icon: AlertCircle,
      defaultTitle: "Telemetry Link Failure",
      defaultDescription: "A neural synchronization error occurred. Please verify your connection to the core mainframe and try again.",
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-950/20"
    },
    "restricted": {
      icon: Lock,
      defaultTitle: "Access Restricted",
      defaultDescription: "Your current clearance level does not permit access to this module. Please contact your system administrator.",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/20"
    },
    "not-found": {
      icon: FileQuestion,
      defaultTitle: "Entity Not Found",
      defaultDescription: "The specified data object could not be located in the central registry.",
      color: "text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/20"
    },
    "search": {
      icon: SearchX,
      defaultTitle: "No Results",
      defaultDescription: "Your search parameters yielded no matches in the current index.",
      color: "text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-900/50"
    }
  }[variant];

  const Icon = config.icon;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 transition-all duration-500",
      config.bg,
      className
    )}>
      <div className={cn(
        "h-20 w-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-200/20 dark:shadow-none",
        variant === "error" ? "bg-rose-100 dark:bg-rose-900/30" : 
        variant === "restricted" ? "bg-amber-100 dark:bg-amber-900/30" :
        "bg-white dark:bg-slate-800"
      )}>
        <Icon className={cn("h-10 w-10", config.color)} />
      </div>
      
      <h3 className="text-2xl font-black tracking-tight mb-2 text-slate-900 dark:text-white uppercase">
        {title || config.defaultTitle}
      </h3>
      
      <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm font-medium leading-relaxed mb-8">
        {description || config.defaultDescription}
      </p>

      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          className="rounded-xl h-12 px-6 font-black text-xs gap-2 border-slate-200 hover:bg-white dark:border-slate-800 hover:scale-105 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          {actionLabel.toUpperCase()}
        </Button>
      )}
    </div>
  );
}
