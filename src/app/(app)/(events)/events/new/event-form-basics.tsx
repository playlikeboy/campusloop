"use client";

import { ImageIcon, Shuffle, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { haptics } from "@/lib/haptics";
import { uploadImageToImgBB } from "@/lib/upload";
import { cn } from "@/lib/utils";
import {
  EVENT_TYPES,
  type FormSectionProps,
  MODES,
  PRESET_BANNERS,
  randomPatternUrl,
  VENUE_SUGGESTIONS,
} from "./event-form-options";
import { FormSection, OptionTiles } from "./form-parts";

export function BasicsSection({ form, set, isExternal }: FormSectionProps) {
  return (
    <FormSection title="Basics">
      <FormField label="Name" required>
        <Input
          required
          placeholder={isExternal ? "e.g. Smart India Hackathon" : "e.g. HackBIT: 36-hour hackathon"}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </FormField>
      <FormField label="One-line summary" hint="Shown on cards and when the link is shared.">
        <Input
          placeholder="e.g. 24 hours, free food, build anything."
          value={form.tagline}
          onChange={(e) => set("tagline", e.target.value)}
        />
      </FormField>
      <FormField label={isExternal ? "Who runs it" : "Club or society"} required>
        <Input
          required
          placeholder={isExternal ? "e.g. Google, Devfolio, Unstop" : "e.g. ACM chapter, IEEE, GDG"}
          value={form.clubName}
          onChange={(e) => set("clubName", e.target.value)}
        />
      </FormField>
      <OptionTiles
        name="eventType"
        legend="Type"
        options={EVENT_TYPES}
        value={form.eventType}
        onChange={(v) => set("eventType", v)}
        columns="grid-cols-2 sm:grid-cols-4"
      />
    </FormSection>
  );
}

export function PosterSection({ form, set }: FormSectionProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    const previous = form.bannerUrl;
    set("bannerUrl", URL.createObjectURL(file));
    setUploading(true);
    const toastId = toast.loading("Uploading poster...");
    try {
      const { displayUrl } = await uploadImageToImgBB(file, (p) => {
        if (p.percent > 0 && p.percent < 100)
          toast.loading(`Uploading poster... ${p.percent}%`, { id: toastId });
      });
      set("bannerUrl", displayUrl);
      toast.success("Poster uploaded.", { id: toastId });
    } catch (err) {
      set("bannerUrl", previous);
      toast.error(err instanceof Error ? err.message : "Poster upload failed. Try again.", { id: toastId });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <FormSection title="Poster" hint="Wide images work best (16:9).">
      <div className="relative aspect-21/9 w-full overflow-hidden rounded-md border border-border bg-surface-muted">
        {form.bannerUrl ? (
          <>
            <img
              src={form.bannerUrl}
              alt="Poster preview"
              className="h-full w-full object-cover"
              onError={() => toast.error("That image link didn't load. Check the link or upload instead.")}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => set("bannerUrl", "")}
              className="absolute right-2 bottom-2"
            >
              <X aria-hidden="true" />
              Remove
            </Button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center">
            <ImageIcon aria-hidden="true" className="size-6 text-fg-subtle" />
            <p className="text-sm text-fg-muted">Upload a poster or pick a pattern.</p>
          </div>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-fg">Patterns</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESET_BANNERS.map((preset) => (
            <button
              type="button"
              key={preset.url}
              aria-pressed={form.bannerUrl === preset.url}
              onClick={() => {
                set("bannerUrl", preset.url);
                haptics.light();
              }}
              className={cn(
                "relative aspect-video cursor-pointer overflow-hidden rounded-md border transition-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                form.bannerUrl === preset.url ? "border-brand ring-2 ring-ring" : "border-border"
              )}
            >
              <img src={preset.url} alt="" className="h-full w-full object-cover" />
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-fg">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 sm:flex-row">
        <FormField label="Image link" className="flex-1">
          <Input
            placeholder="https://..."
            value={form.bannerUrl}
            onChange={(e) => set("bannerUrl", e.target.value)}
          />
        </FormField>
        <div className="flex gap-2 sm:self-end">
          <Button type="button" variant="outline" onClick={() => set("bannerUrl", randomPatternUrl())}>
            <Shuffle aria-hidden="true" />
            New pattern
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {!uploading && <Upload aria-hidden="true" />}
            Upload
          </Button>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </FormSection>
  );
}

export function WhereSection({ form, set, isExternal }: FormSectionProps) {
  const needsVenue = form.mode === "OFFLINE" || form.mode === "HYBRID";
  const needsLink = form.mode === "ONLINE" || form.mode === "HYBRID";

  return (
    <FormSection title="Where">
      <OptionTiles
        name="mode"
        legend="Format"
        options={MODES}
        value={form.mode}
        onChange={(v) => set("mode", v)}
      />
      {needsVenue && (
        <div className="space-y-2">
          <FormField label="Venue" required={form.mode === "OFFLINE"}>
            <Input
              placeholder="e.g. Main auditorium, BIT Mesra"
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
            />
          </FormField>
          <div className="flex flex-wrap gap-2">
            {VENUE_SUGGESTIONS.map((v) => (
              <Chip key={v} selected={form.venue === v} onClick={() => set("venue", v)}>
                {v}
              </Chip>
            ))}
          </div>
        </div>
      )}
      {(needsLink || isExternal) && (
        <FormField
          label={isExternal ? "Sign-up link" : "Meeting link"}
          required={isExternal}
          hint={isExternal ? "Where students sign up on the other site." : "Shared with people who register."}
        >
          <Input
            type="url"
            required={isExternal}
            placeholder={isExternal ? "https://unstop.com/..." : "https://meet.google.com/..."}
            value={form.meetingUrl}
            onChange={(e) => set("meetingUrl", e.target.value)}
          />
        </FormField>
      )}
    </FormSection>
  );
}
