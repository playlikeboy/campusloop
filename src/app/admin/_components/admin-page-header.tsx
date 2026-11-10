import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  /** One plain sentence: what this page is for. */
  description?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {Icon && <Icon className="size-5 shrink-0 text-fg-muted" aria-hidden />}
          <h1 className="text-balance text-2xl text-fg">{title}</h1>
          {badge}
        </div>
        {description && <p className="max-w-2xl text-pretty text-sm text-fg-muted">{description}</p>}
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
