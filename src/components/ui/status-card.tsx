import { cn } from "@/lib/utils";
import { STATUS_CARD_COLORS, getDeviceStatusCardClasses } from "@/lib/theme-colors";
import { type VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const statusCardVariants = cva(
  "relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:shadow-lg",
  {
    variants: {
      variant: {
        online: STATUS_CARD_COLORS.ONLINE,
        maintenance: STATUS_CARD_COLORS.MAINTENANCE,
        offline: STATUS_CARD_COLORS.OFFLINE,
        error: STATUS_CARD_COLORS.ERROR,
        success: STATUS_CARD_COLORS.ONLINE,
        warning: STATUS_CARD_COLORS.MAINTENANCE,
        info: STATUS_CARD_COLORS.ONLINE,
      },
    },
    defaultVariants: {
      variant: "offline",
    },
  }
);

export interface StatusCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusCardVariants> {
  status?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function StatusCard({ 
  className, 
  variant, 
  status, 
  title, 
  description, 
  icon,
  ...props 
}: StatusCardProps) {
  // If status is provided, use it to determine the variant
  const effectiveVariant = status ? getDeviceStatusCardClasses(status) : variant;
  
  // Get the actual classes from the variant
  const variantClasses = typeof effectiveVariant === 'string' 
    ? STATUS_CARD_COLORS[effectiveVariant.toUpperCase() as keyof typeof STATUS_CARD_COLORS] 
    : effectiveVariant;

  return (
    <div
      className={cn(
        statusCardVariants({ variant: variantClasses }),
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={cn("p-2.5 rounded-xl", variantClasses.bg, variantClasses.text)}>
              {icon}
            </div>
          )}
          <div>
            {title && <h3 className="font-semibold text-sm">{title}</h3>}
            {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
          </div>
        </div>
        {status && (
          <StatusIndicator status={status} size="md" showGlow={true} />
        )}
      </div>
    </div>
  );
}

export { STATUS_CARD_COLORS };
