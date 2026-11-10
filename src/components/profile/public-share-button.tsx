"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { ShareProfileModal } from "@/components/profile/share-profile-modal";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";

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

export function PublicShareButton({ profile, variant = "pill", className }: PublicShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant === "icon" ? "circleIcon" : "outline"}
        size={variant === "icon" ? "icon" : "md"}
        onClick={() => {
          haptics.light();
          setIsOpen(true);
        }}
        className={className}
        aria-label={`Share @${profile.username}'s profile`}
      >
        <Share2 aria-hidden="true" />
        {variant === "pill" && <span>Share</span>}
      </Button>

      <ShareProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} profile={profile} />
    </>
  );
}
