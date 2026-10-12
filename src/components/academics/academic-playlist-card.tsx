"use client";

import { ArrowRight, ChevronDown, Eye, FolderPlus, Layers, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface AcademicPlaylistData {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category: string;
  branch: string;
  semester?: number | null;
  coverGradient?: string;
  starsCount: number;
  viewsCount: number;
  itemsCount: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  tags?: string[] | unknown;
  createdAt: string | Date;
  creator: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string | null;
    role?: string;
    isVerified?: boolean;
  };
  institution?: {
    id: string;
    name: string;
    shortName?: string | null;
  } | null;
}

interface AcademicPlaylistCardProps {
  playlist: AcademicPlaylistData;
  onStarToggle?: (playlistId: string, newState: boolean) => void;
  className?: string;
  variant?: "default" | "compact";
}

const CATEGORY_LABELS: Record<string, string> = {
  SEMESTER_PACK: "Semester pack",
  EXAM_PREP: "Exam prep",
  SUBJECT_BUNDLE: "Subject bundle",
  GATE: "GATE & placements",
  CUSTOM: "Curated stack",
};

export function AcademicPlaylistCard({
  playlist,
  onStarToggle,
  className,
  variant = "default",
}: AcademicPlaylistCardProps) {
  const [stars, setStars] = useState(playlist.starsCount);
  const [isStarred, setIsStarred] = useState(false);
  const [isStarring, setIsStarring] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const isCompact = variant === "compact";
  const playlistHref = `/academics/playlists/${playlist.slug || playlist.id}`;
  const categoryLabel = CATEGORY_LABELS[playlist.category] || "Study playlist";
  const gradient = playlist.coverGradient || "from-orange-500/80 via-rose-500/70 to-amber-400/80";
  const branchLabel = !playlist.branch || playlist.branch === "All" ? "All branches" : playlist.branch;
  const creatorLabel = playlist.creator?.displayName || playlist.creator?.username || "Campus contributor";

  async function handleStar() {
    if (isStarring) return;
    sounds.tap();
    haptics.light();
    setIsStarring(true);

    const previousStarred = isStarred;
    const previousCount = stars;
    setIsStarred(!previousStarred);
    setStars((count) => (previousStarred ? Math.max(0, count - 1) : count + 1));

    try {
      const response = await fetch(`/api/academics/playlists/${playlist.id}/star`, { method: "POST" });
      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Sign in to save study playlists");
        } else {
          toast.error("Couldn't update this playlist");
        }
        setIsStarred(previousStarred);
        setStars(previousCount);
        return;
      }

      const result = (await response.json()) as { isStarred: boolean; starsCount: number };
      setIsStarred(result.isStarred);
      setStars(result.starsCount);
      if (result.isStarred) toast.success("Saved to your study stacks");
      onStarToggle?.(playlist.id, result.isStarred);
    } catch {
      setIsStarred(previousStarred);
      setStars(previousCount);
      toast.error("Couldn't connect. Try again.");
    } finally {
      setIsStarring(false);
    }
  }

  return (
    <article
      className={cn(
        "group/playlist relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/40 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-sm",
        isCompact && "w-[min(82vw,248px)] shrink-0 snap-start",
        className
      )}
    >
      <div className={cn("h-1.5 w-full bg-linear-to-r", gradient)} />

      <div className={cn("flex flex-1 flex-col", isCompact ? "gap-3 p-3.5" : "gap-3.5 p-4")}>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {categoryLabel}
            </p>
            <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">
              {branchLabel}{playlist.semester ? ` · Sem ${playlist.semester}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={handleStar}
            disabled={isStarring}
            aria-label={isStarred ? `Remove ${playlist.title} from saved playlists` : `Save ${playlist.title}`}
            aria-pressed={isStarred}
            title={isStarred ? "Remove from saved" : "Save playlist"}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60",
              isStarred
                ? "border-amber-400/60 bg-amber-400/15 text-amber-600 dark:text-amber-300"
                : "border-border/50 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            <Star className={cn("size-4", isStarred && "fill-current")} aria-hidden="true" />
          </button>
        </div>

        <Link
          href={playlistHref}
          onClick={() => sounds.tap()}
          className="group/title rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <h3 className={cn(
            "line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-foreground transition-colors group-hover/playlist:text-primary",
            isCompact && "min-h-[2.6rem]"
          )}>
            {playlist.title}
          </h3>
        </Link>

        {playlist.description && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setShowDescription((current) => !current)}
              aria-expanded={showDescription}
              aria-controls={"playlist-description-" + playlist.id}
              className="inline-flex min-h-7 items-center gap-1 rounded-md text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {showDescription ? "Hide details" : "Details"}
              <ChevronDown
                className={cn("size-3.5 transition-transform duration-200", showDescription && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            {showDescription && (
              <p
                id={"playlist-description-" + playlist.id}
                className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line"
              >
                {playlist.description}
              </p>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/30 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            {playlist.creator?.avatarUrl ? (
              // External user-provided avatar URL: preserve current simple <img> path and fixed dimensions.
              <img
                src={playlist.creator.avatarUrl}
                alt=""
                loading="lazy"
                className="size-6 shrink-0 rounded-full border border-border/50 object-cover"
              />
            ) : (
              <div
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
                aria-hidden="true"
              >
                {creatorLabel.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate text-[11px] font-semibold text-foreground" title={creatorLabel}>
              {playlist.creator?.username ? `@${playlist.creator.username}` : creatorLabel}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-[10px] tabular-nums text-muted-foreground" aria-label="Playlist statistics">
            <span className="inline-flex items-center gap-1" title={`${playlist.itemsCount} study resources`}>
              <FolderPlus className="size-3" aria-hidden="true" />
              {playlist.itemsCount}
            </span>
            <span className="inline-flex items-center gap-1" title={`${playlist.viewsCount} views`}>
              <Eye className="size-3" aria-hidden="true" />
              {playlist.viewsCount}
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300" title={`${stars} stars`}>
              <Star className="size-3" aria-hidden="true" />
              {stars}
            </span>
          </div>
        </div>

        <Link
          href={playlistHref}
          onClick={() => sounds.tap()}
          className="inline-flex min-h-9 items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 text-xs font-bold text-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span>Open playlist</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
