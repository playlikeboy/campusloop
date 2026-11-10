import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ExploreSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
  className?: string;
}

/** A titled row on Explore. Its items are the cards; the section itself is not a card. */
export function ExploreSection({
  id,
  title,
  subtitle,
  icon: Icon,
  viewAllHref,
  viewAllLabel = "See all",
  children,
  className,
}: ExploreSectionProps) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("space-y-3 scroll-mt-20", className)}>
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 id={headingId} className="flex items-center gap-2 text-lg">
            {Icon && <Icon className="size-5 text-fg-muted shrink-0" aria-hidden />}
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-sm text-fg-muted truncate">{subtitle}</p>}
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            aria-label={`${viewAllLabel}: ${title}`}
            className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-semibold text-brand-text transition-ui hover:underline underline-offset-4 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {viewAllLabel}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>

      {children}
    </section>
  );
}
