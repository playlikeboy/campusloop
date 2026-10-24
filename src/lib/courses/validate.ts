import { COURSE_CATEGORIES, COURSE_LEVELS, parseVideoUrl } from "./format";

/** Builder payload, shared by the client builder and the API (pure). */
export interface LectureInput {
  id?: string;
  title: string;
  kind: "VIDEO" | "ARTICLE" | "LINK";
  videoUrl?: string;
  durationMin?: number;
  body?: string;
  isPreview?: boolean;
  attachments?: { label: string; url: string }[];
}
export interface SectionInput {
  id?: string;
  title: string;
  lectures: LectureInput[];
}
export interface CourseInput {
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  level?: string;
  thumbnailUrl?: string;
  instructorName?: string;
  outcomes?: string[];
  requirements?: string[];
  tags?: string[];
  status?: "DRAFT" | "PUBLISHED";
  sections: SectionInput[];
}

const isHttps = (u: string) => /^https:\/\/\S+$/.test(u);
const clean = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");
const list = (v: unknown, max: number, len = 160) =>
  (Array.isArray(v) ? v : []).map((x) => clean(x, len)).filter(Boolean).slice(0, max);

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  /** Checklist for the builder: what's done and what's missing to publish. */
  checklist: { label: string; done: boolean }[];
  value: CourseInput;
}

export function validateCourse(raw: unknown, intent: "DRAFT" | "PUBLISHED" = "DRAFT"): ValidationResult {
  const r = (raw ?? {}) as Record<string, unknown>;
  const errors: string[] = [];
  const sectionsRaw = Array.isArray(r.sections) ? r.sections.slice(0, 50) : [];
  const sections: SectionInput[] = sectionsRaw.map((s: Record<string, unknown>, si: number) => {
    const lectures = (Array.isArray(s.lectures) ? s.lectures.slice(0, 200) : []).map((l: Record<string, unknown>, li: number) => {
      const kind = (["VIDEO", "ARTICLE", "LINK"] as const).find((k) => k === l.kind) ?? "VIDEO";
      const lecture: LectureInput = {
        id: typeof l.id === "string" ? l.id : undefined,
        title: clean(l.title, 160),
        kind,
        videoUrl: clean(l.videoUrl, 500),
        durationMin: Number.isFinite(Number(l.durationMin)) ? Math.max(0, Math.min(600, Number(l.durationMin))) : 0,
        body: clean(l.body, 20000),
        isPreview: Boolean(l.isPreview),
        attachments: (Array.isArray(l.attachments) ? l.attachments : [])
          .map((a: Record<string, unknown>) => ({ label: clean(a.label, 120), url: clean(a.url, 500) }))
          .filter((a) => a.label && isHttps(a.url))
          .slice(0, 20),
      };
      const where = `Section ${si + 1}, lecture ${li + 1}`;
      if (!lecture.title) errors.push(`${where}: add a title`);
      if (kind === "VIDEO" && !parseVideoUrl(lecture.videoUrl ?? "")) errors.push(`${where}: paste a YouTube, Vimeo or .mp4 link`);
      if (kind === "LINK" && !isHttps(lecture.videoUrl ?? "")) errors.push(`${where}: add an https:// link`);
      if (kind === "ARTICLE" && !lecture.body) errors.push(`${where}: write the article text`);
      return lecture;
    });
    if (!clean(s.title, 160)) errors.push(`Section ${si + 1}: add a title`);
    return { id: typeof s.id === "string" ? s.id : undefined, title: clean(s.title, 160), lectures };
  });

  const value: CourseInput = {
    title: clean(r.title, 120),
    subtitle: clean(r.subtitle, 200),
    description: clean(r.description, 20000),
    category: COURSE_CATEGORIES.find((c) => c === r.category) ?? "General",
    level: COURSE_LEVELS.find((l) => l === r.level) ?? "ALL",
    thumbnailUrl: isHttps(clean(r.thumbnailUrl, 500)) ? clean(r.thumbnailUrl, 500) : "",
    instructorName: clean(r.instructorName, 120),
    outcomes: list(r.outcomes, 12),
    requirements: list(r.requirements, 10),
    tags: list(r.tags, 10, 30).map((t) => t.toLowerCase().replace(/[^a-z0-9-]/g, "-")),
    status: r.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    sections,
  };

  const lectureCount = sections.reduce((a, s) => a + s.lectures.length, 0);
  const checklist = [
    { label: "Title (at least 8 characters)", done: value.title.length >= 8 },
    { label: "Short subtitle", done: (value.subtitle ?? "").length >= 10 },
    { label: "At least 2 learning outcomes", done: (value.outcomes ?? []).length >= 2 },
    { label: "At least 3 lectures", done: lectureCount >= 3 },
    { label: "Every lecture complete", done: errors.length === 0 && lectureCount > 0 },
  ];
  if (!value.title) errors.unshift("Add a course title");
  if (intent === "PUBLISHED") for (const c of checklist) if (!c.done) errors.push(`To publish: ${c.label.toLowerCase()}`);
  return { ok: errors.length === 0, errors, checklist, value };
}
