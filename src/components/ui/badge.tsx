import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        // Job Status Variants
        scheduled: "border-transparent bg-info/15 text-info font-semibold",
        inProgress: "border-transparent bg-primary/15 text-primary font-semibold",
        paused: "border-transparent bg-warning/15 text-warning font-semibold",
        completed: "border-transparent bg-success/15 text-success font-semibold",
        toBill: "border-transparent bg-accent text-accent-foreground font-semibold",
        // Quote Status Variants
        draft: "border-transparent bg-muted text-muted-foreground font-semibold",
        sent: "border-transparent bg-info/15 text-info font-semibold",
        approved: "border-transparent bg-success/15 text-success font-semibold",
        converted: "border-transparent bg-primary/15 text-primary font-semibold",
        // Priority Variants
        low: "border-transparent bg-muted text-muted-foreground font-medium",
        medium: "border-transparent bg-warning/15 text-warning font-medium",
        high: "border-transparent bg-destructive/15 text-destructive font-medium",
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
