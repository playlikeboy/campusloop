"use client";

import { ArrowUpRight, ChevronDown, ChevronUp, Link2, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SocialPlatformIcon } from "@/components/ui/social-icons";
import { type CustomLink, displayValueFor, PLATFORM_MAP, resolvePlatformUrl } from "@/lib/social-links";
import { cn } from "@/lib/utils";

interface SocialLinkItem {
  id: string;
  key: string;
  label: string;
  sub: string;
  href: string | null;
  color: string;
  monogram: string;
}

interface ProfileSocialLinksProps {
  links?: {
    platforms?: Record<string, string>;
    custom?: CustomLink[];
  } | null;
  isOwnProfile?: boolean;
  className?: string;
  maxVisible?: number;
}

export function ProfileSocialLinks({
  links,
  isOwnProfile = false,
  className,
  maxVisible = 6,
}: ProfileSocialLinksProps) {
  const [expanded, setExpanded] = useState(false);

  const items = useMemo<SocialLinkItem[]>(() => {
    if (!links) return [];

    const platforms: SocialLinkItem[] = Object.entries(links.platforms ?? {})
      .map(([key, raw]) => {
        const platform = PLATFORM_MAP[key];
        if (!platform || !raw?.trim()) return null;
        return {
          id: `platform-${key}`,
          key,
          label: platform.label,
          sub: displayValueFor(platform, raw),
          href: resolvePlatformUrl(platform, raw),
          color: platform.color,
          monogram: platform.monogram,
        };
      })
      .filter((v): v is SocialLinkItem => v !== null);

    const custom: SocialLinkItem[] = (links.custom ?? [])
      .filter((c) => c.label?.trim() && c.url?.trim())
      .map((c, i) => {
        const trimmedLabel = c.label.trim();
        const safeUrl = c.url.startsWith("http") ? c.url : `https://${c.url}`;
        return {
          id: `custom-${i}`,
          key: trimmedLabel.toLowerCase(),
          label: trimmedLabel,
          sub: trimmedLabel,
          href: safeUrl,
          color: "#818cf8",
          monogram: (trimmedLabel[0] ?? "L").toUpperCase(),
        };
      });

    return [...platforms, ...custom];
  }, [links]);

  if (items.length === 0) {
    if (isOwnProfile) {
      return (
        <div className={cn("pt-1", className)}>
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1 px-2.5 rounded-full border border-dashed border-border/70 hover:border-primary/50 bg-muted/20"
          >
            <Plus className="size-3" />
            <span>Connect GitHub, X, LinkedIn...</span>
          </Link>
        </div>
      );
    }
    return null;
  }

  const visibleItems = expanded ? items : items.slice(0, maxVisible);
  const hiddenCount = items.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 select-none", className)}>
      {visibleItems.map((item) => {
        const titleText = `${item.label} (${item.sub})`;

        const content = (
          <span className="relative flex items-center justify-center size-8 sm:size-8.5 rounded-full bg-secondary/80 hover:bg-secondary text-foreground border border-border/60 hover:border-border transition-all duration-200 group shadow-2xs hover:scale-105 active:scale-95">
            <SocialPlatformIcon
              platformKey={item.key}
              fallbackMonogram={item.monogram}
              className="size-3.5 sm:size-4 transition-transform group-hover:scale-110"
            />
            {item.href && (
              <span
                className="absolute -top-0.5 -right-0.5 size-2 rounded-full border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span className="sr-only">{titleText}</span>
          </span>
        );

        if (!item.href) {
          return (
            <span key={item.id} title={titleText} className="cursor-default">
              {content}
            </span>
          );
        }

        return (
          <a
            key={item.id}
            href={item.href}
            target="_blank"
            rel="me noopener noreferrer"
            title={titleText}
            aria-label={titleText}
            className="group relative cursor-pointer"
          >
            {content}
          </a>
        );
      })}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center justify-center size-8 sm:size-8.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-bold border border-border/60 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
          title={expanded ? "Show less" : `Show ${hiddenCount} more links`}
          aria-label={expanded ? "Show less links" : `Show ${hiddenCount} more links`}
        >
          {expanded ? <ChevronUp className="size-3.5" /> : `+${hiddenCount}`}
        </button>
      )}

      {isOwnProfile && (
        <Link
          href="/profile/edit"
          className="inline-flex items-center justify-center size-8 sm:size-8.5 rounded-full border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Edit or add links"
          aria-label="Edit or add social links"
        >
          <Plus className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
