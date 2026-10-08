import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs",
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs",
        secondary:
          "bg-primary-soft text-primary border border-primary-soft-border hover:bg-primary-soft/80",
        outline:
          "border-border bg-surface text-text hover:bg-surface-sunken",
        ghost:
          "text-text hover:bg-surface-sunken",
        destructive:
          "bg-danger-soft text-danger border border-danger/20 hover:bg-danger/20 focus-visible:ring-danger",
        pillTab:
          "bg-surface-sunken text-text-secondary hover:text-text data-[active=true]:bg-surface data-[active=true]:text-text data-[active=true]:border-border font-medium rounded-full transition-all border border-transparent",
        circleIcon:
          "rounded-full bg-surface border border-border text-text-secondary hover:text-text transition-all",
        pill: "rounded-full bg-primary-soft text-primary hover:bg-primary-soft/80 font-medium",
        link: "text-primary underline-offset-4 hover:underline",
        emerald: "bg-success text-white hover:opacity-90 shadow-2xs",
        violet: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs",
      },
      size: {
        default: "h-10 gap-2 px-4 text-sm rounded-xl",
        md: "h-10 gap-2 px-4 text-sm rounded-xl",
        sm: "h-8 gap-1.5 px-3 text-xs rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-7 gap-1 px-2.5 text-xs rounded-md [&_svg:not([class*='size-'])]:size-3",
        lg: "h-12 gap-2.5 px-6 text-base font-semibold rounded-2xl",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
        "icon-xs": "size-7 rounded-md",
        "icon-lg": "size-12 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(buttonVariants({ variant, size, className }), (children.props as any)?.className),
        ...props,
      });
    }

    return (
      <ButtonPrimitive
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </ButtonPrimitive>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
