"use client";

import {
  Check,
  Eye,
  Home,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
      toast.success("Housing listing link copied!");
    }
  }

  return (
    <>
      <article
        onClick={() => setDetailModalOpen(true)}
        className={cn(
          "group flex flex-col justify-between rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all hover:border-[var(--border-strong)] cursor-pointer",
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
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground/30">
              <Home className="size-10" />
            </div>
          )}

          {/* Badges Overlaid */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 pointer-events-none">
            <span className="rounded-lg bg-black/75 px-2 py-0.5 text-[11px] font-black text-white backdrop-blur-xs shadow-xs">
              ₹{item.rentPerMonth.toLocaleString("en-IN")}/mo
            </span>
            {item.genderPreference ? (
              <span className="rounded-lg bg-background/85 px-2 py-0.5 text-[10px] font-bold text-foreground backdrop-blur-xs border border-border/30">
                {item.genderPreference.replace("_", " ")}
              </span>
            ) : null}
          </div>

          <div className="absolute top-2.5 right-2.5">
            <button
              type="button"
              onClick={handleShare}
              className="flex size-8 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur-xs transition hover:bg-background hover:text-foreground shadow-2xs"
              title="Share listing"
              aria-label="Share listing"
            >
              <Share2 className="size-3.5" />
            </button>
          </div>

          {item.distanceFromCampus ? (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
              <MapPin className="size-2.5 text-amber-400 shrink-0" />
              <span>{item.distanceFromCampus}</span>
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
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
            </div>

            {/* Location & Occupancy line */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium">
                <MapPin className="size-3 text-rose-500 shrink-0" />
                <span className="truncate max-w-[160px]">{item.location}</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-foreground/80">
                {item.occupancyType ? item.occupancyType.replace("_", " ") : "Room / Flat"}
              </span>
            </div>

            {/* Description */}
            {item.description ? (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            ) : null}

            {/* Top Amenities Chips */}
            {amenities.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-1">
                {amenities.slice(0, 4).map((am) => (
                  <span
                    key={am}
                    className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    <Check className="size-2.5 text-emerald-500" />
                    <span>{am}</span>
                  </span>
                ))}
                {amenities.length > 4 ? (
                  <span className="rounded-md bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
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
              </div>

              <span className="text-[11px] text-muted-foreground shrink-0">
                {formatTimeAgo(item.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailModalOpen(true);
                }}
                className="flex-1 font-bold h-9 text-xs gap-1"
              >
                <Eye className="size-3.5" />
                View Details
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleContact}
                className="flex-1 font-bold h-9 text-xs gap-1 bg-amber-600 hover:bg-amber-500 text-white"
              >
                <MessageCircle className="size-3.5" />
                Contact Owner
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* Full Housing Detail Modal */}
      {detailModalOpen ? (
        <div
          onClick={() => setDetailModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-xl max-h-[85vh] w-full overflow-y-auto rounded-3xl bg-background p-6 shadow-2xl border border-border/40 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {item.occupancyType ? item.occupancyType.replace("_", " ") : "Housing Listing"}
                </span>
                <h2 className="text-lg font-black text-foreground">{item.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="size-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
                aria-label="Close details"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Gallery */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${item.title} - ${idx + 1}`}
                    className={cn(
                      "w-full object-cover rounded-xl",
                      idx === 0 && images.length % 2 !== 0 ? "col-span-2 h-56" : "h-36"
                    )}
                  />
                ))}
              </div>
            ) : null}

            {/* Price & Primary Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border/40 bg-card p-3 text-center">
                <span className="text-[11px] text-muted-foreground font-medium">Rent</span>
                <p className="text-base font-black text-foreground mt-0.5">
                  ₹{item.rentPerMonth.toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] text-muted-foreground">per month</span>
              </div>
              <div className="rounded-xl border border-border/40 bg-card p-3 text-center">
                <span className="text-[11px] text-muted-foreground font-medium">Location</span>
                <p className="text-xs font-bold text-foreground mt-0.5 truncate">{item.location}</p>
                <span className="text-[10px] text-muted-foreground">{item.distanceFromCampus || "Near campus"}</span>
              </div>
              <div className="rounded-xl border border-border/40 bg-card p-3 text-center">
                <span className="text-[11px] text-muted-foreground font-medium">Preference</span>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {item.genderPreference ? item.genderPreference.replace("_", " ") : "Any"}
                </p>
                <span className="text-[10px] text-muted-foreground">Students</span>
              </div>
              <div className="rounded-xl border border-border/40 bg-card p-3 text-center">
                <span className="text-[11px] text-muted-foreground font-medium">Room Type</span>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {item.occupancyType ? item.occupancyType.replace("_", " ") : "Shared"}
                </p>
                <span className="text-[10px] text-muted-foreground">Occupancy</span>
              </div>
            </div>

            {/* Description */}
            {item.description ? (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About the place</h3>
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            ) : null}

            {/* Amenities */}
            {amenities.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {amenities.map((am) => (
                    <div
                      key={am}
                      className="flex items-center gap-2 rounded-xl border border-border/40 bg-card p-2.5 text-xs font-medium text-foreground"
                    >
                      <Check className="size-3.5 text-emerald-500 shrink-0" />
                      <span>{am}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Contact Owner Action */}
            <div className="flex flex-col sm:flex-row items-center gap-3 border-t border-border/40 pt-4">
              <div className="flex items-center gap-2.5 w-full sm:w-auto min-w-0">
                <Avatar className="size-9 rounded-full border border-border/50">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="text-xs font-bold">
                    {item.author.displayName[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{item.author.displayName}</p>
                  <p className="text-[11px] text-muted-foreground">Verified Student Poster</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                <Button
                  type="button"
                  onClick={handleContact}
                  className="flex-1 sm:flex-initial font-bold bg-amber-600 hover:bg-amber-500 text-white gap-2 h-10 px-5"
                >
                  <MessageCircle className="size-4" />
                  Contact / Get Info
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleShare}
                  className="h-10 px-3"
                  aria-label="Share"
                >
                  <Share2 className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
