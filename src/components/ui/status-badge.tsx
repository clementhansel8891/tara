import { cn } from "@/lib/utils";
import { STATUS_BADGE_VARIANTS, getStatusBadgeClasses } from "@/lib/theme-colors";
import { type VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all duration-300",
  {
    variants: {
      variant: {
        approved: STATUS_BADGE_VARIANTS.APPROVED,
        rejected: STATUS_BADGE_VARIANTS.REJECTED,
        pending: STATUS_BADGE_VARIANTS.PENDING,
        processing: STATUS_BADGE_VARIANTS.PROCESSING,
        completed: STATUS_BADGE_VARIANTS.COMPLETED,
        failed: STATUS_BADGE_VARIANTS.FAILED,
        cancelled: STATUS_BADGE_VARIANTS.CANCELLED,
        success: STATUS_BADGE_VARIANTS.APPROVED,
        error: STATUS_BADGE_VARIANTS.REJECTED,
        warning: STATUS_BADGE_VARIANTS.PENDING,
        info: STATUS_BADGE_VARIANTS.PROCESSING,
      },
      size: {
        sm: "h-5 min-w-[20px] px-1.5",
        md: "h-6 min-w-[24px] px-2",
        lg: "h-7 min-w-[28px] px-2.5",
      },
    },
    defaultVariants: {
      variant: "pending",
      size: "md",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status?: string;
}

export function StatusBadge({ className, variant, size, status, ...props }: StatusBadgeProps) {
  // If status is provided, use it to determine the variant
  const effectiveVariant = status ? getStatusBadgeClasses(status) : variant;
  
  // Get the actual classes from the variant
  const variantClasses = typeof effectiveVariant === 'string' 
    ? STATUS_BADGE_VARIANTS[effectiveVariant.toUpperCase() as keyof typeof STATUS_BADGE_VARIANTS] 
    : effectiveVariant;

  return (
    <div
      className={cn(
        statusBadgeVariants({ variant: variantClasses, size }),
        className
      )}
      {...props}
    />
  );
}

export { STATUS_BADGE_VARIANTS };
