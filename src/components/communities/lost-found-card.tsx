"use client";

import { Calendar, CheckCircle2, Gift, MapPin, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    toast.success(next ? "Marked as returned" : "Marked as still missing");
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
      toast.success("Link copied");
    }
  }

  const detailHref = `/lost-and-found/${item.slug || item.id}`;

  return (
    <>
      <article
        className={cn(
          "group flex flex-col justify-between rounded-2xl border border-border/40 bg-card overflow-hidden transition-colors duration-200 hover:shadow-sm hover:border-border/80",
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
                className="size-full object-cover transition-transform duration-300 cursor-pointer"
                loading="lazy"
              />
            </Link>
            <div className="absolute top-2.5 left-2.5">
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-xs font-bold shadow-xs",
                  resolved
                    ? "bg-surface-muted text-fg-muted"
                    : isLost
                      ? "bg-danger text-danger-fg"
                      : "bg-success text-success-fg"
                )}
              >
                {resolved ? "Resolved" : isLost ? "Lost" : "Found"}
              </span>
            </div>
            <div className="absolute top-2.5 right-2.5">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleShare}
                aria-label="Share"
                className="bg-surface shadow-xs"
              >
                <Share2 />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-3 bg-muted/15">
            <span
              className={cn(
                "rounded-lg px-2.5 py-0.5 text-xs font-bold border shadow-2xs",
                resolved
                  ? "bg-muted text-muted-foreground border-border/50"
                  : isLost
                    ? "bg-danger-subtle text-danger border-danger"
                    : "bg-success-subtle text-success border-success"
              )}
            >
              {resolved ? "Resolved" : isLost ? "Lost" : "Found"}
            </span>

            <Button type="button" variant="ghost" size="icon" onClick={handleShare} aria-label="Share">
              <Share2 />
            </Button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
          <div className="space-y-1.5">
            <Link href={detailHref} className="block group-hover:text-primary transition-colors">
              <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{item.title}</h3>
            </Link>

            {item.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
            ) : null}

            {/* Location & Time specs */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium bg-muted/40 px-2 py-0.5 rounded-lg border border-border/30">
                <MapPin className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[150px]">{item.location}</span>
              </span>

              {item.itemDate ? (
                <span className="inline-flex items-center gap-1 font-medium bg-muted/40 px-2 py-0.5 rounded-lg border border-border/30">
                  <Calendar className="size-3 shrink-0" aria-hidden="true" />
                  <span>{item.itemDate}</span>
                </span>
              ) : null}

              {item.reward ? (
                <span className="inline-flex items-center gap-1 font-bold bg-warning-subtle text-warning px-2 py-0.5 rounded-lg border border-warning">
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
                  <AvatarFallback className="text-xs font-bold">
                    {item.author.displayName[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-foreground truncate">
                  {item.author.displayName}
                </span>
              </Link>

              <span className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(item.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2">
              {!resolved ? (
                <Button type="button" onClick={handleClaimAction} className="flex-1">
                  <MessageCircle />
                  <span>{isLost ? "I found this" : "This is mine"}</span>
                </Button>
              ) : (
                <p className="flex-1 rounded-full bg-surface-muted py-2.5 text-center text-sm font-semibold text-fg-muted">
                  Returned
                </p>
              )}

              {isOwner ? (
                <Button type="button" variant="outline" onClick={handleToggleResolve}>
                  <CheckCircle2 />
                  {resolved ? "Reopen" : "Mark returned"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      <Dialog open={claimModalOpen} onOpenChange={setClaimModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isLost ? "You found this?" : "Is this yours?"}</DialogTitle>
            <DialogDescription>
              {item.title} · {item.location}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm text-fg-muted">
            <p className="font-semibold text-fg">Before you meet</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Meet in a public place on campus, like the library.</li>
              <li>Check it's theirs: ask about stickers, scratches or their college ID.</li>
              <li>Never share bank details or OTPs.</li>
            </ul>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setClaimModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                handleDirectContact();
                setClaimModalOpen(false);
              }}
            >
              <MessageCircle />
              {isLost ? "Contact owner" : "Contact finder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
