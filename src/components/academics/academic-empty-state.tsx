"use client";

import { AlertCircle, ArrowRight, Bookmark, BookOpen, Plus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { sounds } from "@/lib/sounds";

interface AcademicEmptyStateProps {
  type: "empty" | "saved_empty" | "error";
  onResetFilters?: () => void;
  onRetry?: () => void;
  filterContext?: string;
}

export function AcademicEmptyState({
  type,
  onResetFilters,
  onRetry,
  filterContext,
}: AcademicEmptyStateProps) {
  if (type === "saved_empty") {
    return (
      <div className="py-16 sm:py-20 text-center px-4 space-y-3.5 rounded-2xl border border-dashed border-border/50 bg-card/20 select-none">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto">
          <Bookmark className="size-6" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            No saved resources yet
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Save useful notes and PYQs to build your personal semester study locker.
          </p>
        </div>
        {onResetFilters && (
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              onResetFilters();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
          >
            <span>Browse Academic Materials</span>
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className="py-16 sm:py-20 text-center px-4 space-y-3.5 rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 select-none">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive mx-auto">
          <AlertCircle className="size-6" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            Something went wrong loading resources
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Unable to connect to the study database. Check your connection or retry.
          </p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              onRetry();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted border border-border/60 text-foreground text-xs font-bold hover:bg-muted/80 transition-all cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-20 text-center px-4 space-y-3.5 rounded-2xl border border-dashed border-border/50 bg-card/20 select-none">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground mx-auto">
        <BookOpen className="size-6" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-sm sm:text-base font-bold text-foreground">
          No resources found
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {filterContext
            ? `No study materials matched "${filterContext}". Try searching for another subject or clear filters.`
            : "No study materials found for your active filters. Try searching by course code, selecting another semester, or resetting filters."}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
        {onResetFilters && (
          <button
            type="button"
            onClick={() => {
              sounds.tap();
              onResetFilters();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted border border-border/60 text-foreground text-xs font-bold hover:bg-muted/80 transition-all cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>Clear filters</span>
          </button>
        )}

        <Link
          href="/academics/study-material/upload"
          onClick={() => sounds.tap()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="size-3.5" />
          <span>Upload Notes (+20 LP)</span>
        </Link>
      </div>
    </div>
  );
}
