"use client";

import { VenetianMask } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface ConfessionEmptyStateProps {
  scope: "CAMPUS" | "GLOBAL";
  campusName: string;
  activeTag?: string | null;
  onOpenComposer?: () => void;
  onResetFilter?: () => void;
}

export function ConfessionEmptyState({
  scope,
  campusName,
  activeTag,
  onOpenComposer,
  onResetFilter,
}: ConfessionEmptyStateProps) {
  const title = activeTag
    ? `No confessions in ${activeTag} yet`
    : scope === "CAMPUS"
      ? `No confessions from ${campusName} yet`
      : "No confessions yet";

  return (
    <EmptyState
      icon={VenetianMask}
      title={title}
      description="Be the first. Your name won't be shown."
      action={
        activeTag && onResetFilter ? (
          <Button variant="secondary" onClick={onResetFilter}>
            Show all confessions
          </Button>
        ) : (
          <Button onClick={() => onOpenComposer?.()}>Write a confession</Button>
        )
      }
    />
  );
}
