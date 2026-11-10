"use client";

import { Eye, FileText, Layers, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { playlistCoverClass } from "@/components/academics/playlist-cover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  GATE: "GATE and placements",
  CUSTOM: "Playlist",
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
  const isCompact = variant === "compact";
  const href = `/academics/study-material/playlists/${playlist.slug || playlist.id}`;
  const branchLabel = !playlist.branch || playlist.branch === "All" ? "All branches" : playlist.branch;
  const creatorName = playlist.creator?.displayName || playlist.creator?.username || "A student";

  async function handleStar() {
    if (isStarring) return;
    sounds.tap();
    haptics.light();
    setIsStarring(true);

    const wasStarred = isStarred;
    const prevCount = stars;
    setIsStarred(!wasStarred);
    setStars((c) => (wasStarred ? Math.max(0, c - 1) : c + 1));

    try {
      const res = await fetch(`/api/academics/playlists/${playlist.id}/star`, { method: "POST" });
      if (!res.ok) {
        toast.error(
          res.status === 401 ? "Sign in to save playlists." : "Couldn't save this playlist. Try again."
        );
        setIsStarred(wasStarred);
        setStars(prevCount);
        return;
      }
      const result = (await res.json()) as { isStarred: boolean; starsCount: number };
      setIsStarred(result.isStarred);
      setStars(result.starsCount);
      if (result.isStarred) toast.success("Playlist saved");
      onStarToggle?.(playlist.id, result.isStarred);
    } catch {
      setIsStarred(wasStarred);
      setStars(prevCount);
      toast.error("You're offline. Check your internet and try again.");
    } finally {
      setIsStarring(false);
    }
  }

  return (
    <article
      className={cn(
        "relative flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-ui hover:border-border-strong",
        isCompact && "w-[min(80vw,260px)] shrink-0 snap-start",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-sm",
            playlistCoverClass(playlist.coverGradient)
          )}
          aria-hidden="true"
        >
          <Layers className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base leading-snug font-bold text-fg">
            {/* Stretched link: the whole card opens the playlist; the star stays its own control. */}
            <Link
              href={href}
              onClick={() => sounds.tap()}
              className="outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring"
            >
              {playlist.title}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-xs text-fg-muted">
            {CATEGORY_LABELS[playlist.category] || "Playlist"} · {branchLabel}
            {playlist.semester ? ` · Sem ${playlist.semester}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={handleStar}
          disabled={isStarring}
          aria-pressed={isStarred}
          aria-label={isStarred ? `Unsave ${playlist.title}` : `Save ${playlist.title}`}
          className={cn(
            "relative z-10 -mt-1 -mr-1 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-ui",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60",
            isStarred ? "text-brand-text" : "text-fg-muted hover:bg-surface-muted hover:text-fg"
          )}
        >
          <Star className={cn("size-5", isStarred && "fill-current")} aria-hidden="true" />
        </button>
      </div>

      {!isCompact && playlist.description && (
        <p className="line-clamp-2 text-sm text-fg-muted">{playlist.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 text-xs text-fg-muted">
        <span className="flex min-w-0 items-center gap-2">
          <Avatar size="sm">
            {playlist.creator?.avatarUrl && <AvatarImage src={playlist.creator.avatarUrl} alt="" />}
            <AvatarFallback className="bg-brand-subtle text-brand-text">
              {creatorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">
            {playlist.creator?.username ? `@${playlist.creator.username}` : creatorName}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3 tabular-nums">
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3.5" aria-hidden="true" />
            {playlist.itemsCount}
            <span className="sr-only"> files</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden="true" />
            {playlist.viewsCount}
            <span className="sr-only"> views</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5" aria-hidden="true" />
            {stars}
            <span className="sr-only"> saves</span>
          </span>
        </span>
      </div>
    </article>
  );
}
