"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { courseAction } from "@/hooks/use-courses";
import { parseVideoUrl, videoThumbnail } from "@/lib/courses/format";
import type { ImportedPlaylistResult } from "@/lib/courses/playlist-importer";
import { type CourseInput, validateCourse } from "@/lib/courses/validate";
import { BasicsSection, builderCard as card } from "./basics-section";
import { CurriculumEditor, type EditableSection, key } from "./curriculum-editor";
import { ListInput } from "./list-input";
import { PlaylistImporterCard } from "./playlist-importer-card";
import { PublishPanel } from "./publish-panel";

const DRAFT_KEY = "cl_course_builder_draft";

type State = Omit<CourseInput, "sections"> & { sections: EditableSection[] };

const blank = (): State => ({
  title: "",
  subtitle: "",
  description: "",
  category: "Programming",
  level: "BEGINNER",
  thumbnailUrl: "",
  instructorName: "",
  outcomes: [],
  requirements: [],
  tags: [],
  sections: [
    {
      key: key(),
      title: "Introduction",
      lectures: [{ key: key(), title: "", kind: "VIDEO", videoUrl: "", durationMin: 0, attachments: [] }],
    },
  ],
});

export function CourseBuilder({ initial, slug }: { initial?: CourseInput; slug?: string }) {
  const router = useRouter();
  const [s, setS] = useState<State>(() =>
    initial
      ? {
          ...initial,
          sections: initial.sections.map((x) => ({
            ...x,
            key: key(),
            lectures: x.lectures.map((l) => ({ ...l, key: key() })),
          })),
        }
      : blank()
  );
  const [busy, setBusy] = useState<"draft" | "publish" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editing = Boolean(slug);

  // New courses survive a refresh: the draft is kept on this device until saved.
  useEffect(() => {
    if (editing) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setS(JSON.parse(saved));
    } catch {}
  }, [editing]);
  useEffect(() => {
    if (editing) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(s));
    } catch {}
  }, [s, editing]);

  const check = useMemo(() => validateCourse(s, "PUBLISHED"), [s]);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const firstVideo = s.sections
    .flatMap((x) => x.lectures)
    .map((l) => parseVideoUrl(l.videoUrl ?? ""))
    .find(Boolean);
  const preview = s.thumbnailUrl || (firstVideo ? videoThumbnail(firstVideo.provider, firstVideo.ref) : null);

  async function save(status: "DRAFT" | "PUBLISHED") {
    setBusy(status === "DRAFT" ? "draft" : "publish");
    const payload = { ...s, thumbnailUrl: s.thumbnailUrl || preview || "", status };
    try {
      const r = editing
        ? await courseAction<{ slug: string }>(`/api/courses/${slug}`, payload, "PATCH")
        : await courseAction<{ slug: string }>("/api/courses", payload);
      if (!editing) localStorage.removeItem(DRAFT_KEY);
      if (status === "PUBLISHED" && !editing) {
        toast.success("Course published", {
          description: "Students at your college see it first. It joins the catalog once people take it.",
        });
        router.push(`/courses/${r.slug}`);
      } else if (status === "DRAFT" && !editing) {
        toast.success("Draft saved");
        router.push(`/courses/${r.slug}/edit`);
      } else {
        toast.success(status === "PUBLISHED" ? "Course published" : "Draft saved");
        router.push(`/courses/${r.slug}`);
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Couldn't save your course. Check your connection and try again."
      );
      setBusy(null);
    }
  }

  async function remove() {
    if (!slug) return;
    setBusy("delete");
    try {
      await courseAction(`/api/courses/${slug}`, undefined, "DELETE");
      toast.success("Course deleted");
      router.push("/courses");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete the course. Try again.");
      setBusy(null);
      setConfirmDelete(false);
    }
  }

  function handleImportedCourse(imported: ImportedPlaylistResult) {
    setS((prev) => ({
      ...prev,
      title: imported.title || prev.title,
      subtitle: imported.subtitle || prev.subtitle,
      description: imported.description || prev.description,
      category: imported.category || prev.category,
      level: imported.level || prev.level,
      thumbnailUrl: imported.thumbnailUrl || prev.thumbnailUrl,
      instructorName: imported.instructorName || prev.instructorName,
      outcomes: imported.outcomes.length ? imported.outcomes : prev.outcomes,
      requirements: imported.requirements.length ? imported.requirements : prev.requirements,
      tags: imported.tags.length ? imported.tags : prev.tags,
      sections: imported.sections.map((sec) => ({
        key: key(),
        title: sec.title,
        lectures: sec.lectures.map((lec) => ({
          key: key(),
          title: lec.title,
          kind: lec.kind,
          videoUrl: lec.videoUrl,
          durationMin: lec.durationMin || 0,
          body: lec.body || "",
          isPreview: Boolean(lec.isPreview),
          attachments: lec.attachments || [],
        })),
      })),
    }));
  }

  return (
    <div className="px-4 pb-20 sm:px-0">
      <h1 className="text-3xl text-fg">{editing ? "Edit course" : "Make a course"}</h1>
      <p className="mt-1 text-fg-muted">Add your videos, notes and links, sorted into sections.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <PlaylistImporterCard onImport={handleImportedCourse} disabled={busy !== null} />

          <BasicsSection value={s} set={(k, v) => set(k, v as unknown as State[typeof k])} />

          <section className={card} aria-labelledby="learners">
            <h2 id="learners" className="text-lg text-fg">
              For learners
            </h2>
            <ListInput
              label="What you'll learn"
              hint="Shown as a checklist on the course page."
              items={s.outcomes ?? []}
              onChange={(v) => set("outcomes", v)}
              placeholder="e.g. Solve sliding window problems"
              max={12}
            />
            <ListInput
              label="What you need first"
              items={s.requirements ?? []}
              onChange={(v) => set("requirements", v)}
              placeholder="e.g. Basic C++ or Python"
              max={10}
            />
            <ListInput
              label="Tags"
              items={s.tags ?? []}
              onChange={(v) => set("tags", v)}
              placeholder="e.g. dsa"
              max={10}
              chip
            />
          </section>

          <section aria-labelledby="curriculum">
            <h2 id="curriculum" className="mb-3 text-lg text-fg">
              Lectures
            </h2>
            <CurriculumEditor sections={s.sections} onChange={(v) => set("sections", v)} />
          </section>
        </div>

        <aside aria-label="Publish">
          <PublishPanel
            title={s.title}
            subtitle={s.subtitle}
            level={s.level}
            lectures={s.sections.reduce((a, x) => a + x.lectures.length, 0)}
            preview={preview}
            checklist={check.checklist}
            nextStep={
              !check.ok
                ? (check.errors.find((e) => !e.startsWith("To publish")) ?? check.errors[0])
                : undefined
            }
            canPublish={check.ok}
            canSaveDraft={Boolean(s.title.trim())}
            busy={busy}
            editing={editing}
            onPublish={() => save("PUBLISHED")}
            onSaveDraft={() => save("DRAFT")}
            onDelete={() => setConfirmDelete(true)}
          />
        </aside>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete this course?"
        description="It's removed for everyone and learners lose their progress. You can't undo this."
        confirmText="Delete course"
        isLoading={busy === "delete"}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
