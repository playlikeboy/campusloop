"use client";

import { MessageCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import { FollowButton } from "@/components/profile/follow-button";
import { Button } from "@/components/ui/button";

interface PublicFollowButtonProps {
  username: string;
  displayName: string;
  profileId: string;
  initialIsFollowing?: boolean;
  isSignedIn?: boolean;
}

export function PublicFollowButton({
  username,
  displayName,
  profileId,
  initialIsFollowing = false,
  isSignedIn = false,
}: PublicFollowButtonProps) {
  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon" aria-label={`Message ${displayName}`}>
          <Link href={`/chat?userId=${profileId}`}>
            <MessageCircle aria-hidden="true" />
          </Link>
        </Button>
        <FollowButton username={username} displayName={displayName} initialIsFollowing={initialIsFollowing} />
      </div>
    );
  }

  const returnUrl = encodeURIComponent(`/@${username}`);
  return (
    <Button asChild>
      <Link href={`/join?mode=signup&returnUrl=${returnUrl}`}>
        <UserPlus aria-hidden="true" />
        Follow
      </Link>
    </Button>
  );
}
