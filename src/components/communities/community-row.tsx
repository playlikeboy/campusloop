"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { JoinCommunityButton } from "@/app/(app)/(main)/communities/join-community-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";
import type { CommunityItem } from "./communities-index-client";

function plural(n: number, word: string) {
  return `${n.toLocaleString("en-IN")} ${word}${n === 1 ? "" : "s"}`;
}

/** One community as a list row: avatar, name, one-line description, counts and a Join button. */
export function CommunityRow({
  community,
  profileId,
  postCount = 0,
  joinedView = false,
}: {
  community: CommunityItem;
  profileId: string;
  postCount?: number;
  joinedView?: boolean;
}) {
  const isMember =
    joinedView || community.members.some((m) => m.userId === profileId && m.status === "ACTIVE");
  const isCreator = community.creatorId === profileId;
  const memberCount = community.members.filter((m) => m.status === "ACTIVE").length;
  const href = `/communities/${community.slug || community.id}`;

  return (
    <div className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
      <Link href={href} className="group flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-11 shrink-0 rounded-sm sm:size-12">
          <AvatarImage src={getAvatarUrl(community.avatarUrl, community.name)} alt="" />
          <AvatarFallback className="rounded-sm">{community.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 leading-snug font-semibold text-fg group-hover:text-brand-text">
            c/{community.name}
            {community.privacy === "PRIVATE" && (
              <Lock className="ml-1 inline size-3.5 align-[-2px] text-fg-subtle" aria-label="Private" />
            )}
          </h3>
          {community.description && (
            <p className="line-clamp-1 text-sm text-fg-muted">{community.description}</p>
          )}
          <p className="truncate text-xs text-fg-subtle tabular-nums">
            {isCreator && <span className="font-semibold text-brand-text">You made this · </span>}
            {plural(memberCount, "member")}
            {postCount > 0 ? ` · ${plural(postCount, "post")}` : ""} · {community.category}
          </p>
        </div>
      </Link>
      <JoinCommunityButton
        communityId={community.id}
        initialIsMember={isMember}
        size="row"
        className="shrink-0"
      />
    </div>
  );
}

export function CommunityList({
  communities,
  profileId,
  postCountsMap,
  joinedView,
}: {
  communities: CommunityItem[];
  profileId: string;
  postCountsMap: Record<string, number>;
  joinedView?: boolean;
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {communities.map((community) => (
        <li key={community.id}>
          <CommunityRow
            community={community}
            profileId={profileId}
            postCount={postCountsMap[community.id] || 0}
            joinedView={joinedView}
          />
        </li>
      ))}
    </ul>
  );
}
