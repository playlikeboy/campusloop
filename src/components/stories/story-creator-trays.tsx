"use client";

import { AlignCenter, AlignLeft, AlignRight, Check, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import {
  cleanUsername,
  STORY_ALIGNMENTS,
  STORY_BACKGROUNDS,
  STORY_FONTS,
  STORY_TEXT_SIZES,
  type StoryAlignment,
  type StoryCountdown,
  type StorySong,
} from "./story-format";

export type StoryTray = "none" | "style" | "place" | "song" | "mention" | "countdown";

/** Solid panel that slides up from the bottom of the story canvas. */
export function TrayPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      aria-label={title}
      className="relative z-30 max-h-[45dvh] space-y-4 overflow-y-auto rounded-t-xl bg-surface-raised p-4 text-fg animate-in slide-in-from-bottom duration-200"
    >
      <h2 className="pr-12 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

const ALIGN_ICONS = { center: AlignCenter, left: AlignLeft, right: AlignRight } as const;

interface StyleTrayProps {
  hasPhoto: boolean;
  bgIndex: number;
  onBg: (i: number) => void;
  fontIndex: number;
  onFont: (i: number) => void;
  sizeIndex: number;
  onSize: (i: number) => void;
  align: StoryAlignment;
  onAlign: (a: StoryAlignment) => void;
}

export function StyleTray(props: StyleTrayProps) {
  return (
    <TrayPanel title="Text style">
      {!props.hasPhoto && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-fg-muted">Colour</p>
          <div className="flex flex-wrap gap-2">
            {STORY_BACKGROUNDS.map((bg, i) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => props.onBg(i)}
                aria-label={bg.label}
                aria-pressed={props.bgIndex === i}
                className={cn(
                  "flex size-11 cursor-pointer items-center justify-center rounded-full text-white ring-offset-2 ring-offset-surface-raised transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  bg.className,
                  props.bgIndex === i ? "ring-2 ring-fg" : "ring-1 ring-border"
                )}
              >
                {props.bgIndex === i && <Check className="size-4" aria-hidden />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-fg-muted">Font</p>
        <SegmentedControl
          fullWidth
          aria-label="Font"
          value={STORY_FONTS[props.fontIndex].id}
          onChange={(id) => props.onFont(STORY_FONTS.findIndex((f) => f.id === id))}
          options={STORY_FONTS.map((f) => ({ value: f.id, label: f.label }))}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-fg-muted">Size</p>
        <SegmentedControl
          fullWidth
          aria-label="Text size"
          value={STORY_TEXT_SIZES[props.sizeIndex].id}
          onChange={(id) => props.onSize(STORY_TEXT_SIZES.findIndex((s) => s.id === id))}
          options={STORY_TEXT_SIZES.map((s) => ({ value: s.id, label: s.label }))}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-fg-muted">Align</p>
        <SegmentedControl
          fullWidth
          aria-label="Text alignment"
          value={props.align}
          onChange={props.onAlign}
          options={STORY_ALIGNMENTS.map((a) => {
            const Icon = ALIGN_ICONS[a];
            return {
              value: a,
              label: <span className="sr-only">Align {a}</span>,
              icon: <Icon className="size-4" />,
            };
          })}
        />
      </div>
    </TrayPanel>
  );
}

export function PlaceTray({
  suggestions,
  onPick,
}: {
  suggestions: string[];
  onPick: (place: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <TrayPanel title="Add a place">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onPick(value.trim().slice(0, 40));
        }}
      >
        <Label htmlFor="story-place" className="sr-only">
          Place
        </Label>
        <Input
          id="story-place"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Library, canteen, Lab 4…"
          maxLength={40}
          className="flex-1"
        />
        <Button type="submit" disabled={!value.trim()}>
          Add
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((place) => (
          <Chip key={place} icon={<MapPin className="size-3.5" />} onClick={() => onPick(place)}>
            {place}
          </Chip>
        ))}
      </div>
    </TrayPanel>
  );
}

export function SongTray({ onPick }: { onPick: (song: StorySong) => void }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  return (
    <TrayPanel title="Add a song">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) onPick({ title: title.trim().slice(0, 60), artist: artist.trim().slice(0, 40) });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="story-song">Song name</Label>
          <Input id="story-song" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="story-artist">Artist (optional)</Label>
          <Input
            id="story-artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            maxLength={40}
          />
        </div>
        <Button type="submit" className="w-full" disabled={!title.trim()}>
          Add song
        </Button>
      </form>
    </TrayPanel>
  );
}

export function MentionTray({ onPick }: { onPick: (username: string) => void }) {
  const [value, setValue] = useState("");
  const username = cleanUsername(value);
  return (
    <TrayPanel title="Mention someone">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (username.length >= 2) onPick(username);
        }}
      >
        <Label htmlFor="story-mention" className="sr-only">
          Username
        </Label>
        <Input
          id="story-mention"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="@username"
          autoCapitalize="none"
          autoCorrect="off"
          className="flex-1"
        />
        <Button type="submit" disabled={username.length < 2}>
          Add
        </Button>
      </form>
    </TrayPanel>
  );
}

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CountdownTray({ onPick }: { onPick: (countdown: StoryCountdown) => void }) {
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [openedAt] = useState(() => new Date());
  const min = toLocalInput(openedAt);
  const target = when ? new Date(when) : null;
  const inFuture = target !== null && target.getTime() > openedAt.getTime();
  const valid = Boolean(title.trim()) && inFuture;

  return (
    <TrayPanel title="Add a countdown">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && target) onPick({ title: title.trim().slice(0, 40), target: target.toISOString() });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="story-countdown-title">What's coming?</Label>
          <Input
            id="story-countdown-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Fest night, end sems…"
            maxLength={40}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="story-countdown-when">When</Label>
          <Input
            id="story-countdown-when"
            type="datetime-local"
            value={when}
            min={min}
            onChange={(e) => setWhen(e.target.value)}
          />
          {when && !inFuture && <p className="text-sm text-danger">Pick a time in the future.</p>}
        </div>
        <Button type="submit" className="w-full" disabled={!valid}>
          Add countdown
        </Button>
      </form>
    </TrayPanel>
  );
}
