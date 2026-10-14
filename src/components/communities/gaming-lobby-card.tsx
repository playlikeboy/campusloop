"use client";

import { Clock, Copy, ExternalLink, Gamepad2, Share2, ShieldCheck, Sword, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { GamingLobby } from "@/db/schema";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo, getAvatarUrl } from "@/lib/utils";

interface GamingLobbyCardProps {
  item: GamingLobby & {
    host: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      points?: number | null;
    };
    institution?: { id: string; name: string; slug: string } | null;
  };
  currentUserId?: string;
  highlighted?: boolean;
}

function hasPlayer(players: string | null | undefined, userId?: string) {
  if (!players || !userId) return false;
  try {
    const members = JSON.parse(players) as Array<{ userId?: string }>;
    return Array.isArray(members) && members.some((member) => member?.userId === userId);
  } catch {
    return false;
  }
}

export function GamingLobbyCard({ item, currentUserId, highlighted = false }: GamingLobbyCardProps) {
  const [joined, setJoined] = useState(() => hasPlayer(item.players, currentUserId));
  const [slotsFilled, setSlotsFilled] = useState(item.slotsFilled);
  const [isPending, setIsPending] = useState(false);
  const { mutate: mutateCache } = useSWRConfig();

  const avatar = getAvatarUrl(item.host.avatarUrl, item.host.username);
  const isHost = currentUserId === item.hostId;
  const isFull = slotsFilled >= item.slotsTotal || item.status !== "OPEN";

  useEffect(() => {
    setJoined(hasPlayer(item.players, currentUserId));
    setSlotsFilled(item.slotsFilled);
  }, [item.players, item.slotsFilled, currentUserId]);

  function getGameColor(game: string) {
    switch (game.toLowerCase()) {
      case "valorant":
        return {
          badge: "bg-rose-500/15 text-rose-500 border-rose-500/30",
          accent: "text-rose-500",
        };
      case "chess":
        return {
          badge: "bg-amber-500/15 text-amber-500 border-amber-500/30",
          accent: "text-amber-500",
        };
      case "bgmi":
      case "bgmi / pubg":
        return {
          badge: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
          accent: "text-emerald-500",
        };
      case "fifa":
      case "ea sports fc / fifa":
        return {
          badge: "bg-sky-500/15 text-sky-500 border-sky-500/30",
          accent: "text-sky-500",
        };
      default:
        return {
          badge: "bg-purple-500/15 text-purple-500 border-purple-500/30",
          accent: "text-purple-500",
        };
    }
  }

  const gameStyle = getGameColor(item.gameName);

  function handleCopyGamerTag() {
    if (!item.gamerTag) return;
    sounds.tap();
    haptics.light();
    navigator.clipboard.writeText(item.gamerTag);
    toast.success(`Copied Riot/Gamer ID: ${item.gamerTag}`);
  }

  async function handleJoinLobby() {
    if (isHost || isPending) return;
    const nextJoined = !joined;
    setIsPending(true);
    sounds.tap();
    haptics.light();

    try {
      const response = await fetch(
        "/api/communities/hub/gaming/" + encodeURIComponent(item.id) + "/join",
        { method: nextJoined ? "POST" : "DELETE" }
      );
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        item?: { slotsFilled?: number };
      };
      if (!response.ok) throw new Error(result.error || "Could not update this lobby.");

      setJoined(nextJoined);
      if (typeof result.item?.slotsFilled === "number") setSlotsFilled(result.item.slotsFilled);
      void mutateCache((key) => typeof key === "string" && key.includes("tab=gaming"));
      toast.success(nextJoined ? "Joined lobby" : "Left lobby");
      if (nextJoined) sounds.match();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this lobby. Try again.");
    } finally {
      setIsPending(false);
    }
  }

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    sounds.tap();
    haptics.light();

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://campusloop.space";
    const shareUrl = baseUrl + "/gaming?id=" + encodeURIComponent(item.id);

    if (navigator.share) {
      navigator
        .share({
          title: `Gaming Lobby: ${item.gameName} — ${item.title}`,
          text: `Join ${item.gameName} squad lobby on CampusLoop!`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Gaming lobby link copied!");
    }
  }

  return (
    <div
      id={"gaming-lobby-" + item.id}
      className={cn(
        "scroll-mt-24 p-4 border-b border-border/20 transition-colors select-none",
        highlighted ? "rounded-2xl bg-primary/5 ring-2 ring-primary/40" : "hover:bg-muted/8"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href={`/@${item.host.username}`} className="shrink-0">
            <Avatar className="size-9 rounded-full border border-border/50">
              <AvatarImage src={avatar} />
              <AvatarFallback className="text-xs font-bold">{item.host.displayName[0] || "U"}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <Link
                href={`/@${item.host.username}`}
                className="text-xs font-bold text-foreground hover:underline truncate"
              >
                {item.host.displayName}
              </Link>
              {(item.host.points || 0) >= 150 && <ShieldCheck className="size-3.5 text-brand shrink-0" />}
              <span className="text-[11px] text-muted-foreground truncate">@{item.host.username}</span>
              <span className="text-[10px] text-muted-foreground/60">·</span>
              <span className="text-[11px] text-muted-foreground/80 shrink-0">
                {formatTimeAgo(item.createdAt)}
              </span>
            </div>
            {item.institution && (
              <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                {item.institution.name.split(",")[0]}
              </p>
            )}
          </div>
        </div>

        {/* Game Title Badge & Share Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-2xs flex items-center gap-1",
              gameStyle.badge
            )}
          >
            <Gamepad2 className="size-3" />
            <span>{item.gameName}</span>
          </span>

          <button
            type="button"
            onClick={handleShare}
            className="size-7 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Share or Copy Link"
          >
            <Share2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Lobby Title & Description */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-black text-foreground leading-snug">{item.title}</h3>
        {item.description && (
          <p className="text-xs text-muted-foreground/90 leading-relaxed font-normal">{item.description}</p>
        )}
      </div>

      {/* Details Bar (Mode, Rank, Schedule, GamerTag) */}
      <div className="flex flex-wrap items-center gap-2 pt-3">
        <div className="flex items-center gap-1 text-[11px] font-bold text-foreground/80 px-2.5 py-1 rounded-xl bg-muted/40 border border-border/40">
          <Sword className="size-3 text-purple-500 shrink-0" />
          <span>{item.mode}</span>
        </div>

        {item.rankTier && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground px-2.5 py-1 rounded-xl bg-muted/30 border border-border/30">
            <span>Tier: {item.rankTier}</span>
          </div>
        )}

        {item.scheduledAt && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground px-2.5 py-1 rounded-xl bg-muted/30 border border-border/30">
            <Clock className="size-3 text-amber-500 shrink-0" />
            <span>{item.scheduledAt}</span>
          </div>
        )}

        {item.gamerTag && (
          <button
            type="button"
            onClick={handleCopyGamerTag}
            className="flex items-center gap-1 text-[11px] font-bold text-foreground/90 px-2.5 py-1 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/40 transition-colors cursor-pointer"
            title="Click to copy in-game ID"
          >
            <span>Tag: {item.gamerTag}</span>
            <Copy className="size-2.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Slots Progress Bar */}
      <div className="mt-3.5 space-y-1.5 p-3 rounded-2xl bg-muted/20 border border-border/30">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-muted-foreground flex items-center gap-1">
            <Users className="size-3.5" />
            <span>Lobby Squad</span>
          </span>
          <span className="font-black text-foreground tabular-nums">
            {slotsFilled} / {item.slotsTotal} Players
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isFull ? "bg-rose-500" : "bg-purple-500"
            )}
            style={{ width: `${Math.min(100, (slotsFilled / item.slotsTotal) * 100)}%` }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/15 mt-3">
        <button
          type="button"
          onClick={() => void handleJoinLobby()}
          disabled={isPending || isHost || (isFull && !joined)}
          aria-busy={isPending}
          className={cn(
            "flex min-h-9 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-70",
            isHost || joined
              ? "bg-muted text-foreground hover:bg-muted/80"
              : isFull
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
          )}
        >
          <Gamepad2 className="size-3.5" />
          <span>
            {isHost ? "You’re hosting" : isPending ? "Updating…" : joined ? "Leave lobby" : isFull ? "Lobby full" : "Join lobby"}
          </span>
        </button>

        {item.discordOrVoiceUrl && (
          <a
            href={item.discordOrVoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Voice / Discord</span>
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  );
}
