"use client";

import {
  ArrowLeft,
  Flame,
  Heart,
  Lock,
  MessageCircleHeart,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/db/schema";

interface DatingNavbarProps {
  profile?: UserProfile | null;
  collegeName?: string;
}

interface ProfilesResponse {
  meta?: {
    likesYouCount?: number;
    showingGender?: string;
  };
}

export function DatingNavbar({ collegeName }: DatingNavbarProps) {
  const pathname = usePathname();

  // Fetch likes count in real time
  const { data } = useSWR<ProfilesResponse>("/api/dating/profiles", {
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });

  const likesYouCount = data?.meta?.likesYouCount ?? 0;
  const isDeckHome = pathname === "/matching" || pathname === "/matching/discover";
  const isLikes = pathname.startsWith("/matching/likes");
  const isMatches = pathname.startsWith("/matching/matches");
  const isRequests = pathname.startsWith("/matching/requests");
  const isSettings = pathname.startsWith("/matching/settings") || pathname.startsWith("/matching/filters");

  // Determine back navigation destination
  const backHref = isDeckHome ? "/feeds" : "/matching";
  const backLabel = isDeckHome ? "Back to Campus Feed" : "Back to Matching";

  // Contextual Title
  const getHeaderTitle = () => {
    if (isLikes) return "Likes You";
    if (isMatches) return "Matches";
    if (isRequests) return "Secret Crush";
    if (isSettings) return "Preferences";
    return "Matching";
  };

  const HeaderIcon = isLikes
    ? Heart
    : isMatches
    ? MessageCircleHeart
    : isRequests
    ? Lock
    : isSettings
    ? SlidersHorizontal
    : Heart;

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/40 select-none shadow-2xs">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-3 sm:px-4">
        {/* Left: Navigation / Exit Control */}
        <Link
          href={backHref}
          onClick={() => {
            sounds.tap();
            haptics.light();
          }}
          aria-label={backLabel}
          title={backLabel}
          className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/40 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="size-4" />
        </Link>

        {/* Center: Matching Branding */}
        <Link
          href="/matching"
          onClick={() => {
            sounds.tap();
            haptics.light();
          }}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-2xs group-hover:scale-105 transition-transform">
            <HeaderIcon className={cn("size-3.5", isDeckHome || isLikes ? "fill-primary text-primary" : "")} />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-heading font-bold tracking-tight text-foreground leading-none">
                {getHeaderTitle()}
              </span>
              {/* Keep the matching header minimal; profile discovery is the primary focus. */}
            </div>
            {collegeName && isDeckHome && (
              <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[140px] leading-tight">
                {collegeName}
              </span>
            )}
          </div>
        </Link>

        {/* Right: Clean Contextual Info Badge without duplicating footer tabs */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/matching/settings"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            aria-label="Match Preferences"
            title="Match Preferences"
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-all border cursor-pointer active:scale-95",
              isSettings
                ? "bg-primary/15 text-primary border-primary/30 shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border-border/40"
            )}
          >
            <SlidersHorizontal className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
