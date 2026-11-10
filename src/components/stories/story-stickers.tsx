"use client";

import { MapPin, Music2, X } from "lucide-react";
import type * as React from "react";
import { CountdownSticker, MentionTag, Sticker } from "@/components/ui/stickers";
import { cn } from "@/lib/utils";
import type { StoryStickers } from "./story-format";

type StickerKey = keyof StoryStickers;

interface StoryStickerStackProps {
  stickers: StoryStickers;
  /** Creator mode: each sticker gets a remove button. */
  onRemove?: (key: StickerKey) => void;
  /** Viewer mode: the mention links to the profile. */
  linkMentions?: boolean;
  className?: string;
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="-my-3 -mr-3 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-sticker-fg transition-ui hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <X className="size-4" aria-hidden />
    </button>
  );
}

function Pill({
  icon,
  children,
  onRemove,
  removeLabel,
  tilt,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onRemove?: () => void;
  removeLabel: string;
  tilt: "left" | "right";
}) {
  return (
    <Sticker
      pop
      tilt={tilt}
      style={{ "--pop-from": tilt === "left" ? "-8deg" : "8deg" } as React.CSSProperties}
      className="inline-flex max-w-full items-center gap-2 px-3.5 py-2 text-sm font-semibold"
    >
      <span className="shrink-0 text-brand-text" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 truncate">{children}</span>
      {onRemove && <RemoveButton label={removeLabel} onClick={onRemove} />}
    </Sticker>
  );
}

/**
 * The stickers on a story: place, song, @mention and countdown.
 * Shared by the story creator (removable) and the story viewer (read-only).
 */
export function StoryStickerStack({ stickers, onRemove, linkMentions, className }: StoryStickerStackProps) {
  const { location, song, mention, countdown } = stickers;
  if (!location && !song && !mention && !countdown) return null;

  return (
    <div className={cn("pointer-events-auto flex w-full flex-col items-center gap-3", className)}>
      {location && (
        <Pill
          tilt="left"
          icon={<MapPin className="size-4" />}
          onRemove={onRemove ? () => onRemove("location") : undefined}
          removeLabel="Remove place"
        >
          {location}
        </Pill>
      )}

      {song && (
        <Pill
          tilt="right"
          icon={<Music2 className="size-4" />}
          onRemove={onRemove ? () => onRemove("song") : undefined}
          removeLabel="Remove song"
        >
          {song.title}
          {song.artist ? <span className="font-normal text-fg-muted"> · {song.artist}</span> : null}
        </Pill>
      )}

      {mention && (
        <Sticker pop className="inline-flex max-w-full items-center gap-1 p-1.5">
          <MentionTag username={mention} href={linkMentions ? `/@${mention}` : undefined} />
          {onRemove && (
            <span className="pr-2">
              <RemoveButton label="Remove mention" onClick={() => onRemove("mention")} />
            </span>
          )}
        </Sticker>
      )}

      {countdown && (
        <div className="relative w-full max-w-64">
          <CountdownSticker title={countdown.title} target={countdown.target} doneLabel="It's on now" />
          {onRemove && (
            <span className="absolute top-2 right-3">
              <RemoveButton label="Remove countdown" onClick={() => onRemove("countdown")} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
