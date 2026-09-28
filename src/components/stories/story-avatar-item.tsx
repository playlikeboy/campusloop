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

export function StoryAvatarItem({
  displayName,
  avatarUrl,
  subtitle,
  hasUnseen = true,
  isFriend = false,
  onClick,
}: StoryAvatarItemProps) {
  const fallback = displayName ? displayName[0].toUpperCase() : "S";

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group focus:outline-none select-none"
    >
      <div
        className={cn(
          "p-0.5 rounded-full transition-all duration-300 group-hover:scale-105 active:scale-95",
          hasUnseen
            ? isFriend
              ? "bg-linear-to-tr from-emerald-500 via-teal-500 to-green-400 p-[2.5px] shadow-sm shadow-emerald-500/25"
              : "bg-linear-to-tr from-amber-400 via-rose-500 to-purple-600 p-[2.5px] shadow-sm"
            : "p-[1.5px] border-2 border-muted-foreground/30 opacity-60 group-hover:opacity-100"
        )}
      >
        <Avatar className="h-14 w-14 border-2 border-background shadow-xs">
          <AvatarImage src={avatarUrl || ""} />
          <AvatarFallback className="font-bold text-xs bg-muted text-muted-foreground">
            {fallback}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col items-center leading-tight">
        <span className="text-[11px] font-bold text-foreground truncate max-w-[66px]">{displayName}</span>
        {subtitle && (
          <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[66px]">
            {subtitle}
          </span>
        )}
      </div>
    </button>
  );
}
