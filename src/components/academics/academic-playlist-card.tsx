"use client";

import { Eye, FolderPlus, Layers, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
}

const CATEGORY_LABELS: Record<string, string> = {
  SEMESTER_PACK: "Semester Pack",
  EXAM_PREP: "Exam Cram Stack",
  SUBJECT_BUNDLE: "Subject Bundle",
  GATE: "GATE & Placements",
  CUSTOM: "Curated Stack",
};

export function AcademicPlaylistCard({ playlist, onStarToggle, className }: AcademicPlaylistCardProps) {
  const router = useRouter();
  const [stars, setStars] = useState(playlist.starsCount);
  const [isStarred, setIsStarred] = useState(false);
  const [isStarring, setIsStarring] = useState(false);

  async function handleStar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isStarring) return;
    sounds.tap();
    haptics.light();
    setIsStarring(true);

    const prevStarred = isStarred;
    const prevCount = stars;
    setIsStarred(!prevStarred);
    setStars((s) => (prevStarred ? Math.max(0, s - 1) : s + 1));

    try {
      const res = await fetch(`/api/academics/playlists/${playlist.id}/star`, {
        method: "POST",
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to save study playlists");
        } else {
          toast.error("Failed to update star");
        }
        setIsStarred(prevStarred);
        setStars(prevCount);
        return;
      }
      const data = (await res.json()) as any;
      setIsStarred(data.isStarred);
      setStars(data.starsCount);
      if (data.isStarred) {
        toast.success("Saved to your study stacks! ⭐️");
      }
      if (onStarToggle) onStarToggle(playlist.id, data.isStarred);
    } catch {
      setIsStarred(prevStarred);
      setStars(prevCount);
    } finally {
      setIsStarring(false);
    }
  }

  const categoryLabel = CATEGORY_LABELS[playlist.category] || "Study Playlist";
  const gradient = playlist.coverGradient || "from-neutral-900 via-neutral-800 to-neutral-900";

  return (
    <Link
      href={`/app/academics/playlists/${playlist.slug || playlist.id}`}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-md",
        className
      )}
    >
      {/* Small visual accent instead of a giant gradient hero */}
      <div className={cn("h-2 w-full bg-linear-to-r", gradient)} />

      <div className="p-4 sm:p-4.5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 uppercase tracking-wide">
                <Layers className="size-3" />
                {categoryLabel}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="truncate">{playlist.branch}</span>
              {playlist.semester && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span>Sem {playlist.semester}</span>
                </>
              )}
            </div>

            <h3 className="mt-2 text-base font-extrabold leading-snug tracking-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {playlist.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleStar}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer active:scale-95",
              isStarred
                ? "bg-amber-400 text-amber-950 border-amber-400"
                : "bg-background text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted"
            )}
            title={isStarred ? "Remove from saved" : "Save playlist"}
            aria-label={isStarred ? "Remove from saved" : "Save playlist"}
          >
            <Star className={cn("size-4", isStarred && "fill-current")} />
          </button>
        </div>

        {playlist.description && (
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {playlist.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-3 text-[11px]">
          <div className="flex min-w-0 items-center gap-2">
            {playlist.creator.avatarUrl ? (
              <img
                src={playlist.creator.avatarUrl}
                alt=""
                className="size-6 rounded-full object-cover border border-border/50 shrink-0"
              />
            ) : (
              <div className="size-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                {playlist.creator.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold text-foreground truncate max-w-[120px]">
              @{playlist.creator.username}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <FolderPlus className="size-3" />
              {playlist.itemsCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3" />
              {playlist.viewsCount}
            </span>
            <span className="inline-flex items-center gap-1 text-amber-500">
              <Star className="size-3" />
              {stars}
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1 text-xs font-bold text-primary">
          Open playlist <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}
