"use client";

import { Clock, Headphones, Laptop, MessageSquare, Smartphone, Tv } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function PlatformIcon({ platform }: { platform: string }) {
  const p = platform.toUpperCase();
  if (p === "MOBILE") return <Smartphone className="size-3.5" aria-hidden />;
  if (p === "PLAYSTATION" || p === "XBOX" || p === "CONSOLE") return <Tv className="size-3.5" aria-hidden />;
  return <Laptop className="size-3.5" aria-hidden />;
}

export function TeammateCard({ teammate }: TeammateCardProps) {
  const avatar = getAvatarUrl(teammate.user.avatarUrl, teammate.user.username);
  const style =
    teammate.playStyle === "COMPETITIVE"
      ? "Competitive"
      : teammate.playStyle === "CASUAL"
        ? "Casual"
        : "Ranked and casual";

  return (
    <article className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Link href={`/@${teammate.user.username}`} className="shrink-0" aria-hidden tabIndex={-1}>
            <Avatar className="size-11">
              <AvatarImage src={avatar} alt="" />
              <AvatarFallback className="text-sm">{teammate.user.displayName[0] || "U"}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0">
            <Link
              href={`/@${teammate.user.username}`}
              className="block truncate font-semibold text-fg hover:underline"
            >
              {teammate.user.displayName}
            </Link>
            <p className="truncate text-sm text-fg-muted">
              @{teammate.user.username}
              {teammate.institution ? ` · ${teammate.institution.name.split(",")[0]}` : ""}
            </p>
          </div>
        </div>

        {teammate.bio && <p className="line-clamp-2 text-sm text-fg">{teammate.bio}</p>}

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="brand">{teammate.primaryGame}</Badge>
          {teammate.games.map((g, idx) => (
            <Badge key={`${g.gameName}-${idx}`} variant="neutral">
              {g.gameName}
              {g.rankTier ? ` · ${g.rankTier}` : ""}
              {g.role ? ` · ${g.role}` : ""}
            </Badge>
          ))}
        </div>

        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-fg-muted">
          {teammate.platforms.map((plat) => (
            <li key={plat} className="inline-flex items-center gap-1 capitalize">
              <PlatformIcon platform={plat} />
              {plat.toLowerCase()}
            </li>
          ))}
          <li className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {teammate.preferredAvailability.toLowerCase()}
          </li>
          <li className="inline-flex items-center gap-1">
            <Headphones className="size-3.5" aria-hidden />
            {teammate.voicePreference.toLowerCase()}
          </li>
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-sm text-fg-muted">{style}</span>
        {!teammate.isSelf ? (
          <Button asChild size="sm">
            <Link href={`/chat?userId=${teammate.userId}`}>
              <MessageSquare aria-hidden /> Message
            </Link>
          </Button>
        ) : (
          <Badge variant="neutral">This is you</Badge>
        )}
      </div>
    </article>
  );
}
