"use client";

import { ChevronRight, Link2, Share2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { JoinCommunityButton } from "@/app/(app)/(main)/communities/join-community-button";
import { fetcher } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";

interface CommunityEmbedProps {
  slugOrId: string;
}

interface Community {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  icon: string | null;
  avatarUrl?: string | null;
  membersCount?: number;
  memberCount?: number;
  members?: any[];
  category?: string;
  tags?: string[];
}

export function CommunityEmbed({ slugOrId }: CommunityEmbedProps) {
  const router = useRouter();
  const { data: communitiesList, isLoading } = useSWR<Community[]>("/api/communities", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const community = useMemo(() => {
    if (!communitiesList || communitiesList.length === 0) return null;
    const clean = slugOrId.toLowerCase().replace(/^c\//, "");
    const found = communitiesList.find(
      (c) =>
        c.id === slugOrId ||
        c.id === clean ||
        (c.slug && c.slug.toLowerCase() === clean) ||
        c.name.toLowerCase().replace(/\s+/g, "-") === clean ||
        c.name.toLowerCase() === clean
    );

    if (!found) return null;

    const words = found.name.split(/\s+/).slice(0, 3);
    const tags = words.map((w) => `#${w.replace(/[^a-zA-Z0-9]/g, "")}`).filter((t) => t.length > 2);

    return {
      id: found.id,
      name: found.name,
      slug: found.slug || found.name.toLowerCase().replace(/\s+/g, "-"),
      description: found.description || "Connect, share advice, and explore campus opportunities.",
      icon: (found as any).icon || null,
      avatarUrl: found.avatarUrl || null,
      membersCount: found.membersCount ?? found.memberCount ?? found.members?.length ?? 0,
      members: found.members || [],
      tags,
    };
  }, [communitiesList, slugOrId]);

  if (isLoading && !community) {
    return (
      <div className="mt-3.5 p-4 rounded-3xl border border-purple-500/20 bg-[#12111d]/60 animate-pulse space-y-3">
        <div className="flex items-center gap-3">
          <div className="size-14 rounded-2xl bg-purple-950/40" />
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-purple-900/40 rounded w-20" />
            <div className="h-4 bg-purple-900/50 rounded w-36" />
            <div className="h-3 bg-purple-900/30 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!community) return null;

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!community) return;
    haptics.light();
    sounds.tap();
    const url = `${window.location.origin}/c/${community.slug || community.id}`;
    if (navigator.share) {
      navigator.share({
        title: `${community.name} on CampusLoop`,
        text: `Join the ${community.name} community on CampusLoop!`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Community link copied to clipboard");
    }
  }

  function handleCardClick(e: React.MouseEvent) {
    if (e.defaultPrevented) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;
    sounds.tap();
    haptics.light();
    router.push(`/communities/${community?.id}`);
  }

  const memberCount = community.membersCount ?? community.members?.length ?? 0;
  const avatars =
    community.members && community.members.length > 0
      ? community.members
          .map((m: any) => m.user?.avatarUrl || m.avatarUrl)
          .filter(Boolean)
          .slice(0, 3)
      : [];

  return (
    <div
      onClick={handleCardClick}
      className="mt-3.5 block overflow-hidden rounded-3xl border border-border/60 bg-card p-4 sm:p-5 shadow-md space-y-4 select-none cursor-pointer group/comm hover:border-primary/40 hover:shadow-lg transition-all no-card-nav"
      data-no-nav="true"
    >
      {/* Top Row: Community Icon, Badge, Share, Title & Description */}
      <div className="flex items-start gap-3.5">
        {/* Squircle Icon Container */}
        <div className="size-14 sm:size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
          {community.avatarUrl ? (
            <img
              src={community.avatarUrl}
              alt={community.name}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <Users className="size-7 sm:size-8 text-primary" />
          )}
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
              Community
            </span>
            <button
              type="button"
              onClick={handleShare}
              className="size-8 rounded-full border border-border/60 hover:border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              title="Share Community"
              aria-label="Share community"
            >
              <Share2 className="size-3.5" />
            </button>
          </div>

          <h3 className="font-black text-base sm:text-lg text-foreground tracking-tight leading-snug truncate group-hover/comm:text-primary transition-colors">
            {community.name}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{community.description}</p>
        </div>
      </div>

      {/* Middle Row: Member Avatars + Count & Join Button */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2 min-w-0">
          {avatars.length > 0 ? (
            <div className="flex items-center -space-x-2 shrink-0">
              {avatars.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Member avatar"
                  className="size-6 sm:size-6.5 rounded-full border-2 border-card object-cover ring-1 ring-border/20"
                  loading="lazy"
                />
              ))}
            </div>
          ) : (
            <div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Users className="size-3" />
            </div>
          )}
          <span className="text-xs font-semibold text-foreground/80 truncate">
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
        </div>

        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <JoinCommunityButton
            communityId={community.id}
            className="h-8.5 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm rounded-full shadow-md shadow-primary/20 border-0"
          />
        </div>
      </div>

      {/* Topic Tags Row */}
      {community.tags && community.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
          {community.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] sm:text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Row: Link Capsule Bar */}
      <div className="rounded-2xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors px-3.5 py-2.5 flex items-center justify-between group/link">
        <div className="flex items-center gap-2 min-w-0 text-xs font-medium">
          <Link2 className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">campusloop.space</span>
          <span className="text-muted-foreground truncate">/c/{community.slug || community.id}</span>
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover/link:text-foreground transition-colors shrink-0" />
      </div>
    </div>
  );
}
