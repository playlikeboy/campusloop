import type React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CuteCatEmpty } from "@/components/ui/cute-illustrations";

interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  illustration?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Standardized EmptyState primitive for CampusLoop.
 * Combines warm ivory cards, cute pastel illustrations, friendly typography,
 * and clear calls to action.
 */
export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-border/80 bg-card my-4 shadow-2xs",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-center">
        {illustration ? (
          illustration
        ) : Icon ? (
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/60">
            <Icon className="size-6 text-foreground/80" />
          </div>
        ) : (
          <CuteCatEmpty size={96} />
        )}
      </div>

      <h3 className="font-heading text-base sm:text-lg font-bold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1.5 mb-5 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
