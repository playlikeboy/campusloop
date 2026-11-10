"use client";

import { ExternalLink, Music2 } from "lucide-react";

interface SoundCloudEmbedProps {
  embedUrl: string;
  rawUrl?: string;
}

export function SoundCloudEmbed({ embedUrl, rawUrl }: SoundCloudEmbedProps) {
  const isPlaylist = embedUrl.includes("/sets") || (rawUrl && rawUrl.includes("/sets"));
  const height = isPlaylist ? 350 : 166;

  return (
    <div
      className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-colors hover:border-border"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-border bg-surface-muted px-3.5 py-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-fg">
          <Music2 className="size-3.5" />
          <span>SoundCloud</span>
        </div>
        {rawUrl && (
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Open in SoundCloud</span>
            <ExternalLink className="size-3 opacity-70" />
          </a>
        )}
      </div>

      <div className="w-full bg-muted/20">
        <iframe
          src={embedUrl}
          width="100%"
          height={height}
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          loading="lazy"
          className="w-full"
        />
      </div>
    </div>
  );
}
