"use client";

import {
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Gamepad2,
  Loader2,
  MessageSquare,
  Play,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sword,
  Users,
  XCircle,
} from "lucide-react";
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
    members?: Array<{
      id: string;
      userId: string;
      role?: string | null;
      gamerTag?: string | null;
      user?: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl?: string | null;
      };
    }>;
    isJoined?: boolean;
    isHost?: boolean;
  };
  currentUserId?: string;
  highlighted?: boolean;
  onRefresh?: () => void;
}

export function GamingLobbyCard({ item, currentUserId, highlighted = false, onRefresh }: GamingLobbyCardProps) {
  // Determine if current user is member from item or parsed players
  const initialIsJoined = (() => {
    if (item.isJoined !== undefined) return item.isJoined;
    if (!currentUserId) return false;
    if (item.hostId === currentUserId) return true;
    if (item.members && item.members.some((m) => m.userId === currentUserId)) return true;
    try {
      const players = item.players ? JSON.parse(item.players) : [];
      return players.some((p: any) => p.userId === currentUserId);
    } catch {
      return false;
    }
  })();

  const isHost = currentUserId ? item.hostId === currentUserId || item.isHost : false;
  const [joined, setJoined] = useState(initialIsJoined);
  const [slotsFilled, setSlotsFilled] = useState(item.slotsFilled);
  const [status, setStatus] = useState(item.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatar = getAvatarUrl(item.host.avatarUrl, item.host.username);
  const isFull = slotsFilled >= item.slotsTotal || status !== "OPEN";

  // Parse roster players for visual chips
  const rosterPlayers: any[] = (() => {
    if (item.members && item.members.length > 0) {
      return item.members.map((m) => ({
        userId: m.userId,
        username: m.user?.username || "player",
        displayName: m.user?.displayName || "Player",
        avatarUrl: m.user?.avatarUrl,
        role: m.role || "Member",
        gamerTag: m.gamerTag,
      }));
    }
    try {
      return item.players ? JSON.parse(item.players) : [];
    } catch {
      return [];
    }
  })();

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
    if (isSubmitting) return;

    if (!currentUserId) {
      toast.error("Please sign in to join gaming lobbies");
      return;
    }

    if (joined) {
      if (isHost) {
        toast.info("As host, you can start, complete, or cancel the lobby below.");
        return;
      }

      setIsSubmitting(true);
      sounds.tap();
      haptics.light();

      try {
        const res = await fetch(`/api/gaming/lobbies/${item.id}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = (await res.json()) as any;
        if (!res.ok) {
          throw new Error(data.error || "Failed to leave lobby");
        }

        setJoined(false);
        setSlotsFilled(data.slotsFilled);
        setStatus(data.status);
        toast.info("Left squad lobby");
        onRefresh?.();
      } catch (err: any) {
        toast.error(err.message || "Could not leave lobby");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (isFull) {
        toast.error("Lobby is currently full!");
        return;
      }

      setIsSubmitting(true);
      sounds.match();
      haptics.match();

      try {
        const res = await fetch(`/api/gaming/lobbies/${item.id}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "Squad Player" }),
        });

        const data = (await res.json()) as any;
        if (!res.ok) {
          throw new Error(data.error || "Failed to join lobby");
        }

        setJoined(true);
        setSlotsFilled(data.slotsFilled);
        setStatus(data.status);
        toast.success("Joined squad! Coordinate via voice or CampusLoop chat.");
        onRefresh?.();
      } catch (err: any) {
        toast.error(err.message || "Could not join lobby");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  async function handleHostAction(nextStatus: "IN_GAME" | "COMPLETED" | "CANCELLED") {
    if (isSubmitting) return;
    setIsSubmitting(true);
    sounds.tap();
    haptics.light();

    try {
      const res = await fetch(`/api/gaming/lobbies/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) {
        throw new Error(data.error || "Failed to update lobby");
      }

      setStatus(nextStatus);
      if (nextStatus === "IN_GAME") toast.success("Match marked as in progress!");
      else if (nextStatus === "COMPLETED") toast.success("Lobby marked completed!");
      else if (nextStatus === "CANCELLED") toast.info("Lobby cancelled.");
      onRefresh?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    sounds.tap();
    haptics.light();

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://campusloop.space";
    const shareUrl = `${baseUrl}/gaming?id=${encodeURIComponent(item.id)}`;

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
        "rounded-2xl border border-border/70 bg-card/60 p-4 transition-all hover:border-primary/30 hover:bg-card/90 shadow-2xs scroll-mt-24",
        highlighted ? "ring-2 ring-primary/40 bg-primary/5" : ""
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
              {(item.host.points || 0) >= 150 && <ShieldCheck className="size-3.5 text-primary shrink-0" />}
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

        {/* Game Title Badge & Status Badge & Share Button */}
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

          {status !== "OPEN" && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                status === "FULL"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  : status === "IN_GAME"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : status === "COMPLETED"
                      ? "bg-muted text-muted-foreground border-border"
                      : "bg-rose-500/10 text-rose-500 border-rose-500/30"
              )}
            >
              {status === "IN_GAME" ? "In Match" : status}
            </span>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="size-7 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Share or Copy Link"
            aria-label="Share lobby link"
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
          <Sword className="size-3 text-primary shrink-0" />
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

      {/* Roster Squad Members Preview */}
      {rosterPlayers.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Squad:
          </span>
          {rosterPlayers.map((p, idx) => (
            <span
              key={p.userId || idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted/35 text-[11px] font-medium text-foreground border border-border/40"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{p.displayName || p.username}</span>
              {p.role && <span className="text-[9px] text-muted-foreground">({p.role})</span>}
            </span>
          ))}
        </div>
      )}

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
              isFull ? "bg-amber-500" : "bg-primary"
            )}
            style={{ width: `${Math.min(100, (slotsFilled / item.slotsTotal) * 100)}%` }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/15 mt-3">
        <div className="flex items-center gap-2">
          {/* Main Join / Leave Button */}
          {status !== "COMPLETED" && status !== "CANCELLED" && (
            <button
              type="button"
              disabled={isSubmitting || (isFull && !joined)}
              onClick={handleJoinLobby}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-60",
                joined
                  ? isHost
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-muted text-foreground hover:bg-muted/80 border border-border"
                  : isFull
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Gamepad2 className="size-3.5" />
              )}
              <span>
                {joined
                  ? isHost
                    ? "Host (You)"
                    : "Leave Squad"
                  : isFull
                    ? "Squad Full"
                    : "Join Squad"}
              </span>
            </button>
          )}

          {/* Host Controls */}
          {isHost && status === "OPEN" && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleHostAction("IN_GAME")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer"
            >
              <Play className="size-3" />
              <span>Start Match</span>
            </button>
          )}

          {isHost && status === "IN_GAME" && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleHostAction("COMPLETED")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 border border-sky-500/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="size-3" />
              <span>Complete</span>
            </button>
          )}

          {isHost && status !== "CANCELLED" && status !== "COMPLETED" && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleHostAction("CANCELLED")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-muted-foreground hover:text-rose-500 transition-all cursor-pointer"
            >
              <XCircle className="size-3" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        {/* External Voice / Discord Link & CampusLoop Chat */}
        <div className="flex items-center gap-3">
          <Link
            href={`/chat?userId=${item.host.id}`}
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="size-3" />
            <span>Chat Host</span>
          </Link>

          {item.discordOrVoiceUrl && (
            <a
              href={item.discordOrVoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Voice</span>
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
