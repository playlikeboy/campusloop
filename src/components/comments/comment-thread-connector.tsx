"use client";

import { cn } from "@/lib/utils";

interface CommentThreadConnectorProps {
  className?: string;
  isLast?: boolean;
}

/**
 * Vertical Threads / Instagram-style connector line linking parent comments to their replies.
 */
export function CommentThreadConnector({ className, isLast = false }: CommentThreadConnectorProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute left-4.5 top-11 bottom-0 w-[2px] bg-gradient-to-b from-border/70 via-border/50 to-transparent pointer-events-none rounded-full transition-colors",
        isLast && "bottom-4",
        className
      )}
    />
  );
}

/**
 * Subtle curved elbow connector branching from the vertical threadline into a reply avatar.
 */
export function CommentReplyElbow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute -left-5 top-4.5 w-4 h-3.5 border-b-2 border-l-2 border-border/60 rounded-bl-xl pointer-events-none",
        className
      )}
    />
  );
}
