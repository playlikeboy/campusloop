"use client";

import { Car, Clock, MessageCircle, Share2, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { RidesharePool } from "@/db/schema";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn, getAvatarUrl } from "@/lib/utils";

interface RideshareCardProps {
  item: RidesharePool & {
    creator: {
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

export function RideshareCard({ item, currentUserId }: RideshareCardProps) {
  const [reserved, setReserved] = useState(false);
  const [availableSeats, setAvailableSeats] = useState(item.availableSeats);

  const avatar = getAvatarUrl(item.creator.avatarUrl, item.creator.username);
  const isFull = availableSeats <= 0;

  function handleReserveSeat() {
    if (reserved) {
      sounds.tap();
      haptics.light();
      setReserved(false);
      setAvailableSeats((prev) => prev + 1);
      toast.info("Seat cancelled");
    } else {
      if (isFull) {
        toast.error("This ride is full");
        return;
      }
      sounds.match();
      haptics.match();
      setReserved(true);
      setAvailableSeats((prev) => Math.max(0, prev - 1));
      toast.success("Seat booked. Message the host to plan pickup.");
    }
  }

  function handleCopyContact(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    sounds.tap();
    haptics.light();
    if (item.contactInfo) {
      navigator.clipboard.writeText(item.contactInfo);
      toast.success(`Host contact copied: ${item.contactInfo}`);
    } else {
      toast.info(`Message @${item.creator.username} directly on CampusLoop`);
    }
  }

  function handleShare(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    sounds.tap();
    haptics.light();

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://campusloop.space";
    const shareUrl = `${baseUrl}/rideshare?id=${item.id}`;

    if (navigator.share) {
      navigator
        .share({
          title: `Ride Share: ${item.origin} → ${item.destination}`,
          text: `Split cab fare: ${item.origin} to ${item.destination} (₹${item.pricePerSeat}/seat) on CampusLoop`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    }
  }

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-border/40 bg-card p-5 transition-colors duration-200 hover:shadow-sm hover:border-border/80 space-y-4">
      {/* Route Timeline Block */}
      <div className="space-y-3">
        {/* Origin & Destination Route */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-3 items-center justify-center rounded-full bg-success ring-4 ring-success" />
              <span className="text-sm font-bold text-foreground truncate">{item.origin}</span>
            </div>

            <div className="ml-1.5 h-4 border-l-2 border-dashed border-border" />

            <div className="flex items-center gap-2.5">
              <span className="flex size-3 items-center justify-center rounded-full bg-brand ring-4 ring-ring" />
              <span className="text-sm font-bold text-foreground truncate">{item.destination}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleShare}
            aria-label="Share ride"
            className="shrink-0"
          >
            <Share2 />
          </Button>
        </div>

        {/* Departure Time & Vehicle Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/30 p-2.5 text-xs text-muted-foreground border border-border/30">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Clock className="size-3.5 text-warning" />
            <span>{item.departureTime}</span>
          </div>

          <div className="flex items-center gap-1 font-bold text-brand-text">
            <Car className="size-3.5" />
            <span className="text-xs capitalize">{item.vehicleType.replace("_", " ")}</span>
          </div>
        </div>

        {/* Notes snippet */}
        {item.notes ? (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.notes}</p>
        ) : null}
      </div>

      {/* Metrics & Host Trust */}
      <div className="border-t border-border/30 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-foreground">₹{item.pricePerSeat}</span>
            <span className="text-xs text-muted-foreground"> / seat</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-muted-foreground" />
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-bold",
                isFull ? "bg-danger-subtle text-danger" : "bg-success-subtle text-success"
              )}
            >
              {availableSeats > 0 ? `${availableSeats} Seats Left` : "Ride Full"}
            </span>
          </div>
        </div>

        {/* Host identity & Booking Button */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <Link
            href={`/@${item.creator.username}`}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
          >
            <Avatar className="size-6 rounded-full border border-border/50 shrink-0">
              <AvatarImage src={avatar} />
              <AvatarFallback className="text-xs font-bold">
                {item.creator.displayName[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-foreground truncate">
                  {item.creator.displayName}
                </span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopyContact}
              aria-label="Copy host contact"
            >
              <MessageCircle />
            </Button>

            <Button
              type="button"
              variant={reserved ? "secondary" : "primary"}
              onClick={handleReserveSeat}
              disabled={isFull && !reserved}
            >
              {reserved ? "Cancel seat" : isFull ? "Full" : "Book a seat"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
