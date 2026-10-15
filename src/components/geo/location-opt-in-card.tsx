"use client";

import { Loader2, MapPin, X } from "lucide-react";
import { useGeoLocation } from "@/hooks/use-geo-location";
import { cn } from "@/lib/utils";

/**
 * Inline opt-in for precise location. Renders nothing once granted (the hook
 * keeps it fresh silently), when denied, unsupported, or dismissed.
 */
export function LocationOptInCard({
  enabled = true,
  title = "See students and campuses near you",
  description = "Turn on location for nearby matches, campuses and people. Others only see a rough distance, never where you are.",
  className,
}: {
  enabled?: boolean;
  title?: string;
  description?: string;
  className?: string;
}) {
  const { permission, busy, error, dismissed, enable, dismiss } = useGeoLocation(enabled);

  if (!enabled || dismissed || permission !== "prompt") return null;

  return (
    <div className={cn("relative flex items-start gap-3 rounded-2xl bg-card/60 p-4 shadow-2xs", className)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <MapPin className="size-4.5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 pr-6">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        {error && (
          <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void enable()}
          disabled={busy}
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}
          {busy ? "Getting location..." : "Use my location"}
        </button>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
