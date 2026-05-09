import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-1 text-[9px] font-black italic uppercase tracking-[0.15em] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/20",
        secondary: "border-transparent bg-secondary/50 text-secondary-foreground backdrop-blur-md",
        destructive: "border-transparent bg-destructive/10 text-destructive border-destructive/20",
        success: "border-transparent bg-success/10 text-success border-success/20",
        outline: "text-foreground border-border/50 bg-background/50 backdrop-blur-sm",
        vibrant: "grad-primary text-white border-none shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);


export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
