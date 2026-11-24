"use client";

import Link from "next/link";
import { FollowButton } from "@/components/profile/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getAvatarUrl, initialOf } from "@/lib/utils";

export interface FollowListItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  points: number;
  institutionName: string | null;
  isFollowedByViewer: boolean;
  isFriendOfViewer: boolean;
  isMutualWithProfile: boolean;
  isViewer: boolean;
}

export function FollowListRow({
  user,
  showFollowButton,
}: {
  user: FollowListItem;
  showFollowButton: boolean;
}) {
  const subtitle = user.headline || user.bio || user.institutionName;

  return (
    <li className="flex items-center gap-2 px-4 py-3 sm:gap-3 transition-ui hover:bg-surface-muted">
      <Link href={`/@${user.username}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <Avatar className="size-11 border border-border">
          <AvatarImage src={getAvatarUrl(user.avatarUrl, user.username)} alt="" className="object-cover" />
          <AvatarFallback className="bg-surface-muted font-semibold text-fg">
            {initialOf(user.displayName)}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/@${user.username}`}
          className="line-clamp-2 text-sm font-semibold break-words text-fg hover:underline"
        >
          {user.displayName}
        </Link>
        <p className="truncate text-sm text-fg-muted">
          {user.isFriendOfViewer && !user.isViewer && <span className="font-semibold">Friends · </span>}
          @{user.username}
        </p>
        {subtitle && <p className="line-clamp-1 text-sm text-fg-subtle">{subtitle}</p>}
      </div>

      {!user.isViewer &&
        (showFollowButton ? (
          <FollowButton
            username={user.username}
            displayName={user.displayName}
            initialIsFollowing={user.isFollowedByViewer}
            size="sm"
            className="shrink-0"
          />
        ) : (
          <Button asChild size="row" className="shrink-0">
            <Link href={`/join?mode=signup&returnUrl=${encodeURIComponent(`/@${user.username}`)}`}>
              Follow
            </Link>
          </Button>
        ))}
    </li>
  );
}
