"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { ShareProfileModal } from "@/components/profile/share-profile-modal";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

interface PublicShareButtonProps {
  profile: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    institutionName?: string | null;
    branch?: string | null;
    course?: string | null;
    points?: number | null;
  };
  variant?: "icon" | "pill";
  className?: string;
}

export function PublicShareButton({
  profile,
  variant = "pill",
  className,
}: PublicShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptics.light();
          setIsOpen(true);
        }}
        className={cn(
          "flex cursor-pointer items-center justify-center gap-1.5 border border-border/70 bg-card hover:bg-muted text-foreground transition-all shadow-2xs active:scale-95",
          variant === "icon" ? "size-9 rounded-full" : "h-9 rounded-full px-4 text-xs font-bold",
          className
        )}
        title="Share Profile"
        aria-label={`Share @${profile.username}'s profile`}
      >
        <Share2 className="size-3.5 text-muted-foreground" />
        {variant === "pill" && <span>Share</span>}
      </button>

      <ShareProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} profile={profile} />
    </>
  );
}
