"use client";

import {
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  BRAND_NEW: { label: "Brand New", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  LIKE_NEW: { label: "Like New", badge: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30" },
  GOOD: { label: "Good", badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  FAIR: { label: "Used / Fair", badge: "bg-muted text-muted-foreground border-border/40" },
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
    badge: "bg-muted text-muted-foreground border-border/40",
  };

  const discountPercent =
    item.originalPrice && item.originalPrice > item.price
      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
      : null;

  async function handleChatSeller() {
    if (isOwner) {
      toast.info("This is your own listing!");
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

      if (!res.ok) throw new Error("Failed to start chat session");

      const data = (await res.json()) as { id: string };
      toast.success("Chat opened!", { id: "chat-seller" });
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
      toast.success(nextSold ? "Listing marked as SOLD!" : "Listing marked as Available");
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
      toast.error("Failed to delete listing");
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
    toast.success("Listing link copied to clipboard!");
  }

  return (
    <>
      <article
        className={cn(
          "group flex flex-col justify-between rounded-2xl border border-border/40 bg-card overflow-hidden transition-all duration-200 hover:shadow-md hover:border-border/80",
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
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
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
              <span className="rounded-lg bg-black/80 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-xs shadow-xs">
                Sold Out
              </span>
            ) : (
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[11px] font-bold border backdrop-blur-md shadow-2xs",
                  conditionInfo.badge
                )}
              >
                {conditionInfo.label}
              </span>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5">
            <button
              type="button"
              onClick={handleShare}
              className="flex size-8 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur-xs transition hover:bg-background hover:text-foreground shadow-2xs cursor-pointer"
              title="Share listing"
              aria-label="Share listing"
            >
              <Share2 className="size-3.5" />
            </button>
          </div>

          {discountPercent ? (
            <div className="absolute bottom-2.5 left-2.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-black text-white shadow-2xs">
              {discountPercent}% OFF
            </div>
          ) : null}

          {images.length > 1 ? (
            <div className="absolute bottom-2.5 right-2.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
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
                <span className="text-xl font-black tracking-tight text-foreground">
                  ₹{item.price.toLocaleString("en-IN")}
                </span>
                {item.originalPrice && item.originalPrice > item.price ? (
                  <span className="text-xs text-muted-foreground/60 line-through">
                    ₹{item.originalPrice.toLocaleString("en-IN")}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                {item.isNegotiable ? "Negotiable" : "Fixed"}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-foreground line-clamp-1 leading-snug">
              {item.title}
            </h3>

            {/* Description snippet */}
            {item.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            ) : null}

            {/* Metadata tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              {item.hostelLocation ? (
                <span className="inline-flex items-center gap-1 font-medium">
                  <MapPin className="size-3 text-rose-500 shrink-0" />
                  <span className="truncate max-w-[140px]">{item.hostelLocation}</span>
                </span>
              ) : null}
              {item.category ? (
                <span className="inline-flex items-center gap-1 font-medium">
                  <Tag className="size-3 text-primary shrink-0" />
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
                  <AvatarFallback className="text-[10px] font-bold">
                    {item.seller.displayName[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-foreground truncate">
                  {item.seller.displayName}
                </span>
                {(item.seller.points || 0) >= 150 ? (
                  <span title="Verified student seller">
                    <ShieldCheck className="size-3.5 text-primary shrink-0" />
                  </span>
                ) : null}
              </Link>

              <span className="text-[11px] text-muted-foreground shrink-0">
                {formatTimeAgo(item.createdAt)}
              </span>
            </div>

            {/* Action Bar */}
            {!isOwner ? (
              <Button
                type="button"
                onClick={handleChatSeller}
                disabled={isStartingChat || sold}
                className={cn(
                  "w-full gap-1.5 font-bold h-9 text-xs",
                  sold ? "opacity-60" : "bg-emerald-600 hover:bg-emerald-500 text-white"
                )}
              >
                {isStartingChat ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <MessageCircle className="size-3.5" />
                )}
                <span>{sold ? "Item Sold" : "Chat with Seller"}</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToggleSold}
                  disabled={isUpdatingSold}
                  className="flex-1 gap-1 text-xs font-semibold h-9"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>{sold ? "Mark Available" : "Mark as Sold"}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteListing}
                  disabled={isDeleting}
                  className="size-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label="Delete listing"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Lightbox Modal */}
      {activeImageModal ? (
        <div
          onClick={() => setActiveImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl max-h-[85vh] w-full rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10"
          >
            <button
              type="button"
              onClick={() => setActiveImageModal(null)}
              className="absolute top-3 right-3 z-10 size-8 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center cursor-pointer"
              aria-label="Close photo preview"
            >
              <X className="size-4.5" />
            </button>
            <img
              src={activeImageModal}
              alt={item.title}
              className="w-full h-auto max-h-[80vh] object-contain mx-auto"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
