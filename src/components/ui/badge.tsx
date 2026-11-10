import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  cn(
    "group/badge inline-flex h-5 min-h-[22px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
    "transition-colors outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:ring-2 aria-invalid:ring-danger/30",
    "[&>svg]:pointer-events-none [&>svg]:size-3!"
  ),
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-fg-muted [a]:hover:bg-surface-sunken",
        brand: "bg-brand text-brand-fg [a]:hover:bg-brand-hover",
        success: "bg-success-subtle text-success",
        warning: "bg-warning-subtle text-warning",
        danger: "bg-danger-subtle text-danger",
        verified: "bg-brand-subtle text-brand-text",
        anonymous: "bg-surface-muted text-fg-muted",
        example: "bg-reward-subtle text-reward-text",
        reward: "bg-reward text-reward-fg",
        crush: "bg-crush-subtle text-crush-text",
        outline: "border border-border bg-surface text-fg [a]:hover:bg-surface-muted",
        ghost: "text-fg-muted hover:bg-surface-muted hover:text-fg",
        link: "text-brand-text underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

type CanonicalVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/** Pre-v3 names map onto the token variants so existing markup keeps rendering. */
const VARIANT_ALIASES: Record<string, CanonicalVariant> = {
  default: "brand",
  secondary: "neutral",
  destructive: "danger",
  info: "brand",
  primary: "brand",
  catBlue: "brand",
  catYellow: "reward",
  catPink: "crush",
  coral: "crush",
};

export type BadgeVariant = CanonicalVariant | keyof typeof VARIANT_ALIASES;

function Badge({
  className,
  variant = "neutral",
  render,
  ...props
}: useRender.ComponentProps<"span"> & { variant?: BadgeVariant | null }) {
  const resolved = (variant && (VARIANT_ALIASES[variant as string] ?? variant)) as CanonicalVariant;
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant: resolved }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant: resolved,
    },
  });
}

export { Badge, badgeVariants };
