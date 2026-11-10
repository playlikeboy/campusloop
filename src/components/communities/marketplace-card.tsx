"use client";

import { CheckCircle2, Image as ImageIcon, MapPin, MessageCircle, Share2, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { MarketplaceItem } from "@/db/schema";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo, getAvatarUrl } from "@/lib/utils";

interface MarketplaceCardProps {
  item: MarketplaceItem & {
    seller: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      points?: number | null;
    };
    institution?: { id: string; name: string; slug: string } | null;
  };
  currentUserId?: string;
  onDeleted?: (itemId: string) => void;
  variant?: "card" | "list";
}

const CONDITION_STYLES: Record<string, { label: string; badge: string }> = {
  BRAND_NEW: { label: "New", badge: "bg-surface text-fg border-border" },
  LIKE_NEW: { label: "Like new", badge: "bg-surface text-fg border-border" },
  GOOD: { label: "Good", badge: "bg-surface text-fg border-border" },
  FAIR: { label: "Used", badge: "bg-surface text-fg border-border" },
};

export function MarketplaceCard({ item, currentUserId, onDeleted, variant = "card" }: MarketplaceCardProps) {
  const router = useRouter();
  const [sold, setSold] = useState(item.isSold);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isUpdatingSold, setIsUpdatingSold] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  const isOwner = currentUserId === item.sellerId;
  const avatar = getAvatarUrl(item.seller.avatarUrl, item.seller.username);

  let images: string[] = [];
  try {
    if (item.images) {
      const parsed = JSON.parse(item.images);
      images = Array.isArray(parsed) ? parsed : [item.images];
    }
  } catch {
    if (item.images) images = [item.images];
  }

  const conditionInfo = CONDITION_STYLES[item.condition] || {
    label: item.condition.replace("_", " "),
    badge: "bg-surface text-fg border-border",
  };

  const discountPercent =
    item.originalPrice && item.originalPrice > item.price
      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
      : null;

  async function handleChatSeller() {
    if (isOwner) {
      toast.info("This is your listing");
      return;
    }

    sounds.tap();
    haptics.light();
    setIsStartingChat(true);

    try {
      toast.loading(`Opening chat with @${item.seller.username}...`, { id: "chat-seller" });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: item.seller.id,
          content: `Hi @${item.seller.username}, is "${item.title}" (₹${item.price.toLocaleString("en-IN")}) still available on CampusLoop?`,
        }),
      });

      if (!res.ok) throw new Error("Couldn't open the chat. Try again.");

      const data = (await res.json()) as { id: string };
      toast.success("Chat opened", { id: "chat-seller" });
      router.push(`/chat/${data.id}`);
    } catch {
      toast.error("Could not open chat with seller. Please try again.", { id: "chat-seller" });
    } finally {
      setIsStartingChat(false);
    }
  }

  async function handleToggleSold() {
    if (!isOwner || isUpdatingSold) return;

    sounds.ting();
    haptics.light();
    setIsUpdatingSold(true);
    const nextSold = !sold;

    try {
      const res = await fetch(`/api/buy-and-sell/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSold: nextSold }),
      });

      if (!res.ok) throw new Error();
      setSold(nextSold);
      toast.success(nextSold ? "Marked as sold" : "Marked as available");
    } catch {
      toast.error("Could not update listing status");
    } finally {
      setIsUpdatingSold(false);
    }
  }

  async function handleDeleteListing() {
    if (!isOwner || isDeleting) return;
    if (!confirm("Are you sure you want to delete this listing?")) return;

    sounds.tap();
    haptics.light();
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/buy-and-sell/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Listing deleted");
      if (onDeleted) onDeleted(item.id);
      else router.refresh();
    } catch {
      toast.error("Couldn't delete the listing. Try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleShare(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    sounds.tap();
    haptics.light();
    const url = `${typeof window !== "undefined" ? window.location.origin : "https://campusloop.space"}/buy-and-sell?id=${item.id}`;
    if (navigator.share) {
      navigator
        .share({
          title: `${item.title} — ₹${item.price.toLocaleString("en-IN")}`,
          text: `Check out this student listing on CampusLoop: ${item.title}`,
          url,
        })
        .catch(() => {});
      return;
    }
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <>
      <article
        className={cn(
          "group flex flex-col justify-between rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-colors hover:border-[var(--border-strong)]",
          variant === "list" && "sm:flex-row sm:items-center"
        )}
      >
        {/* Product Media Area */}
        <div
          className={cn(
            "relative w-full bg-muted/30 overflow-hidden shrink-0",
            variant === "list" ? "sm:w-48 sm:h-full aspect-video sm:aspect-auto" : "aspect-4/3"
          )}
        >
          {images.length > 0 ? (
            <button
              type="button"
              onClick={() => setActiveImageModal(images[0])}
              className="size-full focus:outline-none cursor-pointer block"
              aria-label={`View photo of ${item.title}`}
            >
              <img
                src={images[0]}
                alt={item.title}
                className="size-full object-cover transition-transform duration-300"
                loading="lazy"
              />
            </button>
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/40">
              <ImageIcon className="size-10" />
            </div>
          )}

          {/* Overlaid Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 pointer-events-none">
            {sold ? (
              <span className="rounded-lg bg-overlay px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                Sold
              </span>
            ) : (
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-xs font-bold border shadow-2xs",
                  conditionInfo.badge
                )}
              >
                {conditionInfo.label}
              </span>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleShare}
              aria-label="Share listing"
              className="bg-surface shadow-xs"
            >
              <Share2 />
            </Button>
          </div>

          {discountPercent ? (
            <div className="absolute bottom-2.5 left-2.5 rounded-md bg-success px-1.5 py-0.5 text-xs font-bold text-white shadow-2xs">
              {discountPercent}% off
            </div>
          ) : null}

          {images.length > 1 ? (
            <div className="absolute bottom-2.5 right-2.5 rounded-md bg-overlay px-1.5 py-0.5 text-xs font-bold text-white">
              +{images.length - 1} photos
            </div>
          ) : null}
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
          <div className="space-y-1.5">
            {/* Price & Negotiation Row */}
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  ₹{item.price.toLocaleString("en-IN")}
                </span>
                {item.originalPrice && item.originalPrice > item.price ? (
                  <span className="text-xs text-muted-foreground/60 line-through">
                    ₹{item.originalPrice.toLocaleString("en-IN")}
                  </span>
                ) : null}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {item.isNegotiable ? "Negotiable" : "Fixed"}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-foreground line-clamp-1 leading-snug">{item.title}</h3>

            {/* Description snippet */}
            {item.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
            ) : null}

            {/* Metadata tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              {item.hostelLocation ? (
                <span className="inline-flex items-center gap-1 font-medium">
                  <MapPin className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate max-w-[140px]">{item.hostelLocation}</span>
                </span>
              ) : null}
              {item.category ? (
                <span className="inline-flex items-center gap-1 font-medium">
                  <Tag className="size-3 shrink-0" aria-hidden="true" />
                  <span>{item.category}</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Seller Trust + Action Footer */}
          <div className="border-t border-border/30 pt-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/@${item.seller.username}`}
                className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
              >
                <Avatar className="size-6 rounded-full border border-border/50 shrink-0">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="text-xs font-bold">
                    {item.seller.displayName[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-foreground truncate">
                  {item.seller.displayName}
                </span>
              </Link>

              <span className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(item.createdAt)}</span>
            </div>

            {/* Action Bar */}
            {!isOwner ? (
              <Button
                type="button"
                onClick={handleChatSeller}
                disabled={sold}
                loading={isStartingChat}
                className="w-full"
              >
                {!isStartingChat && <MessageCircle />}
                {sold ? "Sold" : "Message seller"}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleSold}
                  loading={isUpdatingSold}
                  className="flex-1"
                >
                  {!isUpdatingSold && <CheckCircle2 />}
                  {sold ? "Mark available" : "Mark sold"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteListing}
                  loading={isDeleting}
                  className="text-fg-muted hover:bg-danger-subtle hover:text-danger"
                  aria-label="Delete listing"
                >
                  {!isDeleting && <Trash2 />}
                </Button>
              </div>
            )}
          </div>
        </div>
      </article>

      <Dialog open={Boolean(activeImageModal)} onOpenChange={(open) => !open && setActiveImageModal(null)}>
        <DialogContent className="max-w-xl overflow-hidden bg-surface-sunken p-0 sm:p-0">
          <DialogTitle className="sr-only">{item.title}</DialogTitle>
          {activeImageModal ? (
            <img
              src={activeImageModal}
              alt={item.title}
              className="mx-auto h-auto max-h-[80vh] w-full object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
