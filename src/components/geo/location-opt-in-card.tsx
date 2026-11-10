"use client";

import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeoLocation } from "@/hooks/use-geo-location";
import { cn } from "@/lib/utils";

/**
 * Inline opt-in for precise location. Renders nothing once granted (the hook
 * keeps it fresh silently), when denied, unsupported, or dismissed.
 */
export function LocationOptInCard({
  enabled = true,
  title = "See people and colleges near you",
  description = "Others only see a rough distance, never where you are.",
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
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-lg border border-border bg-surface p-4",
        className
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-surface-muted text-fg-muted">
        <MapPin className="size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 pr-8">
        <p className="font-semibold text-fg">{title}</p>
        <p className="mt-0.5 text-sm text-fg-muted">{description}</p>
        {error && (
          <p className="mt-1.5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <Button size="sm" className="mt-3" onClick={() => void enable()} loading={busy}>
          {!busy && <MapPin />}
          {busy ? "Getting location" : "Use my location"}
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={dismiss}
        aria-label="Not now"
        className="absolute top-2 right-2"
      >
        <X />
      </Button>
    </div>
  );
}
