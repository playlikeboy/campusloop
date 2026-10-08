import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ListRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  showChevron?: boolean;
  href?: string;
}

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  showChevron = false,
  href,
  className,
  ...props
}: ListRowProps) {
  const content = (
    <>
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {icon && (
          <div className="shrink-0 size-9 rounded-[var(--r-md)] bg-[var(--surface-sunken)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[var(--text)] truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {right}
        {showChevron && (
          <ChevronRight className="size-4 text-[var(--text-muted)]" />
        )}
      </div>
    </>
  );

  const containerClasses = cn(
    "flex items-center justify-between p-3.5 sm:p-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-sunken)] transition-colors gap-3 w-full text-left",
    href && "cursor-pointer",
    className
  );

  if (href) {
    return (
      <Link href={href} className={containerClasses}>
        {content}
      </Link>
    );
  }

  return (
    <div className={containerClasses} {...props}>
      {content}
    </div>
  );
}
