"use client";

import { Bookmark, CloudOff, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { sounds } from "@/lib/sounds";

interface AcademicEmptyStateProps {
  type: "empty" | "saved_empty" | "error";
  onResetFilters?: () => void;
  onRetry?: () => void;
  filterContext?: string;
}

/** Empty, no-results and load-error states for study material lists. One line, one action. */
export function AcademicEmptyState({
  type,
  onResetFilters,
  onRetry,
  filterContext,
}: AcademicEmptyStateProps) {
  if (type === "saved_empty") {
    return (
      <EmptyState
        bordered
        icon={Bookmark}
        title="Nothing saved yet"
        description="Tap the bookmark on any note or PYQ to keep it here."
        action={
          onResetFilters && (
            <Button
              onClick={() => {
                sounds.tap();
                onResetFilters();
              }}
            >
              Browse study material
            </Button>
          )
        }
      />
    );
  }

  if (type === "error") {
    return (
      <EmptyState
        bordered
        icon={CloudOff}
        title="Couldn't load study material"
        description="Check your internet connection, then try again."
        action={
          onRetry && (
            <Button
              variant="secondary"
              onClick={() => {
                sounds.tap();
                onRetry();
              }}
            >
              Try again
            </Button>
          )
        }
      />
    );
  }

  return (
    <EmptyState
      bordered
      icon={SearchX}
      title={filterContext ? `Nothing found for "${filterContext}"` : "Nothing matches these filters"}
      description="Try a subject code like CS301, or pick another semester."
      action={
        onResetFilters && (
          <Button
            variant="secondary"
            onClick={() => {
              sounds.tap();
              onResetFilters();
            }}
          >
            Clear filters
          </Button>
        )
      }
    />
  );
}
