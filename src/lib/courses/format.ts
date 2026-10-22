/** Client-safe course helpers (formatting, video URL parsing). */

export const COURSE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL"] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  ALL: "All levels",
};

export const COURSE_CATEGORIES = [
  "Computer Science",
  "Programming",
  "Web Development",
  "Mobile Development",
  "Artificial Intelligence",
  "Data Science",
  "Databases",
  "Cybersecurity",
  "Game Development",
  "Design",
  "Business",
  "Law & Policy",
  "Mathematics",
  "Exam Prep",
  "Career Skills",
  "System Design",
  "DevOps & Cloud",
  "General",
] as const;

/** 5432 -> "1h 30m"; 125 -> "2m" */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h === 0) return `${Math.max(1, m)}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** 754 -> "12:34"; 3754 -> "1:02:34" */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

export function slugifyCourse(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 70) || "course"
  );
}

export type VideoRef = { provider: "youtube" | "vimeo" | "file"; ref: string };

/** Accepts YouTube/Vimeo links or a direct .mp4/.webm URL. */
export function parseVideoUrl(raw: string): VideoRef | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") {
    const id = u.pathname.slice(1, 12);
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: "youtube", ref: id } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/)?.[1];
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: "youtube", ref: id } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/(\d{6,12})/)?.[1];
    return id ? { provider: "vimeo", ref: id } : null;
  }
  if (/\.(mp4|webm|m4v|mov)$/i.test(u.pathname)) return { provider: "file", ref: u.toString() };
  return null;
}

export function videoThumbnail(provider?: string | null, ref?: string | null): string | null {
  return provider === "youtube" && ref ? `https://i.ytimg.com/vi/${ref}/hqdefault.jpg` : null;
}

/** Who made an imported course, for attribution lines. Null for community courses. */
export function courseProvider(c: { source: string; provider?: string | null; instructorName: string }): string | null {
  if (c.source === "COMMUNITY") return null;
  if (c.source === "CS50") return "CS50 at Harvard University";
  return c.provider ?? c.instructorName;
}

/** Attribution shown on the course page and player for imported courses. */
export function attributionNote(c: { source: string; provider?: string | null; instructorName: string; license?: string | null }): string | null {
  const who = courseProvider(c);
  if (!who) return null;
  const org = c.source === "CS50" ? "Harvard" : who;
  return `Lectures by ${who}${c.license ? `, licensed ${c.license}` : ""}, embedded with YouTube's player from ${c.source === "CS50" ? "CS50's" : "the creator's"} official channel. CampusLoop is not affiliated with ${org}.`;
}

/** Short badge label for catalog cards. */
export function sourceBadge(c: { source: string; provider?: string | null }): string | null {
  if (c.source === "CS50") return "CS50 · Harvard";
  if (c.source === "UNIVERSITY") return c.provider ?? "University";
  return null;
}
