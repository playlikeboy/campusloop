"use client";

import {
  Clock,
  Gamepad2,
  Headphones,
  Laptop,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Tv,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/utils";

interface TeammateCardProps {
  teammate: {
    id: string;
    userId: string;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      points?: number | null;
      branch?: string | null;
      year?: number | null;
    };
    institution?: { id: string; name: string; slug: string } | null;
    primaryGame: string;
    games: Array<{
      gameName: string;
      gamerTag: string;
      rankTier?: string;
      role?: string;
    }>;
    platforms: string[];
    playStyle: string;
    preferredAvailability: string;
    voicePreference: string;
    bio?: string | null;
    isSelf?: boolean;
  };
}

export function TeammateCard({ teammate }: TeammateCardProps) {
  const avatar = getAvatarUrl(teammate.user.avatarUrl, teammate.user.username);

  function getPlatformIcon(platform: string) {
    switch (platform.toUpperCase()) {
      case "MOBILE":
        return <Smartphone className="size-3" />;
      case "PLAYSTATION":
      case "XBOX":
      case "CONSOLE":
        return <Tv className="size-3" />;
      default:
        return <Laptop className="size-3" />;
    }
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-4 transition-all hover:border-primary/40 hover:bg-card/90 shadow-2xs">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href={`/@${teammate.user.username}`} className="shrink-0">
              <Avatar className="size-10 rounded-full border border-border/50">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-xs font-bold">
                  {teammate.user.displayName[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <Link
                  href={`/@${teammate.user.username}`}
                  className="text-xs font-bold text-foreground hover:underline truncate"
                >
                  {teammate.user.displayName}
                </Link>
                {(teammate.user.points || 0) >= 150 && (
                  <ShieldCheck className="size-3.5 text-primary shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                @{teammate.user.username}
                {teammate.user.branch && ` · ${teammate.user.branch}`}
              </p>
              {teammate.institution && (
                <p className="text-[10px] text-muted-foreground/80 font-medium truncate mt-0.5">
                  {teammate.institution.name.split(",")[0]}
                </p>
              )}
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-500 border border-emerald-500/20">
            LFT
          </span>
        </div>

        {/* Bio */}
        {teammate.bio && (
          <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed mb-3 font-normal">
            {teammate.bio}
          </p>
        )}

        {/* Primary Game & Secondary Games */}
        <div className="space-y-1.5 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-black text-primary border border-primary/20">
              <Gamepad2 className="size-3" />
              <span>{teammate.primaryGame}</span>
            </span>

            {teammate.games.map((g, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-lg bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-foreground border border-border/40"
              >
                <span>{g.gameName}</span>
                {g.rankTier && <span className="text-[10px] text-muted-foreground">({g.rankTier})</span>}
                {g.role && <span className="text-[10px] text-primary">· {g.role}</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Preferences: Platforms, Times, Voice */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
          {teammate.platforms.map((plat) => (
            <span
              key={plat}
              className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border/30"
            >
              {getPlatformIcon(plat)}
              <span>{plat}</span>
            </span>
          ))}

          <span className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/30">
            <Clock className="size-2.5 text-amber-500" />
            <span>{teammate.preferredAvailability.toLowerCase()}</span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-md bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/30">
            <Headphones className="size-2.5 text-purple-500" />
            <span>{teammate.voicePreference.toLowerCase()}</span>
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-border/15 flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground">
          {teammate.playStyle === "COMPETITIVE"
            ? "Competitive Scrims"
            : teammate.playStyle === "CASUAL"
              ? "Casual Fun"
              : "Ranked & Casual"}
        </span>

        {!teammate.isSelf ? (
          <Link
            href={`/chat?userId=${teammate.userId}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-95"
          >
            <MessageSquare className="size-3" />
            <span>Squad Up</span>
          </Link>
        ) : (
          <span className="text-[11px] font-bold text-primary">Your Card</span>
        )}
      </div>
    </div>
  );
}
