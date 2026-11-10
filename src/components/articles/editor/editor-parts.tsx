"use client";

import { AlertCircle, Check, ImagePlus, Loader2 } from "lucide-react";
import { MarkdownContent } from "@/components/common/markdown-content";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategoryMeta } from "@/constants/articles";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

/** Small autosave label for the editor header. */
export function SaveStatusLabel({ status }: { status: SaveStatus }) {
  return (
    <span role="status" aria-live="polite" className="flex items-center gap-1 text-xs text-fg-muted">
      {status === "saving" && (
        <>
          <Loader2 aria-hidden className="size-3.5 animate-spin" />
          Saving
        </>
      )}
      {status === "saved" && (
        <>
          <Check aria-hidden className="size-3.5 text-verified-text" />
          Draft saved
        </>
      )}
      {status === "unsaved" && "Not saved yet"}
      {status === "error" && (
        <>
          <AlertCircle aria-hidden className="size-3.5 text-warning" />
          Saved on this device only
        </>
      )}
    </span>
  );
}

/** Cover image slot above the title: empty button, or the image with change/remove. */
export function CoverPicker({
  url,
  uploading,
  onPick,
  onRemove,
}: {
  url: string;
  uploading: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  if (!url) {
    return (
      <button
        type="button"
        onClick={onPick}
        disabled={uploading}
        className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border-strong text-sm font-medium text-fg-muted transition-ui hover:border-brand hover:text-fg disabled:opacity-60"
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {uploading ? "Uploading…" : "Add a cover image"}
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <div className="aspect-21/9 w-full overflow-hidden rounded-lg bg-surface-muted">
        <img src={url} alt="Cover" className="size-full object-cover" />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPick} loading={uploading}>
          Change cover
        </Button>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
}

/** Read-only preview that mirrors the article page layout. */
export function ArticlePreview({
  title,
  subtitle,
  content,
  coverImageUrl,
  category,
  tags,
  readingTime,
  author,
}: {
  title: string;
  subtitle: string;
  content: string;
  coverImageUrl: string;
  category: string;
  tags: string[];
  readingTime: number;
  author?: { displayName?: string | null; username?: string | null; avatarUrl?: string | null } | null;
}) {
  const name = author?.displayName || `@${author?.username || "you"}`;
  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-2">
      <p className="rounded-md bg-surface-muted px-4 py-3 text-sm text-fg-muted">
        This is how your article will look once it's published.
      </p>
      <div className="space-y-4">
        <Badge variant="neutral">{getCategoryMeta(category).label}</Badge>
        <h1 className="text-4xl leading-[1.05] text-fg text-balance sm:text-5xl">
          {title || "Untitled article"}
        </h1>
        {subtitle && <p className="text-lg text-fg-muted">{subtitle}</p>}
        <div className="flex items-center gap-3 border-y border-border py-3 text-sm">
          <Avatar className="size-9">
            <AvatarImage src={author?.avatarUrl || ""} alt="" />
            <AvatarFallback className="bg-surface-muted font-semibold text-fg">{name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-fg">{name}</p>
            <p className="text-xs text-fg-muted">{readingTime} min read</p>
          </div>
        </div>
      </div>
      {coverImageUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-surface-muted">
          <img src={coverImageUrl} alt="" className="size-full object-cover" />
        </div>
      )}
      <div className="max-w-[70ch] text-lg leading-[1.75] text-fg">
        <MarkdownContent content={content || "*Start writing to see a preview.*"} autoEmbed />
      </div>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2 border-t border-border pt-4" aria-label="Tags">
          {tags.map((t) => (
            <li key={t} className="rounded-full bg-surface-muted px-3 py-1 text-sm text-fg-muted">
              #{t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
