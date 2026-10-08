import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface MediaCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  href?: string;
  image?: React.ReactNode;
  header?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export function MediaCard({
  href,
  image,
  header,
  title,
  description,
  footer,
  children,
  className,
  ...props
}: MediaCardProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 transition-all hover:border-[var(--border-strong)] hover:shadow-2xs",
        href && "cursor-pointer group",
        className
      )}
      {...props}
    >
      {image && <div className="mb-3.5 overflow-hidden rounded-[var(--r-md)]">{image}</div>}
      {header && <div className="mb-2 flex items-center justify-between gap-2">{header}</div>}

      <div className="space-y-1.5 flex-1">
        <div className="font-heading font-semibold text-base sm:text-lg text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
          {title}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {children && <div className="mt-3">{children}</div>}

      {footer && (
        <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          {footer}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full">
        {content}
      </Link>
    );
  }

  return content;
}
