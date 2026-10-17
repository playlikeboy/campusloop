"use client";

import { ExternalLink, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LinkPreviewEmbed } from "@/components/embeds/link-preview-embed";
import { type EmbedPlan, resolveArticleEmbed } from "@/lib/articles/article-embeds";
import type { EmbedBlock } from "@/lib/articles/smart-blocks";
import { cn } from "@/lib/utils";

// Third-party frames get the minimum they need to work.
const SANDBOX = "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms";

function Frame({ plan, height }: { plan: EmbedPlan; height?: number }) {
  const [src, setSrc] = useState(plan.needsParent ? "" : plan.src);
  useEffect(() => {
    if (plan.needsParent) setSrc(`${plan.src}&parent=${window.location.hostname}`);
  }, [plan]);
  const h = height ?? plan.height;
  if (!src) return <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />;
  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl bg-muted/40", !h && "h-0")} style={h ? { height: h } : { paddingBottom: `${100 / (plan.aspect ?? 16 / 9)}%` }}>
      <iframe
        src={src}
        title={plan.title}
        allow={plan.allow}
        allowFullScreen
        loading="lazy"
        sandbox={SANDBOX}
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}

/** Gists ship as a document.write script, so they run in an isolated srcdoc frame. */
function GistFrame({ plan, height }: { plan: EmbedPlan; height?: number }) {
  const doc = `<!doctype html><html><head><base target="_blank"><style>body{margin:0}.gist .blob-wrapper{max-height:none}</style></head><body><script src="${plan.src}"></script></body></html>`;
  return (
    <iframe
      srcDoc={doc}
      title={plan.title}
      sandbox="allow-scripts allow-popups"
      loading="lazy"
      style={{ height: height ?? plan.height }}
      className="w-full rounded-xl border-0 bg-white"
    />
  );
}

function EmbedItem({ url, start, height, compact }: { url: string; start?: number; height?: number; compact?: boolean }) {
  const plan = useMemo(() => resolveArticleEmbed(url, { start }), [url, start]);
  const [active, setActive] = useState(false);
  if (!plan) return null;

  if (plan.kind === "card") return <LinkPreviewEmbed url={url} />;
  if (plan.kind === "image") return <img src={plan.src} alt="" loading="lazy" className="w-full rounded-xl object-cover" />;
  if (plan.kind === "video") return <video src={plan.src} controls preload="metadata" className="w-full rounded-xl bg-black" />;
  if (plan.kind === "audio") return <audio src={plan.src} controls preload="metadata" className="w-full" />;
  if (plan.kind === "gist") return <GistFrame plan={plan} height={height} />;

  // Heavy video players load on click, so an article with ten videos stays fast.
  if (plan.facade && !active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className="group relative block w-full overflow-hidden rounded-xl bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
        style={{ aspectRatio: String(plan.aspect ?? 16 / 9) }}
        aria-label={`Play ${plan.title}`}
      >
        <img src={plan.facade.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className={cn("flex items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition-transform group-hover:scale-105", compact ? "size-12" : "size-16")}>
            <Play className="ml-1 size-6 fill-white" aria-hidden />
          </span>
        </span>
      </button>
    );
  }
  return <Frame plan={{ ...plan, src: plan.facade ? `${plan.src}${plan.src.includes("?") ? "&" : "?"}autoplay=1` : plan.src }} height={height} />;
}

export function EmbedBlockView({ block }: { block: EmbedBlock }) {
  const gallery = block.urls.length > 1;
  const first = resolveArticleEmbed(block.urls[0]);
  return (
    <figure className="not-prose my-6">
      <div className={cn("grid gap-3", gallery && "sm:grid-cols-2")}>
        {block.urls.map((u) => (
          <EmbedItem key={u} url={u} start={block.start} height={block.height} compact={gallery} />
        ))}
      </div>
      {(block.caption || (!gallery && first && first.kind !== "card")) && (
        <figcaption className="mt-2 flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{block.caption}</span>
          {!gallery && first && first.kind !== "card" && (
            <a href={first.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium hover:text-foreground">
              {first.provider} <ExternalLink className="size-3" aria-hidden />
            </a>
          )}
        </figcaption>
      )}
    </figure>
  );
}
