"use client";

import type { ReactionItem } from "@/lib/chat-cache";
import { cn } from "@/lib/utils";

// Reactions are message content the sender picks, so they are real emoji (stored as-is by the API).
// ds-allow: user-content reaction set
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥"];

/** Row of quick reactions. Used on hover (desktop) and in the message options sheet. */
export function ChatReactionBar({
  onPick,
  className,
  size = "sm",
}: {
  onPick: (emoji: string) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="toolbar"
      aria-label="Pick a reaction"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-border bg-surface-raised p-1 shadow-lg",
        size === "md" && "w-full justify-between",
        className
      )}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          aria-label={`React with ${emoji}`}
          onClick={() => onPick(emoji)}
          className={cn(
            "flex cursor-pointer items-center justify-center rounded-full transition-ui outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring active:scale-90",
            size === "md" ? "size-11 text-2xl" : "size-9 text-lg"
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

/** Small pill under a bubble listing who reacted with what. Tap toggles your own reaction. */
export function ChatReactionSummary({
  reactions,
  currentUserId,
  align,
  onToggle,
}: {
  reactions: ReactionItem[];
  currentUserId: string;
  align: "left" | "right";
  onToggle: (emoji: string) => void;
}) {
  const unique = Array.from(new Set(reactions.map((r) => r.emoji)));
  const mine = reactions.find((r) => r.userId === currentUserId)?.emoji;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle(mine || unique[0]);
      }}
      aria-label={mine ? `Remove your ${mine} reaction` : `${reactions.length} reactions`}
      className={cn(
        "absolute -bottom-3.5 flex h-6 cursor-pointer items-center gap-0.5 rounded-full border border-border bg-surface-raised px-1.5 text-xs text-fg shadow-xs transition-ui outline-none focus-visible:ring-2 focus-visible:ring-ring",
        align === "right" ? "right-2" : "left-2"
      )}
    >
      {unique.map((e) => (
        <span key={e}>{e}</span>
      ))}
      {reactions.length > 1 && (
        <span className="ml-0.5 font-semibold text-fg-muted tabular-nums">{reactions.length}</span>
      )}
    </button>
  );
}
