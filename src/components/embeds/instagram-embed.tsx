"use client";

import { ExternalLink } from "lucide-react";
import { InstagramIcon } from "@/components/ui/social-icons";

interface InstagramEmbedProps {
  embedUrl: string;
  rawUrl?: string;
  id?: string;
}

export function InstagramEmbed({ embedUrl, rawUrl, id }: InstagramEmbedProps) {
  return (
    <div
      className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-colors hover:border-border"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-border bg-surface-muted px-3.5 py-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <InstagramIcon className="size-3.5 text-danger" />
          <span>Instagram</span>
          {id && <span className="text-xs font-mono text-muted-foreground">#{id}</span>}
        </div>
        {rawUrl && (
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>View on Instagram</span>
            <ExternalLink className="size-3 opacity-70" />
          </a>
        )}
      </div>

      <iframe
        src={embedUrl}
        width="100%"
        height="480"
        frameBorder="0"
        scrolling="no"
        allowTransparency
        loading="lazy"
        className="w-full bg-card"
      />
    </div>
  );
}
