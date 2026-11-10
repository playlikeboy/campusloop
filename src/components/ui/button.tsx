import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const FOCUS =
  "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const buttonVariants = cva(
  cn(
    "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent font-semibold whitespace-nowrap select-none",
    "transition-ui active:scale-[0.97]",
    FOCUS,
    "disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none",
    "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/30",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ),
  {
    variants: {
      variant: {
        primary: "bg-brand text-brand-fg hover:bg-brand-hover data-[active=true]:bg-brand-hover",
        secondary: "bg-surface-muted text-fg hover:bg-surface-sunken data-[active=true]:bg-surface-sunken",
        outline:
          "border-border bg-surface text-fg hover:bg-surface-muted data-[active=true]:border-brand data-[active=true]:bg-brand-subtle data-[active=true]:text-brand-text",
        ghost:
          "text-fg hover:bg-surface-muted data-[active=true]:bg-brand-subtle data-[active=true]:text-brand-text",
        danger: "bg-danger text-danger-fg hover:bg-danger/90 focus-visible:ring-danger",
        crush: "bg-crush text-crush-fg hover:bg-crush/90 focus-visible:ring-crush",
        link: "h-auto rounded-none px-0 text-brand-text underline-offset-4 hover:underline active:scale-100",
        success: "bg-success text-success-fg hover:bg-success/90 focus-visible:ring-success",
        pill: "rounded-full bg-surface-muted text-fg hover:bg-surface-sunken data-[active=true]:bg-brand-subtle data-[active=true]:text-brand-text",
        pillTab:
          "rounded-full bg-surface-muted text-fg-muted hover:text-fg data-[active=true]:bg-surface data-[active=true]:text-fg data-[active=true]:shadow-xs",
        circleIcon:
          "rounded-full border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg",
        /** White sticker button for use on a violet story field. */
        onField:
          "bg-sticker text-brand-text shadow-sticker hover:bg-brand-subtle focus-visible:ring-story-field-fg focus-visible:ring-offset-story-field",
      },
      size: {
        md: "h-11 min-h-11 gap-2 px-4 text-sm",
        sm: "h-9 min-h-9 gap-1.5 px-3 text-sm pointer-coarse:h-11 pointer-coarse:min-h-11 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-7 min-h-7 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        lg: "h-13 min-h-13 gap-2.5 px-6 text-base",
        icon: "size-11 min-h-11 min-w-11",
        "icon-sm": "size-9 min-h-9 min-w-9 pointer-coarse:size-11 pointer-coarse:min-h-11 pointer-coarse:min-w-11",
        "icon-xs": "size-7 min-h-7 min-w-7",
        "icon-lg": "size-13 min-h-13 min-w-13",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type CanonicalVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type CanonicalSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

/** Old names still used across the app resolve to the token-based variants. */
const VARIANT_ALIASES: Record<string, CanonicalVariant> = {
  default: "primary",
  destructive: "danger",
  emerald: "success",
  coral: "primary",
  violet: "primary",
};
const SIZE_ALIASES: Record<string, CanonicalSize> = { default: "md" };

export type ButtonVariant = CanonicalVariant | keyof typeof VARIANT_ALIASES;
export type ButtonSize = CanonicalSize | keyof typeof SIZE_ALIASES;

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: ButtonVariant | null;
  size?: ButtonSize | null;
  asChild?: boolean;
  /** Shows a spinner, sets aria-busy and disables the control. */
  loading?: boolean;
  /** Marks the button as the selected one in a group (renders data-active). */
  selected?: boolean;
}

function resolveVariant(v?: ButtonVariant | null): CanonicalVariant {
  if (!v) return "primary";
  return (VARIANT_ALIASES[v as string] ?? v) as CanonicalVariant;
}
function resolveSize(s?: ButtonSize | null): CanonicalSize {
  if (!s) return "md";
  return (SIZE_ALIASES[s as string] ?? s) as CanonicalSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, selected, disabled, children, ...props },
    ref
  ) => {
    const classes = cn(
      buttonVariants({ variant: resolveVariant(variant), size: resolveSize(size) }),
      className
    );
    const dataActive = selected === undefined ? undefined : selected ? "true" : "false";

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(classes, (children.props as any)?.className),
        "data-active": dataActive,
        ...props,
      });
    }

    return (
      <ButtonPrimitive
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        data-active={dataActive}
        {...props}
      >
        {loading && <Spinner size={size === "xs" || size === "icon-xs" ? "xs" : "sm"} />}
        {children}
      </ButtonPrimitive>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
