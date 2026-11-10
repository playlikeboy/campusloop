"use client";

import { Clock, MapPin, Phone, QrCode, Share2, Star, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

interface StoreHeaderProps {
  store: any;
  reviewCount: number;
  /** Average from real reviews. The stored merchant rating is a default, so it is never shown on its own. */
  averageRating?: string;
  onShare: () => void;
  onShowQr: () => void;
}

/** Cover, logo, name, one meta line and the store actions. */
export function StoreHeader({ store, reviewCount, averageRating, onShare, onShowQr }: StoreHeaderProps) {
  return (
    <header className="space-y-3">
      <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg bg-surface-muted">
        {store.coverUrl && <img src={store.coverUrl} alt="" className="size-full object-cover" />}
      </div>
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="-mt-12 size-20 shrink-0 overflow-hidden rounded-full border-4 border-bg bg-surface-muted">
          {store.logoUrl && <img src={store.logoUrl} alt="" className="size-full object-cover" />}
        </div>
        <div className="flex items-center gap-1">
          {store.phone && (
            <a href={`tel:${store.phone}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Phone className="size-4" />
              Call
            </a>
          )}
          <Button variant="ghost" size="icon" onClick={onShare} aria-label="Share store">
            <Share2 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onShowQr} aria-label="Show store QR code">
            <QrCode className="size-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1.5 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl text-fg">{store.name}</h1>
          <Badge variant={store.isOpen ? "success" : "neutral"}>{store.isOpen ? "Open now" : "Closed"}</Badge>
        </div>
        {store.description && <p className="max-w-prose text-sm text-fg-muted">{store.description}</p>}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
          {store.address && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {store.address}
            </span>
          )}
          {reviewCount > 0 && averageRating && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Star className="size-4" aria-hidden="true" />
              {averageRating} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
            </span>
          )}
          {store.estimatedPrepTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" aria-hidden="true" />
              {store.estimatedPrepTime}
            </span>
          )}
          {store.isDeliveryEnabled !== false && store.deliveryFee != null && (
            <span className="inline-flex items-center gap-1">
              <Truck className="size-4" aria-hidden="true" />
              {Number(store.deliveryFee) === 0 ? "Free delivery" : `₹${store.deliveryFee} delivery`}
            </span>
          )}
        </p>
      </div>
    </header>
  );
}
