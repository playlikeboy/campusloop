"use client";

import { ArrowLeft, Link2, Lock, MessageSquare, Settings } from "lucide-react";
import Link from "next/link";
import { JoinCommunityButton } from "@/app/(app)/(main)/communities/join-community-button";
import { ShareQrButton } from "@/components/common/share-qr-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getAvatarUrl } from "@/lib/utils";
import type { CommunityDetailProps } from "./community-detail-client";

function plural(n: number, word: string) {
  return `${n.toLocaleString("en-IN")} ${word}${n === 1 ? "" : "s"}`;
}

export function CommunityDetailHero({
  community,
  identifier,
  isAdmin,
  isMember,
  membersCount,
  postsCount,
  isOpeningChat,
  onOpenChat,
  onCopyInvite,
  onMembershipChange,
  onShowMembers,
}: {
  community: CommunityDetailProps["community"];
  identifier: string;
  isAdmin: boolean;
  isMember: boolean;
  membersCount: number;
  postsCount: number;
  isOpeningChat: boolean;
  onOpenChat: () => void;
  onCopyInvite: () => void;
  onMembershipChange: (joined: boolean) => void;
  onShowMembers: () => void;
}) {
  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/communities">
            <ArrowLeft />
            Communities
          </Link>
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Copy invite link" onClick={onCopyInvite}>
            <Link2 />
          </Button>
          <ShareQrButton
            title={`c/${community.name}`}
            subtitle={community.description || "Community on CampusLoop"}
            badgeText="Community"
            shortUrl={`https://campusloop.space/communities/${identifier}`}
            avatarUrl={community.avatarUrl}
            category="community"
          />
          {isAdmin && (
            <Button asChild variant="ghost" size="icon" aria-label="Community settings">
              <Link href={`/communities/${identifier}/settings`}>
                <Settings />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {community.bannerUrl && (
          <img src={community.bannerUrl} alt="" className="h-32 w-full object-cover sm:h-44" />
        )}
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <Avatar className="size-16 shrink-0 rounded-sm sm:size-20">
              <AvatarImage
                src={getAvatarUrl(community.avatarUrl, community.name)}
                alt=""
                className="object-cover"
              />
              <AvatarFallback className="rounded-sm text-xl">
                {community.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-2xl leading-tight font-bold [overflow-wrap:anywhere] text-fg sm:text-3xl">
                c/{community.name}
              </h1>
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-fg-muted">
                <button
                  type="button"
                  onClick={onShowMembers}
                  className="cursor-pointer underline-offset-4 hover:text-fg hover:underline"
                >
                  {plural(membersCount, "member")}
                </button>
                <span>· {plural(postsCount, "post")}</span>
                {community.category && <span>· {community.category}</span>}
                {community.privacy === "PRIVATE" && (
                  <span className="inline-flex items-center gap-1">
                    · <Lock className="size-3.5" aria-hidden="true" /> Private
                  </span>
                )}
              </p>
              {community.creator && (
                <p className="text-sm text-fg-muted">
                  Run by{" "}
                  <Link
                    href={`/@${community.creator.username}`}
                    className="font-semibold text-fg underline-offset-4 hover:underline"
                  >
                    @{community.creator.username}
                  </Link>
                </p>
              )}
            </div>
          </div>

          {community.description && (
            <p className="max-w-prose text-sm leading-relaxed text-fg-muted">{community.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <JoinCommunityButton
              communityId={community.id}
              initialIsMember={isMember}
              onMembershipChange={onMembershipChange}
              className="h-11 px-5 text-sm"
            />
            <Button variant="outline" onClick={onOpenChat} loading={isOpeningChat}>
              {!isOpeningChat && <MessageSquare />}
              Group chat
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
