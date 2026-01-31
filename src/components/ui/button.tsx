import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-label-large font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-[0.98] touch-target",
  {
    variants: {
      variant: {
        // Material 3 Filled Button
        default: "bg-primary text-primary-foreground hover:shadow-elevation-2 rounded-full",
        // Material 3 Filled Tonal Button
        tonal: "bg-secondary-container text-secondary-container-foreground hover:shadow-elevation-1 rounded-full",
        // Material 3 Outlined Button
        outline: "border-2 border-outline bg-transparent text-primary hover:bg-primary/8 rounded-full",
        // Material 3 Text Button
        ghost: "text-primary hover:bg-primary/8 rounded-full",
        // Material 3 Elevated Button
        elevated: "bg-surface-container-low text-primary shadow-elevation-1 hover:shadow-elevation-2 rounded-full",
        // Destructive
        destructive: "bg-destructive text-destructive-foreground hover:shadow-elevation-2 rounded-full",
        // Secondary (legacy support)
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full",
        // Link
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2",
        lg: "h-14 px-8 py-4",
        icon: "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
