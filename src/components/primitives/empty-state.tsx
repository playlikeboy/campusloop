import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Standardized EmptyState primitive for CampusLoop 2.0.
 * Eliminates repetitive ad-hoc empty states with cohesive typography,
 * neutral iconography container, and clear primary calls to action.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border/70 bg-card/40 my-4",
        className
      )}
    >
      <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
        <Icon className="size-6 text-foreground/70" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
