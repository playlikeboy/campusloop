import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5 min-h-[22px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground font-bold shadow-2xs [a]:hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground border border-border/80 font-semibold shadow-2xs [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/30 font-semibold focus-visible:ring-destructive dark:bg-destructive/20 [a]:hover:bg-destructive/20",
        success:
          "bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 border border-emerald-500/40 font-bold",
        warning:
          "bg-amber-500/10 text-amber-950 dark:text-amber-200 border border-amber-500/40 font-bold",
        info:
          "bg-sky-500/10 text-sky-950 dark:text-sky-200 border border-sky-500/40 font-bold",
        outline: "border-border bg-card text-foreground font-semibold shadow-2xs [a]:hover:bg-muted",
        ghost: "hover:bg-muted hover:text-foreground text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline font-semibold",
        catBlue: "bg-[var(--color-cat-blue)]/25 text-[#1E4870] dark:text-[#C4DFEF] border border-[#A2C7E0] font-bold",
        catYellow: "bg-[var(--color-cat-yellow)]/35 text-[#5C4500] dark:text-[#FFE59C] border border-[#E8CE7D] font-bold",
        catPink: "bg-[var(--color-cat-pink)]/25 text-[#7A2B2B] dark:text-[#F2A4A4] border border-[#E28D8D] font-bold",
        coral: "bg-[var(--color-coral)]/15 text-primary dark:text-[#FFA27B] border border-[var(--color-coral)]/40 font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
