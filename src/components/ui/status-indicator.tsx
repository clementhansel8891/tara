import { cn } from "@/lib/utils";
import { STATUS_INDICATORS, getStatusIndicatorClasses } from "@/lib/theme-colors";

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: string;
  size?: "sm" | "md" | "lg";
  showGlow?: boolean;
}

export function StatusIndicator({ 
  className, 
  status, 
  size = "md", 
  showGlow = true,
  ...props 
}: StatusIndicatorProps) {
  const indicatorClasses = status ? getStatusIndicatorClasses(status) : STATUS_INDICATORS.IDLE;
  
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }[size];

  const glowClass = showGlow ? `shadow-[0_0_8px_hsl(var(--primary)/0.5)]` : "";

  return (
    <div
      className={cn(
        "rounded-full",
        indicatorClasses.bg,
        indicatorClasses.text,
        sizeClasses,
        showGlow && glowClass,
        className
      )}
      {...props}
    />
  );
}

export function StatusDot({ status, className, ...props }: StatusIndicatorProps) {
  return (
    <StatusIndicator 
      status={status} 
      size="sm" 
      showGlow={true}
      className={cn("inline-block", className)}
      {...props}
    />
  );
}

export function StatusPill({ status, className, ...props }: StatusIndicatorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
        className
      )}
      {...props}
    >
      <StatusIndicator status={status} size="sm" showGlow={true} />
      <span className={cn("text-[9px] font-black uppercase tracking-widest", getStatusIndicatorClasses(status).text)}>
        {status?.toUpperCase() || "UNKNOWN"}
      </span>
    </div>
  );
}
