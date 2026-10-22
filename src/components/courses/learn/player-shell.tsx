"use client";

import { Award, ChevronLeft, ChevronRight, Gauge, Keyboard, Loader2, PanelRightClose, PanelRightOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CourseReviews } from "@/components/courses/course-reviews";
import { courseAction, type CourseDetailResponse } from "@/hooks/use-courses";
import { cn } from "@/lib/utils";
import { CurriculumSidebar } from "./curriculum-sidebar";
import { LectureMedia } from "./lecture-media";
import { NotesPanel } from "./notes-panel";
import { QaPanel } from "./qa-panel";
import type { PlayerHandle } from "./youtube-player";
import { LectureOverview, ResourcesList } from "./lecture-info";

type Tab = "content" | "overview" | "notes" | "qa" | "resources" | "reviews";
const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function PlayerShell({ data, lectureId, startAt }: { data: CourseDetailResponse; lectureId: string; startAt: number }) {
  const router = useRouter();
  const { course, sections, lectures, viewer } = data;
  const slug = course.slug;
  const index = lectures.findIndex((l) => l.id === lectureId);
  const lecture = lectures[index];
  const prev = lectures[index - 1];
  const next = lectures[index + 1];

  const [completed, setCompleted] = useState<Set<string>>(() => new Set(viewer.completedIds));
  const [sidebar, setSidebar] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [rate, setRate] = useState(1);
  const [certBusy, setCertBusy] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const playerRef = useRef<PlayerHandle | null>(null);
  const lastSaved = useRef(0);
  const isMobile = useRef(false);

  useEffect(() => {
    isMobile.current = window.matchMedia("(max-width: 1023px)").matches;
    if (isMobile.current) setTab("content");
    try {
      setSidebar(localStorage.getItem("cl_learn_sidebar") !== "0");
    } catch {}
  }, []);

  useEffect(() => {
    lastSaved.current = 0;
  }, [lectureId]);

  const total = lectures.length;
  const progress = total ? Math.round((completed.size / total) * 100) : 0;
  const lectureTitles = useMemo(() => Object.fromEntries(lectures.map((l) => [l.id, l.title])), [lectures]);

  const post = useCallback(
    (body: Record<string, unknown>) => courseAction<{ completedIds: string[]; courseComplete: boolean }>(`/api/courses/${slug}/progress`, body),
    [slug]
  );

  const saveProgress = useCallback(
    (sec: number) => {
      if (Math.abs(sec - lastSaved.current) < 10) return;
      lastSaved.current = sec;
      post({ lectureId, positionSec: sec }).catch(() => {});
    },
    [lectureId, post]
  );

  const setDone = useCallback(
    async (id: string, done: boolean) => {
      if (completed.has(id) === done) return;
      setCompleted((s) => {
        const n = new Set(s);
        if (done) n.add(id);
        else n.delete(id);
        return n;
      });
      try {
        const r = await post({ lectureId: id, completed: done });
        setCompleted(new Set(r.completedIds));
        if (r.courseComplete && done) toast.success("Course complete! Your certificate is ready.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not save progress");
      }
    },
    [completed, post]
  );

  const go = useCallback((id?: string, t?: number) => id && router.replace(`/learn/${slug}/${id}${t ? `?t=${t}` : ""}`), [router, slug]);

  async function certificate() {
    setCertBusy(true);
    try {
      const r = await courseAction<{ id: string }>(`/api/courses/${slug}/certificate`);
      router.push(`/certificates/${r.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not issue certificate");
      setCertBusy(false);
    }
  }

  // Keyboard shortcuts (ignored while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable=true]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const p = playerRef.current;
      if (e.key === " " && p) {
        e.preventDefault();
        p.togglePlay();
      } else if (e.key === "ArrowRight" && p) p.seek(p.currentTime() + 5);
      else if (e.key === "ArrowLeft" && p) p.seek(p.currentTime() - 5);
      else if (e.key === "n") go(next?.id);
      else if (e.key === "p") go(prev?.id);
      else if (e.key === "m" && lecture) setDone(lecture.id, !completed.has(lecture.id));
      else if (e.key === "[") setSidebar((s) => !s);
      else if (e.key === "?") setShowKeys((s) => !s);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, next, prev, lecture, completed, setDone]);

  useEffect(() => {
    try {
      localStorage.setItem("cl_learn_sidebar", sidebar ? "1" : "0");
    } catch {}
  }, [sidebar]);

  if (!lecture) return null;

  const tabs: { id: Tab; label: string; mobileOnly?: boolean }[] = [
    { id: "content", label: "Content", mobileOnly: true },
    { id: "overview", label: "Overview" },
    { id: "notes", label: "Notes" },
    { id: "qa", label: "Q&A" },
    { id: "resources", label: "Resources" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground selection:bg-primary/20">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 px-3 sm:px-4">
        <Link href={`/courses/${slug}`} className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-muted" aria-label="Back to course page">
          <ChevronLeft className="size-5" />
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">{course.title}</p>
        <div className="hidden items-center gap-2 sm:flex" title={`${completed.size} of ${total} lectures complete`}>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">{progress}%</span>
        </div>
        {progress === 100 && (
          <button type="button" onClick={certificate} disabled={certBusy} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-sm font-bold text-primary-foreground hover:opacity-90 cursor-pointer">
            {certBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Award className="size-4" aria-hidden />}
            <span className="hidden sm:inline">Get certificate</span>
          </button>
        )}
        <button type="button" onClick={() => setShowKeys((s) => !s)} aria-label="Keyboard shortcuts" className="hidden size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted lg:flex cursor-pointer">
          <Keyboard className="size-4" />
        </button>
        <button type="button" onClick={() => setSidebar((s) => !s)} aria-label={sidebar ? "Hide course content" : "Show course content"} className="hidden size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted lg:flex cursor-pointer">
          {sidebar ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
        </button>
      </header>

      {showKeys && (
        <div className="border-b border-border/60 bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          Space play/pause · ← → 5s · N next · P previous · M mark complete · [ toggle content · ? shortcuts
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto">
          <LectureMedia
            key={lecture.id}
            lecture={lecture}
            startAt={startAt || viewer.positions[lecture.id] || 0}
            playerRef={playerRef}
            nextTitle={next?.title}
            onProgress={saveProgress}
            onComplete={() => setDone(lecture.id, true)}
            onNext={() => go(next?.id)}
          />

          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-2">
            <button type="button" onClick={() => go(prev?.id)} disabled={!prev} className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium hover:bg-muted disabled:opacity-40 cursor-pointer">
              <ChevronLeft className="size-4" aria-hidden /> Previous
            </button>
            <label className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium hover:bg-muted cursor-pointer">
              <input type="checkbox" checked={completed.has(lecture.id)} onChange={(e) => setDone(lecture.id, e.target.checked)} className="size-4 accent-[var(--primary)]" />
              Completed
            </label>
            {lecture.videoProvider === "youtube" && (
              <label className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:bg-muted">
                <Gauge className="size-4" aria-hidden />
                <span className="sr-only">Playback speed</span>
                <select
                  value={rate}
                  onChange={(e) => {
                    const r = Number(e.target.value);
                    setRate(r);
                    playerRef.current?.setRate(r);
                  }}
                  className="bg-transparent text-sm font-medium text-foreground focus-visible:outline-none cursor-pointer"
                >
                  {RATES.map((r) => <option key={r} value={r}>{r}x</option>)}
                </select>
              </label>
            )}
            <button type="button" onClick={() => go(next?.id)} disabled={!next} className="ml-auto inline-flex h-9 items-center gap-1 rounded-full bg-muted/70 px-4 text-sm font-semibold hover:bg-muted disabled:opacity-40 cursor-pointer">
              Next <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>

          <div className="mx-auto max-w-4xl px-4 pb-16">
            <div className="sticky top-0 z-10 -mx-4 flex gap-1 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur no-scrollbar" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors cursor-pointer",
                    t.mobileOnly && "lg:hidden",
                    tab === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="pt-4" role="tabpanel">
              {tab === "content" && (
                <div className="-mx-4 lg:hidden">
                  <CurriculumSidebar slug={slug} sections={sections} currentId={lecture.id} completed={completed} onToggleComplete={setDone} />
                </div>
              )}
              {tab === "overview" && <LectureOverview data={data} lecture={lecture} index={index} />}
              {tab === "notes" && (
                <NotesPanel
                  slug={slug}
                  lectureId={lecture.id}
                  lectureTitles={lectureTitles}
                  currentTime={() => playerRef.current?.currentTime() ?? 0}
                  onSeek={(id, sec) => (id === lecture.id ? playerRef.current?.seek(sec) : go(id, sec))}
                />
              )}
              {tab === "qa" && <QaPanel slug={slug} lectureId={lecture.id} />}
              {tab === "resources" && <ResourcesList lecture={lecture} course={course} />}
              {tab === "reviews" && <CourseReviews slug={slug} compact />}
            </div>
          </div>
        </main>

        {sidebar && (
          <aside className="hidden w-[360px] shrink-0 border-l border-border/60 lg:block" aria-label="Course content">
            <CurriculumSidebar slug={slug} sections={sections} currentId={lecture.id} completed={completed} onToggleComplete={setDone} onClose={() => setSidebar(false)} />
          </aside>
        )}
      </div>
    </div>
  );
}
