"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FolderPlus,
  Layers,
  Lightbulb,
  ListOrdered,
  Loader2,
  Share2,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AcademicPdfViewer } from "@/components/academics/academic-pdf-viewer";
import { playlistCoverClass } from "@/components/academics/playlist-cover";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface PlaylistItemData {
  id: string;
  sectionName: string;
  sortOrder: number;
  curatorNote?: string | null;
  resource: {
    id: string;
    title: string;
    description?: string | null;
    subjectCode: string;
    subjectName: string;
    branch: string;
    semester: number;
    resourceType: string;
    fileUrl?: string | null;
    driveUrl?: string | null;
    upvotesCount: number;
    downloadsCount: number;
    viewsCount: number;
    isVerified: boolean;
  };
}

interface PlaylistDetailData {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category: string;
  branch: string;
  semester?: number | null;
  coverGradient: string;
  starsCount: number;
  viewsCount: number;
  itemsCount: number;
  isStarred: boolean;
  isOwner: boolean;
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

export function PlaylistDetailClient({ slugOrId }: { slugOrId: string }) {
  const [playlist, setPlaylist] = useState<PlaylistDetailData | null>(null);
  const [items, setItems] = useState<PlaylistItemData[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStarring, setIsStarring] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(true);

  // Load playlist data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/academics/playlists/${encodeURIComponent(slugOrId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Playlist not found");
        return res.json();
      })
      .then((data: any) => {
        if (!isMounted) return;
        setPlaylist(data.playlist);
        setItems(data.items || []);
        setActiveIndex(0);
      })
      .catch((err) => {
        console.error("Error loading playlist:", err);
        toast.error("Couldn't load this playlist. Try again.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slugOrId]);

  // Keyboard navigation for previous/next document
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "j") {
        nextItem();
      } else if (e.key === "ArrowLeft" || e.key === "k") {
        prevItem();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function nextItem() {
    if (activeIndex < items.length - 1) {
      sounds.tap();
      haptics.light();
      setActiveIndex((i) => i + 1);
    }
  }

  function prevItem() {
    if (activeIndex > 0) {
      sounds.tap();
      haptics.light();
      setActiveIndex((i) => i - 1);
    }
  }

  async function handleStar() {
    if (!playlist || isStarring) return;
    sounds.tap();
    haptics.medium();
    setIsStarring(true);

    const prevStarred = playlist.isStarred;
    const prevCount = playlist.starsCount;

    setPlaylist((p) =>
      p
        ? {
            ...p,
            isStarred: !prevStarred,
            starsCount: prevStarred ? Math.max(0, prevCount - 1) : prevCount + 1,
          }
        : null
    );

    try {
      const res = await fetch(`/api/academics/playlists/${playlist.id}/star`, {
        method: "POST",
      });
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Sign in to save playlists.");
        } else {
          toast.error("Couldn't save this playlist. Try again.");
        }
        setPlaylist((p) => (p ? { ...p, isStarred: prevStarred, starsCount: prevCount } : null));
        return;
      }
      const data = (await res.json()) as any;
      setPlaylist((p) => (p ? { ...p, isStarred: data.isStarred, starsCount: data.starsCount } : null));
      if (data.isStarred) {
        sounds.pop();
        haptics.success();
        toast.success("Playlist saved");
      }
    } catch {
      setPlaylist((p) => (p ? { ...p, isStarred: prevStarred, starsCount: prevCount } : null));
    } finally {
      setIsStarring(false);
    }
  }

  function handleShareWhatsApp() {
    if (!playlist) return;
    sounds.tap();
    haptics.light();

    const url = window.location.href;
    const text = `Hey, check out this "${playlist.title}" study playlist on CampusLoop! Contains ${items.length} curated papers, notes & cheat sheets: ${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  function handleCopyLink() {
    sounds.tap();
    haptics.light();
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied");
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="size-8 animate-spin text-brand-text" />
        <p className="text-xs font-bold text-muted-foreground">Loading playlist…</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <Layers className="size-12 text-muted-foreground opacity-40" />
        <h2 className="text-lg font-bold text-foreground">Playlist not found</h2>
        <p className="text-xs text-muted-foreground max-w-sm">It may have been deleted or made private.</p>
        <Link
          href="/academics/study-material"
          className="px-5 py-2.5 rounded-full text-xs font-bold bg-brand text-brand-fg hover:bg-brand-hover shadow-xs cursor-pointer transition-colors"
        >
          Go to study material
        </Link>
      </div>
    );
  }

  const currentItem = items[activeIndex];

  return (
    <div className="min-h-screen pb-20 max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4">
      {/* ─── Top Navigation & Meta Banner ─── */}
      <div
        className={cn(
          "w-full rounded-xl p-4 sm:p-5 relative overflow-hidden space-y-3",
          playlistCoverClass(playlist.coverGradient)
        )}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Link
            href="/academics/study-material"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-bg/15 hover:bg-bg/25 border border-current/20 transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Study material</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStar}
              disabled={isStarring}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer active:scale-95",
                playlist.isStarred ? "bg-bg text-fg" : "bg-bg/15 hover:bg-bg/25 border border-current/20"
              )}
            >
              <Star className={cn("size-3.5", playlist.isStarred && "fill-current")} />
              <span>{playlist.isStarred ? "Saved" : "Save"}</span>
              <span className="text-xs opacity-90 tabular-nums">({playlist.starsCount})</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold bg-bg/15 hover:bg-bg/25 border border-current/20 transition-colors cursor-pointer"
              aria-label="Share on WhatsApp"
            >
              <Share2 className="size-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex size-10 items-center justify-center rounded-full bg-bg/15 hover:bg-bg/25 border border-current/20 transition-colors cursor-pointer"
              title="Copy link"
              aria-label="Copy link"
            >
              <ExternalLink className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Stack Title & Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-bg/15 text-xs font-bold border border-current/20">
              {playlist.category}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-bg/15 text-xs font-bold">{playlist.branch}</span>
            {playlist.semester && (
              <span className="px-2 py-0.5 rounded-md bg-bg/15 text-xs font-bold">
                Semester {playlist.semester}
              </span>
            )}
            {playlist.institution?.name && (
              <span className="px-2 py-0.5 rounded-md bg-bg/15 text-xs font-bold">
                {playlist.institution.shortName || playlist.institution.name.split(",")[0]}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight max-w-3xl">
            {playlist.title}
          </h1>

          {playlist.description && (
            <p className="text-xs sm:text-sm opacity-85 leading-relaxed max-w-2xl pt-0.5 line-clamp-3">
              {playlist.description}
            </p>
          )}
        </div>

        {/* Curator Pill */}
        <div className="pt-2 border-t border-current/20 flex items-center justify-between text-xs opacity-80">
          <div className="flex items-center gap-2">
            <span className="font-medium opacity-70">By</span>
            <Link
              href={`/@${playlist.creator.username}?tab=academics`}
              className="flex items-center gap-1.5 font-bold hover:underline"
            >
              {playlist.creator.avatarUrl ? (
                <img
                  src={playlist.creator.avatarUrl}
                  alt={playlist.creator.displayName}
                  className="size-4 rounded-full object-cover"
                />
              ) : (
                <span className="size-4 rounded-full bg-bg/20 text-xs flex items-center justify-center font-bold">
                  {playlist.creator.displayName.charAt(0)}
                </span>
              )}
              <span>@{playlist.creator.username}</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1">
              <FolderPlus className="size-3" />
              <span>{items.length} files</span>
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3" />
              <span>{playlist.viewsCount} views</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Study Session Workspace ─── */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Playlist Queue (4 cols on lg) */}
          <div
            className={cn(
              "lg:col-span-4 rounded-xl border border-border bg-surface p-3 space-y-2.5 transition-colors",
              !isQueueOpen && "lg:col-span-1"
            )}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <ListOrdered className="size-4 text-brand-text" />
                <h2 className="text-xs font-bold tracking-tight text-foreground">{items.length} files</h2>
                <span className="px-1.5 py-0.5 rounded-md bg-brand-subtle text-brand-text text-xs font-bold">
                  {items.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsQueueOpen(!isQueueOpen)}
                className="hidden lg:flex p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-bold cursor-pointer"
                title={isQueueOpen ? "Collapse queue" : "Expand queue"}
              >
                {isQueueOpen ? "Hide" : "Show"}
              </button>
            </div>

            <div className="space-y-1 max-h-[460px] sm:max-h-[560px] overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      sounds.tap();
                      haptics.light();
                      setActiveIndex(idx);
                    }}
                    className={cn(
                      "w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors cursor-pointer",
                      isActive
                        ? "bg-brand text-brand-fg"
                        : "border border-border/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "size-5 rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5",
                        isActive ? "bg-brand-fg text-brand-text" : "bg-surface-muted text-fg-muted"
                      )}
                    >
                      {idx + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded-md font-mono text-xs font-bold",
                            isActive ? "bg-brand-fg/20 text-brand-fg" : "bg-brand-subtle text-brand-text"
                          )}
                        >
                          {item.resource.subjectCode}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            isActive ? "text-brand-fg/80" : "text-fg-muted"
                          )}
                        >
                          {item.resource.resourceType}
                        </span>
                      </div>

                      <p
                        className={cn(
                          "text-xs font-bold truncate mt-1",
                          isActive ? "text-brand-fg" : "text-fg"
                        )}
                      >
                        {item.resource.title}
                      </p>

                      {item.curatorNote && (
                        <p
                          className={cn(
                            "text-xs line-clamp-1 mt-0.5 italic flex items-center gap-1",
                            isActive ? "text-brand-fg/80" : "text-brand-text"
                          )}
                        >
                          <Lightbulb className="size-2.5 shrink-0" />
                          <span>{item.curatorNote}</span>
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Document Stage (8 cols on lg) */}
          <div className="lg:col-span-8 space-y-3">
            {currentItem && (
              <div className="space-y-3">
                {/* Active Document Header Card */}
                <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-border bg-surface">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-brand-subtle text-brand-text font-mono text-xs font-bold">
                        {currentItem.resource.subjectCode}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">
                        {currentItem.resource.subjectName}
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-foreground truncate mt-1">
                      {currentItem.resource.title}
                    </h2>
                  </div>

                  <Link
                    href={`/academics/study-material/${currentItem.resource.id}`}
                    target="_blank"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-muted hover:bg-surface-muted text-foreground border border-border/60 transition-colors shrink-0"
                    title="Open full page"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>

                {/* PDF Viewer Canvas */}
                <AcademicPdfViewer
                  fileUrl={currentItem.resource.fileUrl}
                  driveUrl={currentItem.resource.driveUrl}
                  title={currentItem.resource.title}
                  subjectCode={currentItem.resource.subjectCode}
                  resourceType={currentItem.resource.resourceType}
                  pageUrl={`https://campusloop.space/academics/study-material/${(currentItem.resource as any).slug || currentItem.resource.id}`}
                />

                {/* Bottom Navigation Player Controls */}
                <div className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-card">
                  <button
                    type="button"
                    onClick={prevItem}
                    disabled={activeIndex <= 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border border-border/60 hover:bg-muted disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                    <span className="hidden sm:inline">Previous Material</span>
                    <span className="sm:hidden">Prev</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span className="tabular-nums">Material {activeIndex + 1}</span>
                    <span className="text-muted-foreground font-normal">of {items.length}</span>
                  </div>

                  <button
                    type="button"
                    onClick={nextItem}
                    disabled={activeIndex >= items.length - 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-brand hover:bg-brand-hover text-brand-fg disabled:opacity-30 shadow-xs transition-colors cursor-pointer"
                  >
                    <span className="hidden sm:inline">Next Material</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          bordered
          icon={FolderPlus}
          title="This playlist is empty"
          description="Add notes from any study material page."
          action={
            <Button asChild>
              <Link href="/academics/study-material">Browse study material</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
