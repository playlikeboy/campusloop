import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { MarketingFooter, MarketingNav } from "@/components/shells/marketing-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared marketing building blocks. Header and footer come from the one
 * marketing shell; `MarketingHeader` stays as an alias for pages that have
 * not moved to `MarketingShell` yet.
 */
export { MarketingFooter };

/** @deprecated Wrap the page in `MarketingShell` instead. */
export function MarketingHeader({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return <MarketingNav isAuthenticated={isAuthenticated} />;
}

export function Section({
  id,
  tone = "default",
  className,
  children,
}: {
  id?: string;
  tone?: "default" | "muted" | "bordered";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20",
        tone === "muted" && "bg-surface-muted",
        tone === "bordered" && "border-t border-border"
      )}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-[var(--container-marketing)] px-[var(--gutter)] py-16 md:py-20",
          className
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  title,
  lede,
  align = "left",
  className,
}: {
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl pb-10", align === "center" && "mx-auto text-center", className)}>
      <h2 className="text-balance text-3xl text-fg md:text-4xl">{title}</h2>
      {lede && <p className="mt-3 text-pretty text-base text-fg-muted md:text-lg">{lede}</p>}
    </div>
  );
}

/** Closing call to action: one heading, one line, one main button. */
export function CTABand({
  title,
  lede,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: React.ReactNode;
  lede?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Section tone="bordered" className="text-center">
      <h2 className="mx-auto max-w-2xl text-balance text-3xl text-fg md:text-4xl">{title}</h2>
      {lede && <p className="mx-auto mt-3 max-w-md text-base text-fg-muted">{lede}</p>}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href={primaryHref} className={buttonVariants({ size: "lg" })}>
          {primaryLabel}
          <ArrowRight aria-hidden="true" />
        </Link>
        {secondaryHref && secondaryLabel && (
          <Link href={secondaryHref} className={buttonVariants({ variant: "ghost", size: "lg" })}>
            {secondaryLabel}
          </Link>
        )}
      </div>
    </Section>
  );
}
