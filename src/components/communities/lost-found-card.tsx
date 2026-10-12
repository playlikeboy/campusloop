"use client";

import {
  Calendar,
  CheckCircle2,
  Gift,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { LostAndFoundItem } from "@/db/schema";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo, getAvatarUrl } from "@/lib/utils";

interface LostFoundCardProps {
  item: LostAndFoundItem & {
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      points?: number | null;
    };
    institution?: { id: string; name: string; slug: string } | null;
  };
  currentUserId?: string;
  variant?: "card" | "list";
}

export function LostFoundCard({ item, currentUserId, variant = "card" }: LostFoundCardProps) {
  const [resolved, setResolved] = useState(item.isResolved);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const isLost = item.type === "LOST";
  const isOwner = currentUserId === item.authorId;

  const avatar = getAvatarUrl(item.author.avatarUrl, item.author.username);

  function handleClaimAction() {
    sounds.tap();
    haptics.light();
    setClaimModalOpen(true);
  }

  function handleDirectContact() {
    sounds.tap();
    haptics.light();
    if (item.contactInfo) {
      navigator.clipboard.writeText(item.contactInfo);
      toast.success(`Contact copied: ${item.contactInfo}`);
    } else {
      toast.info(`Message @${item.author.username} directly on CampusLoop`);
    }
  }

  function handleToggleResolve() {
    sounds.ting();
    haptics.success();
    const next = !resolved;
    setResolved(next);
    toast.success(next ? "Marked as resolved & returned!" : "Marked as active recovery");
  }

  function handleShare(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    sounds.tap();
    haptics.light();

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://campusloop.space";
    const shareUrl = `${baseUrl}/lost-and-found/${item.slug || item.id}`;

    if (navigator.share) {
      navigator
        .share({
          title: `[${item.type}] ${item.title} — CampusLoop Recovery`,
          text: `Help return this item on campus: ${item.title} (${item.location})`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Lost & Found link copied!");
    }
  }

  const detailHref = `/lost-and-found/${item.slug || item.id}`;

  return (
    <>
      <article
        className={cn(
          "group flex flex-col justify-between rounded-2xl border border-border/40 bg-card overflow-hidden transition-all duration-200 hover:shadow-md hover:border-border/80",
          resolved && "opacity-75"
        )}
      >
        {/* Card Media or Status Header */}
        {item.imageUrl ? (
          <div className="relative aspect-16/9 w-full bg-muted/30 overflow-hidden">
            <Link href={detailHref} className="block size-full">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                loading="lazy"
              />
            </Link>
            <div className="absolute top-2.5 left-2.5">
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs",
                  resolved
                    ? "bg-slate-900/80 text-slate-300"
                    : isLost
                    ? "bg-rose-600 text-white"
                    : "bg-emerald-600 text-white"
                )}
              >
                {resolved ? "Resolved" : isLost ? "Lost Item" : "Found Item"}
              </span>
            </div>
            <div className="absolute top-2.5 right-2.5">
              <button
                type="button"
                onClick={handleShare}
                className="flex size-8 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur-xs transition hover:bg-background hover:text-foreground shadow-2xs"
                title="Share"
                aria-label="Share"
              >
                <Share2 className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-3 bg-muted/15">
            <span
              className={cn(
                "rounded-lg px-2.5 py-0.5 text-xs font-black uppercase tracking-wider border shadow-2xs",
                resolved
                  ? "bg-muted text-muted-foreground border-border/50"
                  : isLost
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              )}
            >
              {resolved ? "Resolved" : isLost ? "Lost Item" : "Found Item"}
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Share"
              aria-label="Share"
            >
              <Share2 className="size-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
          <div className="space-y-1.5">
            <Link href={detailHref} className="block group-hover:text-primary transition-colors">
              <h3 className="text-sm font-black text-foreground leading-snug line-clamp-2">
                {item.title}
              </h3>
            </Link>

            {item.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            ) : null}

            {/* Location & Time specs */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium bg-muted/40 px-2 py-0.5 rounded-lg border border-border/30">
                <MapPin className="size-3 text-rose-500 shrink-0" />
                <span className="truncate max-w-[150px]">{item.location}</span>
              </span>

              {item.itemDate ? (
                <span className="inline-flex items-center gap-1 font-medium bg-muted/40 px-2 py-0.5 rounded-lg border border-border/30">
                  <Calendar className="size-3 text-primary shrink-0" />
                  <span>{item.itemDate}</span>
                </span>
              ) : null}

              {item.reward ? (
                <span className="inline-flex items-center gap-1 font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  <Gift className="size-3 shrink-0" />
                  <span>Reward: {item.reward}</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Author Trust & Safe Recovery CTA */}
          <div className="border-t border-border/30 pt-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/@${item.author.username}`}
                className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
              >
                <Avatar className="size-5 rounded-full border border-border/50 shrink-0">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="text-[9px] font-bold">
                    {item.author.displayName[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-foreground truncate">
                  {item.author.displayName}
                </span>
                {(item.author.points || 0) >= 150 ? (
                  <span title="Verified student">
                    <ShieldCheck className="size-3.5 text-primary shrink-0" />
                  </span>
                ) : null}
              </Link>

              <span className="text-[11px] text-muted-foreground shrink-0">
                {formatTimeAgo(item.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!resolved ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleClaimAction}
                  className={cn(
                    "flex-1 font-bold h-9 text-xs gap-1.5",
                    isLost
                      ? "bg-rose-600 hover:bg-rose-500 text-white"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  )}
                >
                  <MessageCircle className="size-3.5" />
                  <span>{isLost ? "I Found This!" : "Claim Item"}</span>
                </Button>
              ) : (
                <div className="flex-1 text-center py-1.5 text-xs font-bold text-muted-foreground bg-muted/40 rounded-xl">
                  Resolved &amp; Returned
                </div>
              )}

              {isOwner ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToggleResolve}
                  className="font-semibold text-xs h-9 px-3"
                >
                  <CheckCircle2 className="size-3.5 mr-1" />
                  {resolved ? "Reopen" : "Mark Resolved"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      {/* Safe Recovery Claim Modal */}
      {claimModalOpen ? (
        <div
          onClick={() => setClaimModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full rounded-3xl bg-background p-6 shadow-2xl border border-border/40 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Campus Safe Recovery
                </span>
                <h2 className="text-base font-black text-foreground">
                  {isLost ? "Report Finding Item" : "Claim This Item"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setClaimModalOpen(false)}
                className="size-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
              <p className="text-xs font-bold text-foreground">{item.title}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3 text-rose-500" />
                {item.location}
              </p>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground">Safe Handoff Protocol:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Meet in a public campus space (Library, Student Center, or Dean's Office).</li>
                <li>Verify ownership details (stickers, scratches, or college ID match).</li>
                <li>Never share private financial info or OTPs.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={() => {
                  handleDirectContact();
                  setClaimModalOpen(false);
                }}
                className="w-full font-bold h-10 gap-2"
              >
                <MessageCircle className="size-4" />
                Contact Owner Securely
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setClaimModalOpen(false)}
                className="w-full text-xs text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
