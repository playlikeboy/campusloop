"use client";

import { ArrowLeft, Check, ExternalLink, FileText, Play } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { AcademicModule } from "@/db/schema/academic-resources";
import { flattenModules } from "@/lib/academics/modules";
import { getYoutubeEmbedInfo, isYoutubeUrl } from "@/lib/academics/youtube";
import { haptics } from "@/lib/haptics";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface AcademicWatchClientProps {
  resourceId: string;
  title: string;
  subjectCode: string;
  modules: AcademicModule[];
}

function getWatchedStorageKey(resourceId: string): string {
  return `campusloop_academic_watched_${resourceId}`;
}

function readWatched(resourceId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(getWatchedStorageKey(resourceId));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function AcademicWatchClient({ resourceId, title, subjectCode, modules }: AcademicWatchClientProps) {
  const searchParams = useSearchParams();
  const flat = useMemo(() => flattenModules(modules), [modules]);
  const firstVideo = flat.find((f) => isYoutubeUrl(f.attachment.url));

  const requestedId = searchParams.get("a");
  const initial =
    (requestedId && flat.find((f) => f.attachment.id === requestedId)) || firstVideo || flat[0] || null;

  const [activeId, setActiveId] = useState<string | null>(initial?.attachment.id || null);
  const [watched, setWatched] = useState<Set<string>>(() => readWatched(resourceId));

  const active = flat.find((f) => f.attachment.id === activeId) || null;
  const isActiveVideo = active ? isYoutubeUrl(active.attachment.url) : false;
  const ytInfo = useMemo(() => getYoutubeEmbedInfo(active?.attachment.url || ""), [active]);

  useEffect(() => {
    if (!activeId) return;
    setWatched((prev) => {
      if (prev.has(activeId)) return prev;
      const next = new Set(prev);
      next.add(activeId);
      try {
        window.localStorage.setItem(getWatchedStorageKey(resourceId), JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, [activeId, resourceId]);

  const completedCount = flat.filter((f) => watched.has(f.attachment.id)).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/40 bg-card/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/academics/study-material/${resourceId}`}
              onClick={() => sounds.tap()}
              className="flex size-8 items-center justify-center rounded-full border border-border/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider">{subjectCode}</p>
              <h1 className="text-sm font-black text-foreground truncate">{title}</h1>
            </div>
          </div>
          <span className="text-[11px] font-bold text-muted-foreground shrink-0 tabular-nums">
            {completedCount}/{flat.length} viewed
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main stage: player + notes */}
        <div className="lg:col-span-8 space-y-4">
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-border/40">
            {isActiveVideo && ytInfo.embedUrl ? (
              <iframe
                key={ytInfo.embedUrl}
                src={ytInfo.embedUrl}
                title={active?.attachment.title || title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-6 text-white/80">
                <FileText className="size-8" />
                <p className="text-sm font-semibold">This item isn't a video.</p>
                {active && (
                  <a
                    href={active.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-xs font-bold"
                  >
                    <span>Open file</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-2">
            <h2 className="text-sm font-black text-foreground">{active?.attachment.title || title}</h2>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
              {active?.moduleTitle}
            </p>
            {active?.attachment.description ? (
              <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line pt-1 border-t border-border/20">
                {active.attachment.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground pt-1 border-t border-border/20">
                No notes added for this lecture yet.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar: course content / curriculum */}
        <aside className="lg:col-span-4 rounded-2xl border border-border/40 bg-card/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30">
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Course Content</h3>
            <p className="text-[11px] text-muted-foreground">
              {modules.length} {modules.length === 1 ? "module" : "modules"} · {flat.length} items
            </p>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {modules.map((mod, mIdx) => (
              <div key={mod.id} className="border-b border-border/20 last:border-b-0">
                <div className="px-4 py-2 bg-muted/20 text-[11px] font-black text-foreground uppercase tracking-wider">
                  {mod.title?.trim() || `Module ${mIdx + 1}`}
                </div>
                {mod.attachments.map((att) => {
                  const isVideo = isYoutubeUrl(att.url);
                  const isActive = att.id === activeId;
                  const isWatched = watched.has(att.id);
                  return (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => {
                        sounds.tap();
                        haptics.light();
                        setActiveId(att.id);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors cursor-pointer",
                        isActive ? "bg-primary/10" : "hover:bg-muted/40"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full border shrink-0",
                          isWatched
                            ? "bg-success-subtle border-success/40 text-success"
                            : "border-border/50 text-muted-foreground"
                        )}
                      >
                        {isWatched ? (
                          <Check className="size-3 stroke-[3]" />
                        ) : isVideo ? (
                          <Play className="size-2.5 fill-current" />
                        ) : (
                          <FileText className="size-2.5" />
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-xs truncate flex-1",
                          isActive ? "font-bold text-primary" : "font-semibold text-foreground"
                        )}
                      >
                        {att.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
