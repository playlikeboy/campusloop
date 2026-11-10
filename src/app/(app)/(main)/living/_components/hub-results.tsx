"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const HUB_GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

interface HubResultsProps {
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  /** What failed, e.g. "listings". Used in the error line. */
  noun: string;
  count: number;
  empty: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: React.ReactNode;
  };
  isValidating?: boolean;
  page?: number;
  totalPages?: number;
  gridClassName?: string;
  skeletonClassName?: string;
  children: React.ReactNode;
}

/** Loading, error, empty and paged states for a hub listing grid. */
export function HubResults({
  isLoading,
  error,
  onRetry,
  noun,
  count,
  empty,
  isValidating,
  page = 1,
  totalPages = 1,
  gridClassName = HUB_GRID,
  skeletonClassName = "h-64",
  children,
}: HubResultsProps) {
  if (isLoading) {
    return (
      <div className={gridClassName} aria-busy="true" aria-label={`Loading ${noun}`}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className={cn("w-full rounded-lg", skeletonClassName)} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        bordered
        icon={WifiOff}
        title={`Couldn't load ${noun}`}
        description="Check your internet connection, then try again."
        action={
          <Button variant="secondary" onClick={onRetry}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
        }
      />
    );
  }

  if (count === 0) {
    return (
      <EmptyState
        bordered
        icon={empty.icon}
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );
  }

  return (
    <div className="space-y-6" aria-busy={isValidating || undefined}>
      <div className={cn(gridClassName, "transition-ui", isValidating && "opacity-60")}>{children}</div>
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination page={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
