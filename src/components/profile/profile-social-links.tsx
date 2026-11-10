"use client";

import { ChevronUp, Plus } from "lucide-react";
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
          monogram: (trimmedLabel[0] ?? "L").toUpperCase(),
        };
      });

    return [...platforms, ...custom];
  }, [links]);

  if (items.length === 0) {
    if (!isOwnProfile) return null;
    return (
      <Link
        href="/profile/edit"
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-border-strong px-3 text-sm text-fg-muted transition-ui hover:border-brand hover:text-brand-text",
          className
        )}
      >
        <Plus aria-hidden="true" className="size-4" />
        Add your Instagram, GitHub or LinkedIn
      </Link>
    );
  }

  const visibleItems = expanded ? items : items.slice(0, maxVisible);
  const hiddenCount = items.length - maxVisible;
  const circle =
    "inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-fg transition-ui hover:bg-surface-muted active:scale-95";

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)} aria-label="Links">
      {visibleItems.map((item) => {
        const titleText = `${item.label}: ${item.sub}`;
        const icon = (
          <SocialPlatformIcon platformKey={item.key} fallbackMonogram={item.monogram} className="size-4" />
        );
        return (
          <li key={item.id}>
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="me noopener noreferrer"
                title={titleText}
                aria-label={titleText}
                className={cn(circle, "outline-none focus-visible:ring-2 focus-visible:ring-ring")}
              >
                {icon}
              </a>
            ) : (
              <span title={titleText} className={circle}>
                {icon}
                <span className="sr-only">{titleText}</span>
              </span>
            )}
          </li>
        );
      })}

      {hiddenCount > 0 && (
        <li>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className={cn(circle, "cursor-pointer text-xs font-semibold text-fg-muted")}
            aria-label={expanded ? "Show fewer links" : `Show ${hiddenCount} more links`}
          >
            {expanded ? <ChevronUp aria-hidden="true" className="size-4" /> : `+${hiddenCount}`}
          </button>
        </li>
      )}

      {isOwnProfile && (
        <li>
          <Link
            href="/profile/edit"
            className={cn(circle, "border-dashed border-border-strong text-fg-muted hover:text-brand-text")}
            aria-label="Edit your links"
          >
            <Plus aria-hidden="true" className="size-4" />
          </Link>
        </li>
      )}
    </ul>
  );
}
