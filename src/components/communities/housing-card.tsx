"use client";

import { Check, Eye, Home, MapPin, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { HousingListing } from "@/db/schema";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, formatTimeAgo, getAvatarUrl } from "@/lib/utils";

interface HousingCardProps {
  item: HousingListing & {
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

export function HousingCard({ item, currentUserId, variant = "card" }: HousingCardProps) {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const avatar = getAvatarUrl(item.author.avatarUrl, item.author.username);

  let amenities: string[] = [];
  try {
    if (item.amenities) {
      const parsed = JSON.parse(item.amenities);
      amenities = Array.isArray(parsed) ? parsed : [item.amenities];
    }
  } catch {
    if (item.amenities) amenities = [item.amenities];
  }

  let images: string[] = [];
  try {
    if (item.images) {
      const parsed = JSON.parse(item.images);
      images = Array.isArray(parsed) ? parsed : [item.images];
    }
  } catch {
    if (item.images) images = [item.images];
  }

  function handleContact(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    sounds.tap();
    haptics.light();
    if (item.contactInfo) {
      navigator.clipboard.writeText(item.contactInfo);
      toast.success(`Owner contact copied: ${item.contactInfo}`);
    } else {
      toast.info(`Message @${item.author.username} directly on CampusLoop`);
    }
  }

  function handleShare(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    sounds.tap();
    haptics.light();

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://campusloop.space";
    const shareUrl = `${baseUrl}/housing?id=${item.id}`;

    if (navigator.share) {
      navigator
        .share({
          title: item.title,
          text: `Check out this flat / room near campus: ${item.title} (₹${item.rentPerMonth.toLocaleString("en-IN")}/mo)`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    }
  }

  return (
    <>
      <article
        onClick={() => setDetailModalOpen(true)}
        className={cn(
          "group flex flex-col justify-between rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-colors hover:border-[var(--border-strong)] cursor-pointer",
          variant === "list" && "sm:flex-row sm:items-center"
        )}
      >
        {/* Photo Container */}
        <div
          className={cn(
            "relative w-full bg-muted/30 overflow-hidden shrink-0",
            variant === "list" ? "sm:w-56 aspect-video sm:aspect-auto sm:h-full" : "aspect-16/10"
          )}
        >
          {images.length > 0 ? (
            <img
              src={images[0]}
              alt={item.title}
              className="size-full object-cover transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/30">
              <Home className="size-10" />
            </div>
          )}

          {/* Badges Overlaid */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 pointer-events-none">
            <span className="rounded-lg bg-overlay px-2 py-0.5 text-xs font-bold text-white shadow-xs">
              ₹{item.rentPerMonth.toLocaleString("en-IN")}/mo
            </span>
            {item.genderPreference ? (
              <span className="rounded-lg bg-bg px-2 py-0.5 text-xs font-bold text-foreground border border-border/30">
                {item.genderPreference.replace("_", " ")}
              </span>
            ) : null}
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

          {item.distanceFromCampus ? (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-overlay px-2 py-0.5 text-xs font-semibold text-white">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              <span>{item.distanceFromCampus}</span>
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
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground line-clamp-1">{item.title}</h3>
            </div>

            {/* Location & Occupancy line */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium">
                <MapPin className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[160px]">{item.location}</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-foreground/80">
                {item.occupancyType ? item.occupancyType.replace("_", " ") : "Room / Flat"}
              </span>
            </div>

            {/* Description */}
            {item.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
            ) : null}

            {/* Top Amenities Chips */}
            {amenities.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-1">
                {amenities.slice(0, 4).map((am) => (
                  <span
                    key={am}
                    className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    <Check className="size-2.5 text-success" />
                    <span>{am}</span>
                  </span>
                ))}
                {amenities.length > 4 ? (
                  <span className="rounded-md bg-muted/30 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    +{amenities.length - 4} more
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Footer: Author Trust & CTAs */}
          <div className="border-t border-border/30 pt-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar className="size-5 rounded-full border border-border/50 shrink-0">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="text-xs font-bold">
                    {item.author.displayName[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-foreground truncate">
                  {item.author.displayName}
                </span>
              </div>

              <span className="text-xs text-muted-foreground shrink-0">{formatTimeAgo(item.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailModalOpen(true);
                }}
                className="flex-1"
              >
                <Eye />
                Details
              </Button>

              <Button type="button" onClick={handleContact} className="flex-1">
                <MessageCircle />
                Contact owner
              </Button>
            </div>
          </div>
        </div>
      </article>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-h-[85vh] max-w-xl space-y-5 overflow-y-auto">
          <DialogHeader className="mb-0">
            <DialogTitle>{item.title}</DialogTitle>
            <DialogDescription>
              {item.occupancyType ? item.occupancyType.replace("_", " ") : "Room"} · {item.location}
            </DialogDescription>
          </DialogHeader>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img, idx) => (
                <img
                  key={img}
                  src={img}
                  alt={`${item.title}, photo ${idx + 1}`}
                  className={cn(
                    "w-full rounded-md object-cover",
                    idx === 0 && images.length % 2 !== 0 ? "col-span-2 h-56" : "h-36"
                  )}
                />
              ))}
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md bg-surface-muted p-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-fg-muted">Rent</dt>
              <dd className="font-semibold text-fg">₹{item.rentPerMonth.toLocaleString("en-IN")}/month</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-fg-muted">Distance</dt>
              <dd className="truncate font-semibold text-fg">{item.distanceFromCampus || "Near campus"}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">For</dt>
              <dd className="font-semibold text-fg">
                {item.genderPreference ? item.genderPreference.replace("_", " ") : "Anyone"}
              </dd>
            </div>
            <div>
              <dt className="text-fg-muted">Room</dt>
              <dd className="font-semibold text-fg">
                {item.occupancyType ? item.occupancyType.replace("_", " ") : "Shared"}
              </dd>
            </div>
          </dl>

          {item.description ? (
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-fg">About the place</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-fg">{item.description}</p>
            </div>
          ) : null}

          {amenities.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-fg">What's included</h3>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {amenities.map((am) => (
                  <li key={am} className="flex items-center gap-2 text-sm text-fg">
                    <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
                    <span>{am}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col items-center gap-3 border-t border-border pt-4 sm:flex-row">
            <div className="flex w-full min-w-0 items-center gap-2.5 sm:w-auto">
              <Avatar className="size-9 rounded-full">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-xs font-semibold">
                  {item.author.displayName[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <p className="truncate text-sm font-semibold text-fg">{item.author.displayName}</p>
            </div>

            <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
              <Button type="button" onClick={handleContact} className="flex-1 sm:flex-initial">
                <MessageCircle />
                Contact owner
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleShare}
                aria-label="Share listing"
              >
                <Share2 />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
