import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  category?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  category,
  icon: Icon,
  badge,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-border/50",
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        {category && (
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
            {category}
          </p>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          {Icon && (
            <div className="size-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Icon className="size-4" />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0 pt-1 sm:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
