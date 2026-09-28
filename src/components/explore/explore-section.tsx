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

export function ExploreSection({
  id,
  title,
  subtitle,
  icon: Icon,
  viewAllHref,
  viewAllLabel = "View all",
  children,
  className,
}: ExploreSectionProps) {
  return (
    <section id={id} className={cn("space-y-3.5 scroll-mt-20", className)}>
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="size-4.5 text-primary shrink-0" />}
            <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
          </div>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md px-1 py-0.5"
          >
            <span>{viewAllLabel}</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/60 p-3 sm:p-4 backdrop-blur-xs">
        {children}
      </div>
    </section>
  );
}
