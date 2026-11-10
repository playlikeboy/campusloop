"use client";

import { UserCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  username: string;
  displayName?: string;
  initialIsFollowing: boolean;
  size?: "sm" | "md";
  className?: string;
  onChange?: (isFollowing: boolean, counts?: { followersCount: number; followingCount: number }) => void;
}

interface FollowResponse {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export function FollowButton({
  username,
  displayName,
  initialIsFollowing,
  size = "md",
  className,
  onChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, setIsPending] = useState(false);

  async function toggleFollow() {
    if (isPending) return;

    const next = !isFollowing;
    // Optimistic flip — reverted below if the request fails.
    setIsFollowing(next);
    setIsPending(true);
    onChange?.(next);
    haptics.light();
    if (next) sounds.tap();

    try {
      const data = await apiRequest<FollowResponse>(
        `/api/profile/${encodeURIComponent(username)}/follow`,
        next ? "POST" : "DELETE"
      );
      setIsFollowing(data.isFollowing);
      onChange?.(data.isFollowing, {
        followersCount: data.followersCount,
        followingCount: data.followingCount,
      });
    } catch (err) {
      setIsFollowing(!next);
      onChange?.(!next);
      const who = displayName || `@${username}`;
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : `Couldn't ${next ? "follow" : "unfollow"} ${who}. Check your connection and try again.`
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={toggleFollow}
      aria-pressed={isFollowing}
      aria-busy={isPending || undefined}
      variant={isFollowing ? "outline" : "primary"}
      size={size === "sm" ? "sm" : "md"}
      className={cn("group/follow", className)}
    >
      {isFollowing ? <UserCheck aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
      {isFollowing ? (
        <>
          <span className="group-hover/follow:hidden">Following</span>
          <span className="hidden group-hover/follow:inline">Unfollow</span>
        </>
      ) : (
        <span>Follow</span>
      )}
    </Button>
  );
}
