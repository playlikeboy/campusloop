import type * as React from "react";
import { PageHeader, type PageHeaderProps } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const WIDTHS = { narrow: "max-w-2xl", default: "max-w-4xl", wide: "max-w-5xl" } as const;

interface MerchantPageProps extends Omit<PageHeaderProps, "children" | "size"> {
  width?: keyof typeof WIDTHS;
  /** Tabs or filters under the title row. */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

/** One header + body column for every store-dashboard screen. */
export function MerchantPage({
  width = "default",
  toolbar,
  children,
  className,
  ...header
}: MerchantPageProps) {
  return (
    <div className={cn("mx-auto w-full space-y-6", WIDTHS[width], className)}>
      <PageHeader size="md" {...header}>
        {toolbar}
      </PageHeader>
      {children}
    </div>
  );
}

/** Calm list skeleton used while a store screen loads. */
export function MerchantListSkeleton({
  rows = 3,
  rowClassName = "h-24",
}: {
  rows?: number;
  rowClassName?: string;
}) {
  return (
    <div role="status" aria-label="Loading" className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={cn("w-full rounded-lg", rowClassName)} />
      ))}
    </div>
  );
}

/** Small section heading inside a store screen. */
export function MerchantSectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-bold text-fg">{children}</h2>
      {action}
    </div>
  );
}
