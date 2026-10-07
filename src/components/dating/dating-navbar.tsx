"use client";

import {
  ArrowLeft,
  Flame,
  Heart,
  Lock,
  MessageCircleHeart,
  SlidersHorizontal,
  Sparkles,
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
  const isDeckHome = pathname === "/dating" || pathname === "/dating/discover";
  const isLikes = pathname.startsWith("/dating/likes");
  const isMatches = pathname.startsWith("/dating/matches");
  const isRequests = pathname.startsWith("/dating/requests");
  const isSettings = pathname.startsWith("/dating/settings") || pathname.startsWith("/dating/filters");

  // Determine back navigation destination
  const backHref = isDeckHome ? "/feeds" : "/dating";
  const backLabel = isDeckHome ? "Back to Campus Feed" : "Back to Match Deck";

  // Contextual Title
  const getHeaderTitle = () => {
    if (isLikes) return "Likes You";
    if (isMatches) return "Matches";
    if (isRequests) return "Secret Crush";
    if (isSettings) return "Preferences";
    return "Campus Match";
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

        {/* Center: Campus Match Branding */}
        <Link
          href="/dating"
          onClick={() => {
            sounds.tap();
            haptics.light();
          }}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="size-7 rounded-full bg-pink-500/10 dark:bg-pink-500/15 flex items-center justify-center text-pink-600 dark:text-pink-400 border border-pink-500/20 shadow-2xs group-hover:scale-105 transition-transform">
            <HeaderIcon className={cn("size-3.5", isDeckHome || isLikes ? "fill-pink-500 text-pink-500" : "")} />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-foreground leading-none">
                {getHeaderTitle()}
              </span>
              {isDeckHome && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-pink-500/10 px-1.5 py-0.5 text-[9px] font-bold text-pink-600 dark:text-pink-400">
                  <Sparkles className="size-2 text-pink-500" />
                  <span>Vibes</span>
                </span>
              )}
            </div>
            {collegeName && isDeckHome && (
              <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[140px] leading-tight">
                {collegeName}
              </span>
            )}
          </div>
        </Link>

        {/* Right: Quick Action Controls Cluster */}
        <div className="flex items-center gap-1.5">
          {/* Secret Crush Vault */}
          <Link
            href="/dating/requests"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            aria-label="Secret Crush Vault"
            title="Secret Crush Vault"
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-all border cursor-pointer active:scale-95",
              isRequests
                ? "bg-purple-500/15 text-purple-600 border-purple-500/30 shadow-xs ring-1 ring-purple-500/20"
                : "bg-muted/60 text-muted-foreground hover:text-purple-600 hover:bg-muted border-border/40"
            )}
          >
            <Lock className="size-4" />
          </Link>

          {/* Likes Action with Real-time Count Badge */}
          <Link
            href="/dating/likes"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            aria-label="Who Likes You"
            title="Who Likes You"
            className={cn(
              "relative flex size-9 items-center justify-center rounded-full transition-all border cursor-pointer active:scale-95",
              isLikes
                ? "bg-pink-500/15 text-pink-600 border-pink-500/30 shadow-xs ring-1 ring-pink-500/20"
                : "bg-muted/60 text-muted-foreground hover:text-pink-600 hover:bg-muted border-border/40"
            )}
          >
            <Heart className={cn("size-4", isLikes ? "fill-pink-500 text-pink-500" : "")} />
            {likesYouCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-pink-600 text-[9px] font-black text-white ring-2 ring-background animate-in zoom-in-50">
                {likesYouCount > 9 ? "9+" : likesYouCount}
              </span>
            )}
          </Link>

          {/* Preferences / Filter Action */}
          <Link
            href="/dating/settings"
            onClick={() => {
              sounds.tap();
              haptics.light();
            }}
            aria-label="Match Preferences"
            title="Match Preferences"
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-all border cursor-pointer active:scale-95",
              isSettings
                ? "bg-blue-500/15 text-blue-600 border-blue-500/30 shadow-xs ring-1 ring-blue-500/20"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border-border/40"
            )}
          >
            <SlidersHorizontal className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
