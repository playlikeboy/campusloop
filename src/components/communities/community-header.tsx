"use client";

import { ArrowLeft, EyeOff, Link2, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { recordCommunityInviteShare } from "@/app/(app)/(main)/communities/actions";
import { JoinCommunityButton } from "@/app/(app)/(main)/communities/join-community-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, getAvatarUrl } from "@/lib/utils";

interface CommunityHeaderProps {
  community: {
    id: string;
    slug?: string | null;
    name: string;
    description?: string | null;
    category?: string;
    privacy?: string;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    points?: number;
    allowAnonymousPosts?: boolean;
    creatorId: string;
    inviteCode?: string | null;
    creator?: {
      id: string;
      username: string;
      displayName: string;
    } | null;
  };
  membersCount: number;
  postsCount: number;
  isMember: boolean;
  isAdmin: boolean;
  memberStatus?: string;
}

/** Compact header for community sub-pages (members, settings) with section links. */
export function CommunityHeader({
  community,
  membersCount,
  postsCount,
  isMember,
  isAdmin,
}: CommunityHeaderProps) {
  const pathname = usePathname();
  const identifier = community.slug || community.id;
  const baseUrl = `/communities/${identifier}`;

  async function handleShareInvite() {
    try {
      await navigator.clipboard.writeText(
        `Join c/${community.name} on CampusLoop\n${window.location.origin}${baseUrl}`
      );
      toast.success("Invite link copied");
      recordCommunityInviteShare(community.id).catch(() => {});
    } catch {
      toast.error("Couldn't copy the link. Copy it from the address bar.");
    }
  }

  const links = [
    { href: baseUrl, label: "Posts" },
    { href: `${baseUrl}/members`, label: "Members" },
    ...(isAdmin ? [{ href: `${baseUrl}/settings`, label: "Settings" }] : []),
  ];

  return (
    <header className="space-y-3 px-4 pt-3">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={baseUrl}>
            <ArrowLeft />
            Back
          </Link>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Copy invite link" onClick={handleShareInvite}>
          <Link2 />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="size-14 shrink-0 rounded-sm">
          <AvatarImage
            src={getAvatarUrl(community.avatarUrl, community.name)}
            alt=""
            className="object-cover"
          />
          <AvatarFallback className="rounded-sm">{community.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-1.5 truncate text-xl font-bold text-fg">
            c/{community.name}
            {community.privacy === "PRIVATE" && (
              <Lock className="size-4 shrink-0 text-fg-subtle" aria-label="Private" />
            )}
            {community.privacy === "UNLISTED" && (
              <EyeOff className="size-4 shrink-0 text-fg-subtle" aria-label="Hidden" />
            )}
          </h1>
          <p className="text-sm text-fg-muted tabular-nums">
            {membersCount} {membersCount === 1 ? "member" : "members"} · {postsCount}{" "}
            {postsCount === 1 ? "post" : "posts"}
          </p>
        </div>
        <JoinCommunityButton communityId={community.id} initialIsMember={isMember} />
      </div>

      <nav aria-label="Community sections" className="-mx-4 flex gap-4 border-b border-border px-4">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px inline-flex min-h-11 items-center border-b-2 px-1 text-sm font-semibold transition-ui",
                active ? "border-brand text-fg" : "border-transparent text-fg-muted hover:text-fg"
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
