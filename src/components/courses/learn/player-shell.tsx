"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CourseReviews } from "@/components/courses/course-reviews";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type CourseDetailResponse, courseAction } from "@/hooks/use-courses";
import { CurriculumSidebar } from "./curriculum-sidebar";
import { LectureOverview, ResourcesList } from "./lecture-info";
import { LectureMedia } from "./lecture-media";
import { LectureToolbar } from "./lecture-toolbar";
import { NotesPanel } from "./notes-panel";
import { PlayerHeader } from "./player-header";
import { QaPanel } from "./qa-panel";
import { ShortcutsHelp } from "./shortcuts-help";
import { usePlayerKeys } from "./use-player-keys";
import type { PlayerHandle } from "./youtube-player";

type Tab = "content" | "overview" | "notes" | "qa" | "resources" | "reviews";

export function PlayerShell({
  data,
  lectureId,
  startAt,
}: {
  data: CourseDetailResponse;
  lectureId: string;
  startAt: number;
}) {
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
  const lectureTitles = useMemo(() => Object.fromEntries(lectures.map((l) => [l.id, l.title])), [lectures]);

  const post = useCallback(
    (body: Record<string, unknown>) =>
      courseAction<{ completedIds: string[]; courseComplete: boolean }>(
        `/api/courses/${slug}/progress`,
        body
      ),
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
        if (r.courseComplete && done) toast.success("You finished the course. Your certificate is ready.");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Couldn't save your progress. Check your connection and try again."
        );
      }
    },
    [completed, post]
  );

  const go = useCallback(
    (id?: string, t?: number) => id && router.replace(`/learn/${slug}/${id}${t ? `?t=${t}` : ""}`),
    [router, slug]
  );

  async function certificate() {
    setCertBusy(true);
    try {
      const r = await courseAction<{ id: string }>(`/api/courses/${slug}/certificate`);
      router.push(`/certificates/${r.id}`);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Couldn't create your certificate. Try again in a minute."
      );
      setCertBusy(false);
    }
  }

  const keyActions = useMemo(
    () => ({
      next: () => go(next?.id),
      prev: () => go(prev?.id),
      toggleDone: () => lecture && setDone(lecture.id, !completed.has(lecture.id)),
      toggleSidebar: () => setSidebar((s) => !s),
      toggleHelp: () => setShowKeys((s) => !s),
    }),
    [go, next, prev, lecture, completed, setDone]
  );
  usePlayerKeys(playerRef, keyActions);

  useEffect(() => {
    try {
      localStorage.setItem("cl_learn_sidebar", sidebar ? "1" : "0");
    } catch {}
  }, [sidebar]);

  if (!lecture) return null;

  const tabs: { id: Tab; label: string; mobileOnly?: boolean }[] = [
    { id: "content", label: "Lectures", mobileOnly: true },
    { id: "overview", label: "Overview" },
    { id: "notes", label: "Notes" },
    { id: "qa", label: "Q&A" },
    { id: "resources", label: "Files" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <PlayerHeader
        slug={slug}
        title={course.title}
        done={completed.size}
        total={total}
        sidebar={sidebar}
        certBusy={certBusy}
        onCertificate={certificate}
        onToggleKeys={() => setShowKeys((s) => !s)}
        onToggleSidebar={() => setSidebar((s) => !s)}
      />
      {showKeys && <ShortcutsHelp />}

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
          <LectureToolbar
            hasPrev={Boolean(prev)}
            hasNext={Boolean(next)}
            done={completed.has(lecture.id)}
            rate={lecture.videoProvider === "youtube" ? rate : null}
            onPrev={() => go(prev?.id)}
            onNext={() => go(next?.id)}
            onDone={(d) => setDone(lecture.id, d)}
            onRate={(r) => {
              setRate(r);
              playerRef.current?.setRate(r);
            }}
          />

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
            className="mx-auto max-w-4xl gap-0 px-4 pb-16"
          >
            <div className="no-scrollbar sticky top-0 z-10 -mx-4 overflow-x-auto bg-bg px-4">
              <TabsList variant="line" aria-label="Lecture details" className="min-w-full">
                {tabs.map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className={t.mobileOnly ? "min-h-11 lg:hidden" : "min-h-11"}
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="pt-5">
              <TabsContent value="content" className="-mx-4 lg:hidden">
                <CurriculumSidebar
                  slug={slug}
                  sections={sections}
                  currentId={lecture.id}
                  completed={completed}
                  onToggleComplete={setDone}
                />
              </TabsContent>
              <TabsContent value="overview">
                <LectureOverview data={data} lecture={lecture} index={index} />
              </TabsContent>
              <TabsContent value="notes">
                <NotesPanel
                  slug={slug}
                  lectureId={lecture.id}
                  lectureTitles={lectureTitles}
                  currentTime={() => playerRef.current?.currentTime() ?? 0}
                  onSeek={(id, sec) => (id === lecture.id ? playerRef.current?.seek(sec) : go(id, sec))}
                />
              </TabsContent>
              <TabsContent value="qa">
                <QaPanel slug={slug} lectureId={lecture.id} />
              </TabsContent>
              <TabsContent value="resources">
                <ResourcesList lecture={lecture} course={course} />
              </TabsContent>
              <TabsContent value="reviews">
                <CourseReviews slug={slug} compact />
              </TabsContent>
            </div>
          </Tabs>
        </main>

        {sidebar && (
          <aside
            className="hidden w-[360px] shrink-0 border-l border-border lg:block"
            aria-label="Course content"
          >
            <CurriculumSidebar
              slug={slug}
              sections={sections}
              currentId={lecture.id}
              completed={completed}
              onToggleComplete={setDone}
              onClose={() => setSidebar(false)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
