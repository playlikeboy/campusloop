"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StoryAvatarItemProps {
  displayName: string;
  avatarUrl: string | null;
  subtitle?: string | null;
  hasUnseen?: boolean;
  isFriend?: boolean;
  onClick: () => void;
}

/** One round avatar in the stories row. Violet ring = new story you haven't opened. */
export function StoryAvatarItem({
  displayName,
  avatarUrl,
  subtitle,
  hasUnseen = true,
  onClick,
}: StoryAvatarItemProps) {
  const fallback = displayName ? displayName[0].toUpperCase() : "S";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${displayName}'s story${hasUnseen ? ", new" : ""}`}
      className="group flex w-[72px] shrink-0 cursor-pointer select-none flex-col items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={cn(
          "cl-interactive rounded-full p-0.5 ring-offset-2 ring-offset-bg",
          hasUnseen ? "ring-2 ring-brand" : "ring-1 ring-border-strong"
        )}
      >
        <Avatar className="size-14">
          <AvatarImage src={avatarUrl || ""} alt="" />
          <AvatarFallback className="bg-surface-muted text-sm font-semibold text-fg-muted">
            {fallback}
          </AvatarFallback>
        </Avatar>
      </span>
      <span className="flex w-full flex-col items-center leading-tight">
        <span
          className={cn(
            "w-full truncate text-center text-xs",
            hasUnseen ? "font-semibold text-fg" : "text-fg-muted"
          )}
        >
          {displayName}
        </span>
        {subtitle && <span className="w-full truncate text-center text-xs text-fg-subtle">{subtitle}</span>}
      </span>
    </button>
  );
}
