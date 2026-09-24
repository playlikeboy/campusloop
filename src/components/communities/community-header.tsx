"use client";

import {
  ArrowLeft,
  Check,
  EyeOff,
  Globe,
  Lock,
  MessageCircle,
  Settings,
  Share2,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { recordCommunityInviteShare } from "@/app/app/(main)/communities/actions";
import { JoinCommunityButton } from "@/app/app/(main)/communities/join-community-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    creatorId: string;
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

function privacyMeta(privacy?: string) {
  if (privacy === "PRIVATE") return { label: "Private", Icon: Lock };
  if (privacy === "UNLISTED") return { label: "Secret", Icon: EyeOff };
  return { label: "Public", Icon: Globe };
}

export function CommunityHeader({
  community,
  membersCount,
  postsCount,
  isMember,
  isAdmin,
}: CommunityHeaderProps) {
  const pathname = usePathname();
  const [sharing, setSharing] = useState(false);
  const identifier = community.slug || community.id;
  const baseUrl = `/app/communities/${identifier}`;
  const PrivacyIcon = privacyMeta(community.privacy).Icon;

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? window.location.origin + baseUrl
        : "https://campusloop.space" + baseUrl;

    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "c/" + community.name,
          text: community.description || "Campus community on CampusLoop",
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Community link copied");
      }
      recordCommunityInviteShare(community.id).catch(() => {});
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast.error("Could not share this community");
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <header>
      <div className="sticky top-0 z-40 border-b border-border/20 bg-background/90 backdrop-blur-xl">
        <div className="flex min-h-12 items-center gap-2 px-3 sm:px-4">
          <Link
            href="/app/communities"
            aria-label="Back to communities"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <ArrowLeft className="size-4.5" />
          </Link>
          <Avatar className="size-7 shrink-0 rounded-full ring-1 ring-border/50">
            <AvatarImage
              src={getAvatarUrl(community.avatarUrl, community.name)}
              alt=""
              className="object-cover"
            />
            <AvatarFallback className="bg-muted text-[10px] font-black">
              {community.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1">
              <p className="truncate text-sm font-black">c/{community.name}</p>
              <PrivacyIcon className="size-3 shrink-0 text-muted-foreground" aria-label={privacyMeta(community.privacy).label} />
            </div>
            <p className="truncate text-[10px] font-medium text-muted-foreground">
              {membersCount} members · {postsCount} discussions
            </p>
          </div>

          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            aria-label="Share community"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
          >
            {sharing ? <Check className="size-4 text-primary" /> : <Share2 className="size-4" />}
          </button>

          {isAdmin ? (
            <Link
              href={baseUrl + "/settings"}
              aria-label="Community settings"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Settings className="size-4" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="relative h-24 overflow-hidden sm:h-28">
        {community.bannerUrl ? (
          <img
            src={community.bannerUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full bg-linear-to-r from-primary/20 via-primary/10 to-transparent" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-background/55 via-transparent to-transparent" />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-bold text-foreground backdrop-blur-md">
          <PrivacyIcon className="size-3" />
          {privacyMeta(community.privacy).label}
        </span>
      </div>

      <div className="relative px-4 sm:px-5">
        <div className="flex items-end justify-between gap-3">
          <Avatar className="-mt-9 size-20 shrink-0 rounded-2xl border-4 border-background bg-card shadow-sm sm:-mt-10 sm:size-22">
            <AvatarImage
              src={getAvatarUrl(community.avatarUrl, community.name)}
              alt={community.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted text-xl font-black">
              {community.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="pb-1">
            <JoinCommunityButton
              communityId={community.id}
              initialIsMember={isMember}
            />
          </div>
        </div>

        <div className="pt-3">
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 text-xl font-black tracking-tight sm:text-2xl">
              {community.name}
            </h1>
            <ShieldCheck className="size-4 shrink-0 text-primary" aria-label="Verified community" />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span className="font-bold text-primary">{community.category || "General"}</span>
            <span aria-hidden="true">·</span>
            <span>
              Created by{" "}
              <Link
                href={`/@${community.creator?.username || "student"}`}
                className="font-bold text-foreground hover:underline"
              >
                @{community.creator?.username || "student"}
              </Link>
            </span>
          </div>

          {community.description ? (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/90">
              {community.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
            <Link href={baseUrl + "/members"} className="font-bold hover:text-foreground">
              <Users className="mr-1 inline size-3.5" />
              {membersCount} members
            </Link>
            <span>
              <MessageCircle className="mr-1 inline size-3.5" />
              {postsCount} discussions
            </span>
            <span>
              <span className="font-black text-foreground">{community.points || 0}</span> LP
            </span>
          </div>
        </div>
      </div>

      <nav
        aria-label="Community sections"
        className={cn("mt-4 grid border-b border-border/20", isAdmin ? "grid-cols-3" : "grid-cols-2")}
      >
        <Link
          href={baseUrl}
          className={cn(
            "relative min-h-11 px-3 text-center text-xs font-bold transition-colors sm:flex sm:items-center sm:justify-center",
            pathname === baseUrl
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Discussions
          {pathname === baseUrl ? (
            <span className="absolute inset-x-10 bottom-0 h-0.5 rounded-full bg-primary sm:inset-x-16" />
          ) : null}
        </Link>

        <Link
          href={baseUrl + "/members"}
          className={cn(
            "relative min-h-11 px-3 text-center text-xs font-bold transition-colors sm:flex sm:items-center sm:justify-center",
            pathname === baseUrl + "/members"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Members
          {pathname === baseUrl + "/members" ? (
            <span className="absolute inset-x-10 bottom-0 h-0.5 rounded-full bg-primary sm:inset-x-16" />
          ) : null}
        </Link>

        {isAdmin ? (
          <Link
            href={baseUrl + "/settings"}
            className={cn(
              "relative min-h-11 px-3 text-center text-xs font-bold transition-colors sm:flex sm:items-center sm:justify-center",
              pathname === baseUrl + "/settings"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Settings
            {pathname === baseUrl + "/settings" ? (
              <span className="absolute inset-x-10 bottom-0 h-0.5 rounded-full bg-primary sm:inset-x-16" />
            ) : null}
          </Link>
        ) : null}
      </nav>
    </header>
  );
}
