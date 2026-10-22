"use client";

import { Check, Circle, GraduationCap, Loader2, Rocket, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { courseAction } from "@/hooks/use-courses";
import { COURSE_CATEGORIES, LEVEL_LABEL, parseVideoUrl, videoThumbnail } from "@/lib/courses/format";
import { type CourseInput, validateCourse } from "@/lib/courses/validate";
import { cn } from "@/lib/utils";
import { CurriculumEditor, type EditableSection, key } from "./curriculum-editor";
import { ListInput } from "./list-input";

const DRAFT_KEY = "cl_course_builder_draft";
const field = "w-full rounded-xl bg-muted/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

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
  sections: [{ key: key(), title: "Introduction", lectures: [{ key: key(), title: "", kind: "VIDEO", videoUrl: "", durationMin: 0, attachments: [] }] }],
});

export function CourseBuilder({ initial, slug }: { initial?: CourseInput; slug?: string }) {
  const router = useRouter();
  const [s, setS] = useState<State>(() =>
    initial ? { ...initial, sections: initial.sections.map((x) => ({ ...x, key: key(), lectures: x.lectures.map((l) => ({ ...l, key: key() })) })) } : blank()
  );
  const [busy, setBusy] = useState<"draft" | "publish" | "delete" | null>(null);
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
  const firstVideo = s.sections.flatMap((x) => x.lectures).map((l) => parseVideoUrl(l.videoUrl ?? "")).find(Boolean);
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
        toast.success("Course published", { description: "It starts in campus feeds and joins the /courses catalog once learners engage." });
      } else {
        toast.success(status === "PUBLISHED" ? "Course published" : "Draft saved");
      }
      router.push(`/courses/${r.slug}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
      setBusy(null);
    }
  }

  async function remove() {
    if (!slug || !window.confirm("Delete this course for everyone? Learners lose their progress. This cannot be undone.")) return;
    setBusy("delete");
    try {
      await courseAction(`/api/courses/${slug}`, undefined, "DELETE");
      toast.success("Course deleted");
      router.push("/courses");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
      setBusy(null);
    }
  }

  return (
    <div className="px-4 pb-20 sm:px-0">
      <h1 className="text-3xl font-black tracking-tight text-foreground">{editing ? "Edit course" : "Create a course"}</h1>
      <p className="mt-1 text-muted-foreground">Organise videos, articles and links into sections. Learners get progress tracking, notes, Q&A and a certificate.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-8">
          <section className="space-y-4 rounded-2xl bg-card/60 p-5 shadow-2xs">
            <h2 className="text-lg font-bold">Basics</h2>
            <label className="block text-sm font-semibold">Title
              <input value={s.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="e.g. DSA in 8 weeks for placements" className={cn(field, "mt-1 h-11 text-base")} />
            </label>
            <label className="block text-sm font-semibold">Subtitle
              <input value={s.subtitle} onChange={(e) => set("subtitle", e.target.value)} maxLength={200} placeholder="One line on who it's for and what they'll get" className={cn(field, "mt-1 h-10")} />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-semibold">Category
                <select value={s.category} onChange={(e) => set("category", e.target.value)} className={cn(field, "mt-1 h-10")}>{COURSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              </label>
              <label className="text-sm font-semibold">Level
                <select value={s.level} onChange={(e) => set("level", e.target.value)} className={cn(field, "mt-1 h-10")}>{Object.entries(LEVEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              </label>
              <label className="text-sm font-semibold">Instructor name
                <input value={s.instructorName} onChange={(e) => set("instructorName", e.target.value)} placeholder="Defaults to your name" className={cn(field, "mt-1 h-10")} />
              </label>
            </div>
            <label className="block text-sm font-semibold">Thumbnail image URL <span className="font-normal text-muted-foreground">(optional; defaults to the first video)</span>
              <input value={s.thumbnailUrl} onChange={(e) => set("thumbnailUrl", e.target.value)} placeholder="https://..." className={cn(field, "mt-1 h-10")} />
            </label>
            <label className="block text-sm font-semibold">Description
              <textarea value={s.description} onChange={(e) => set("description", e.target.value)} rows={6} placeholder="What the course covers, how it's structured, and why it's worth the time. Markdown supported." className={cn(field, "mt-1 resize-y py-2")} />
            </label>
          </section>

          <section className="space-y-5 rounded-2xl bg-card/60 p-5 shadow-2xs">
            <h2 className="text-lg font-bold">Learners</h2>
            <ListInput label="What learners will learn" hint="Shown as a checklist on the course page." items={s.outcomes ?? []} onChange={(v) => set("outcomes", v)} placeholder="e.g. Solve sliding window problems" max={12} />
            <ListInput label="Requirements" items={s.requirements ?? []} onChange={(v) => set("requirements", v)} placeholder="e.g. Basic C++ or Python" max={10} />
            <ListInput label="Tags" items={s.tags ?? []} onChange={(v) => set("tags", v)} placeholder="e.g. dsa" max={10} chip />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Curriculum</h2>
            <CurriculumEditor sections={s.sections} onChange={(v) => set("sections", v)} />
          </section>
        </div>

        <aside>
          <div className="sticky top-6 space-y-4">
            <div className="overflow-hidden rounded-2xl bg-card/80 shadow-sm">
              <div className="aspect-video bg-muted">{preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-primary"><GraduationCap className="size-10" aria-hidden /></div>}</div>
              <div className="p-4">
                <p className="line-clamp-2 font-bold">{s.title || "Your course title"}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.subtitle || "Subtitle"}</p>
                <p className="mt-2 text-xs text-muted-foreground">{s.sections.reduce((a, x) => a + x.lectures.length, 0)} lectures · {LEVEL_LABEL[s.level ?? "ALL"]}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-card/60 p-4 shadow-2xs">
              <p className="text-sm font-bold">Ready to publish?</p>
              <ul className="mt-2 space-y-1.5">
                {check.checklist.map((c) => (
                  <li key={c.label} className={cn("flex items-center gap-2 text-sm", c.done ? "text-foreground" : "text-muted-foreground")}>
                    {c.done ? <Check className="size-4 text-primary" aria-hidden /> : <Circle className="size-4" aria-hidden />} {c.label}
                  </li>
                ))}
              </ul>
              {!check.ok && check.errors[0] && <p className="mt-2 text-xs text-muted-foreground">Next: {check.errors.find((e) => !e.startsWith("To publish")) ?? check.errors[0]}</p>}
              <div className="mt-4 grid gap-2">
                <button type="button" onClick={() => save("PUBLISHED")} disabled={busy !== null || !check.ok} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer">
                  {busy === "publish" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Rocket className="size-4" aria-hidden />} Publish
                </button>
                <button type="button" onClick={() => save("DRAFT")} disabled={busy !== null || !s.title.trim()} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-muted/70 text-sm font-semibold hover:bg-muted disabled:opacity-50 cursor-pointer">
                  {busy === "draft" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save draft
                </button>
                {editing && (
                  <button type="button" onClick={remove} disabled={busy !== null} className="flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 cursor-pointer">
                    <Trash2 className="size-4" aria-hidden /> Delete course
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
