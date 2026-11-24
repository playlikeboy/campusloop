"use client";

import { Check, School, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { trackFollow } from "@/lib/analytics/ga4";
import { fetcher } from "@/lib/api";
import { getAvatarUrl } from "@/lib/utils";

interface UserProfileEmbedProps {
  username: string;
}

interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  institution?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  branch?: string | null;
  year?: number | null;
  points?: number;
  isFollowing?: boolean;
}

export function UserProfileEmbed({ username }: UserProfileEmbedProps) {
  const { data: profile, isLoading } = useSWR<PublicProfile>(
    username ? `/api/profile/${username}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  if (isLoading) {
    return (
      <div className="mt-3 p-3 rounded-2xl border border-border bg-surface-muted animate-pulse flex items-center gap-3">
        <div className="size-10 rounded-full bg-muted/60" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-muted/60 rounded-md w-32" />
          <div className="h-3 bg-muted/40 rounded-md w-24" />
        </div>
      </div>
    );
  }

  if (!profile || (profile as any).error) return null;

  async function handleToggleFollow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isMutating) return;

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setIsMutating(true);

    try {
      if (nextState) {
        await fetch(`/api/profile/${username}/follow`, { method: "POST" });
        trackFollow(username);
        toast.success(`Following @${username}`);
      } else {
        await fetch(`/api/profile/${username}/follow`, { method: "DELETE" });
        toast.info(`Unfollowed @${username}`);
      }
      mutate("/api/profile/suggested");
      mutate("/api/profile/following");
    } catch {
      setIsFollowing(!nextState);
      toast.error("Couldn't update. Try again.");
    } finally {
      setIsMutating(false);
    }
  }

  const avatar = getAvatarUrl(profile.avatarUrl, profile.username);

  return (
    <Link
      href={`/@${profile.username}`}
      onClick={(e) => e.stopPropagation()}
      className="mt-3 block rounded-2xl border border-border bg-card hover:bg-muted/20 transition-ui p-3.5 shadow-xs group"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className="size-11 shrink-0 border border-border">
            <AvatarImage src={avatar} alt={profile.displayName} />
            <AvatarFallback className="font-bold text-xs">{profile.displayName[0]}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h4 className="line-clamp-2 break-words text-sm leading-snug font-bold text-foreground group-hover:underline">
              {profile.displayName}
            </h4>
            <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>

            {profile.institution?.name ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5 font-medium">
                <School className="size-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{profile.institution.name.split(",")[0]}</span>
                {profile.branch && <span>· {profile.branch}</span>}
              </p>
            ) : profile.bio ? (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{profile.bio}</p>
            ) : null}
          </div>
        </div>

        <Button
          size="row"
          variant={isFollowing ? "ghost" : "primary"}
          onClick={handleToggleFollow}
          disabled={isMutating}
          aria-pressed={isFollowing}
          className={isFollowing ? "text-fg-muted" : undefined}
        >
          {isFollowing ? (
            <>
              <Check aria-hidden="true" />
              <span>Following</span>
            </>
          ) : (
            <>
              <UserPlus aria-hidden="true" className="max-sm:hidden" />
              <span>Follow</span>
            </>
          )}
        </Button>
      </div>
    </Link>
  );
}
