"use client";

import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SocialPlatformIcon } from "@/components/ui/social-icons";
import {
  MAX_CUSTOM_LINKS,
  SOCIAL_LINK_CATEGORIES,
  SOCIAL_PLATFORMS,
  type SocialLinks,
} from "@/lib/social-links";
import { cn } from "@/lib/utils";

interface SocialLinksEditorProps {
  value: SocialLinks;
  onChange: (next: SocialLinks) => void;
}

export function SocialLinksEditor({ value, onChange }: SocialLinksEditorProps) {
  const filled = Object.keys(value.platforms).length + value.custom.length;

  function setPlatform(key: string, raw: string) {
    const platforms = { ...value.platforms };
    if (raw.trim()) platforms[key] = raw;
    else delete platforms[key];
    onChange({ ...value, platforms });
  }

  function setCustom(index: number, patch: Partial<{ label: string; url: string }>) {
    const custom = value.custom.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange({ ...value, custom });
  }

  function addCustom() {
    if (value.custom.length >= MAX_CUSTOM_LINKS) return;
    onChange({ ...value, custom: [...value.custom, { label: "", url: "" }] });
  }

  function removeCustom(index: number) {
    onChange({ ...value, custom: value.custom.filter((_, i) => i !== index) });
  }

  const field =
    "rounded-md border border-border bg-surface px-3 text-sm text-fg outline-none transition-ui placeholder:text-fg-subtle focus:border-brand focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <section className="space-y-5" aria-labelledby="links-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="links-title" className="text-base text-fg">
            Links
          </h3>
          <p className="text-sm text-fg-muted">Type a username or paste a link.</p>
        </div>
        {filled > 0 && <Badge variant="neutral">{filled} added</Badge>}
      </div>

      {SOCIAL_LINK_CATEGORIES.map((category) => (
        <fieldset key={category} className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-fg">{category}</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.filter((p) => p.category === category).map((platform) => {
              const id = `link-${platform.key}`;
              const current = value.platforms[platform.key] ?? "";
              return (
                <div key={platform.key} className="flex items-center gap-2" title={platform.hint}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-fg">
                    <SocialPlatformIcon
                      platformKey={platform.key}
                      fallbackMonogram={platform.monogram}
                      className="size-4"
                    />
                  </span>
                  <label htmlFor={id} className="sr-only">
                    {platform.label}
                  </label>
                  <div className="relative min-w-0 flex-1">
                    <input
                      id={id}
                      type="text"
                      value={current}
                      onChange={(e) => setPlatform(platform.key, e.target.value)}
                      placeholder={`${platform.label}: ${platform.placeholder}`}
                      maxLength={300}
                      className={cn(field, "h-11 w-full pr-10")}
                    />
                    {current && (
                      <button
                        type="button"
                        onClick={() => setPlatform(platform.key, "")}
                        className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-fg-subtle hover:text-fg"
                        aria-label={`Clear ${platform.label}`}
                      >
                        <X aria-hidden="true" className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}

      <fieldset className="space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold text-fg">
            Other links ({value.custom.length}/{MAX_CUSTOM_LINKS})
          </legend>
          {value.custom.length < MAX_CUSTOM_LINKS && (
            <Button type="button" variant="ghost" size="sm" onClick={addCustom}>
              <Plus aria-hidden="true" />
              Add link
            </Button>
          )}
        </div>
        {value.custom.map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={link.label}
              onChange={(e) => setCustom(i, { label: e.target.value })}
              placeholder="Name, e.g. Blog"
              aria-label={`Link ${i + 1} name`}
              maxLength={30}
              className={cn(field, "h-11 w-28 shrink-0")}
            />
            <input
              type="url"
              value={link.url}
              onChange={(e) => setCustom(i, { url: e.target.value })}
              placeholder="https://"
              aria-label={`Link ${i + 1} address`}
              maxLength={300}
              className={cn(field, "h-11 min-w-0 flex-1")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeCustom(i)}
              aria-label={`Remove link ${i + 1}`}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        ))}
      </fieldset>
    </section>
  );
}
