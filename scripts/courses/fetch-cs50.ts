/**
 * Builds src/data/courses/cs50.json: every CS50 OpenCourseWare course with its
 * lecture videos, in order, with durations. Each video is verified through
 * YouTube oEmbed, and anything without a real duration (upcoming or live
 * streams) is dropped, so the seeded catalog has no broken lectures.
 *
 * Run: bun scripts/courses/fetch-cs50.ts
 * Then: bun --env-file=.env scripts/courses/seed-cs50.ts
 *
 * CS50 materials are by David J. Malan / Harvard, licensed CC BY-NC-SA 4.0.
 */
import { mkdirSync, writeFileSync } from "node:fs";

interface CourseSpec {
  key: string;
  /** Course site; also where the description is read from. */
  site: string;
  /** Pinned playlist when the newest edition is still mid-semester. */
  playlist?: string;
  category: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ALL";
  tags: string[];
}

const COURSES: CourseSpec[] = [
  { key: "cs50x", site: "https://cs50.harvard.edu/x/2025/", playlist: "PLhQjrBD2T383q7Vn8QnTsVgSvyLpsqL_R", category: "Computer Science", level: "BEGINNER", tags: ["c", "python", "sql", "algorithms", "web"] },
  { key: "cs50p", site: "https://cs50.harvard.edu/python/", category: "Programming", level: "BEGINNER", tags: ["python"] },
  { key: "cs50w", site: "https://cs50.harvard.edu/web/", category: "Web Development", level: "INTERMEDIATE", tags: ["django", "javascript", "react", "web"] },
  { key: "cs50ai", site: "https://cs50.harvard.edu/ai/", category: "Artificial Intelligence", level: "INTERMEDIATE", tags: ["ai", "machine-learning", "python"] },
  { key: "cs50sql", site: "https://cs50.harvard.edu/sql/", category: "Databases", level: "BEGINNER", tags: ["sql", "databases", "sqlite", "postgresql"] },
  { key: "cs50cyber", site: "https://cs50.harvard.edu/cybersecurity/", category: "Cybersecurity", level: "BEGINNER", tags: ["security", "privacy"] },
  { key: "cs50r", site: "https://cs50.harvard.edu/r/", category: "Data Science", level: "BEGINNER", tags: ["r", "statistics", "data"] },
  { key: "cs50scratch", site: "https://cs50.harvard.edu/scratch/", category: "Programming", level: "BEGINNER", tags: ["scratch", "first-steps"] },
  { key: "cs50t", site: "https://cs50.harvard.edu/technology/", category: "Computer Science", level: "BEGINNER", tags: ["technology", "internet", "hardware"] },
  { key: "cs50b", site: "https://cs50.harvard.edu/business/", category: "Business", level: "BEGINNER", tags: ["business", "technology"] },
  { key: "cs50law", site: "https://cs50.harvard.edu/law/", category: "Law & Policy", level: "BEGINNER", tags: ["law", "technology"] },
  { key: "cs50g", site: "https://cs50.harvard.edu/games/", category: "Game Development", level: "INTERMEDIATE", tags: ["games", "lua", "unity"] },
  { key: "cs50m", site: "https://cs50.harvard.edu/mobile/", category: "Mobile Development", level: "INTERMEDIATE", tags: ["react-native", "javascript", "mobile"] },
];

const UA = { "User-Agent": "Mozilla/5.0 (CampusLoop course importer)", "Accept-Language": "en-US,en" };

async function text(url: string): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: UA, redirect: "follow" });
    if (res.ok) return res.text();
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  throw new Error(`GET ${url} failed`);
}

const meta = (html: string, name: string) =>
  html.match(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`, "i"))?.[1] ??
  html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:name|property)="${name}"`, "i"))?.[1];

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&#39;|&rsquo;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function toSeconds(badge: string): number | null {
  if (!/^\d{1,2}(:\d{2}){1,2}$/.test(badge)) return null;
  return badge.split(":").map(Number).reduce((a, b) => a * 60 + b, 0);
}

interface Lecture {
  title: string;
  videoId: string;
  durationSec: number;
}

function collect(o: unknown, out: Record<string, unknown>[]) {
  if (Array.isArray(o)) for (const v of o) collect(v, out);
  else if (o && typeof o === "object") {
    const rec = o as Record<string, unknown>;
    if (rec.lockupViewModel) out.push(rec.lockupViewModel as Record<string, unknown>);
    for (const v of Object.values(rec)) collect(v, out);
  }
}

function deepFind(o: unknown, pred: (k: string, v: unknown) => boolean): unknown[] {
  const hits: unknown[] = [];
  const walk = (x: unknown) => {
    if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object")
      for (const [k, v] of Object.entries(x)) {
        if (pred(k, v)) hits.push(v);
        walk(v);
      }
  };
  walk(o);
  return hits;
}

async function playlistLectures(listId: string): Promise<Lecture[]> {
  let raw: string | undefined;
  for (let attempt = 0; attempt < 4 && !raw; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 2000 * attempt));
    const html = await text(`https://www.youtube.com/playlist?list=${listId}&hl=en`);
    raw = html.match(/var ytInitialData = (\{.*?\});<\/script>/)?.[1];
  }
  if (!raw) throw new Error(`no ytInitialData for ${listId}`);
  const items: Record<string, unknown>[] = [];
  collect(JSON.parse(raw), items);
  const lectures: Lecture[] = [];
  for (const it of items) {
    if (it.contentType !== "LOCKUP_CONTENT_TYPE_VIDEO" || typeof it.contentId !== "string") continue;
    const title = (deepFind(it, (k) => k === "title")[0] as { content?: string } | undefined)?.content;
    const badges = deepFind(it, (k) => k === "thumbnailBadgeViewModel").map((b) => (b as { text?: string }).text ?? "");
    const durationSec = badges.map(toSeconds).find((n): n is number => n !== null);
    if (!title || !durationSec) continue; // upcoming or live: no duration yet
    if (!lectures.some((l) => l.videoId === it.contentId)) lectures.push({ title, videoId: it.contentId, durationSec });
  }
  return lectures;
}

async function oembedOk(videoId: string): Promise<boolean> {
  const res = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${videoId}`, { headers: UA });
  return res.ok;
}

const out = [];
for (const c of COURSES) {
  try {
  const html = await text(c.site);
  const listId = c.playlist ?? html.match(/playlist\?list=([A-Za-z0-9_-]+)/)?.[1];
  if (!listId) throw new Error(`no playlist on ${c.site}`);
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? c.key).trim();
  const description = decode(meta(html, "description") ?? meta(html, "og:description") ?? "").trim();
  const all = await playlistLectures(listId);
  const lectures: Lecture[] = [];
  for (const l of all) {
    if (await oembedOk(l.videoId)) lectures.push(l);
    else console.warn(`  dropped unavailable video ${l.videoId} ${l.title}`);
  }
  console.log(`${c.key}: ${title} | ${lectures.length}/${all.length} lectures`);
  if (lectures.length === 0) throw new Error("no available lectures");
  out.push({ ...c, title, description, playlistId: listId, lectures });
  } catch (err) {
    // Skip rather than seed a half-broken course.
    console.warn(`SKIPPED ${c.key}: ${err instanceof Error ? err.message : err}`);
  }
}

mkdirSync("src/data/courses", { recursive: true });
writeFileSync("src/data/courses/cs50.json", `${JSON.stringify({ fetchedAt: new Date().toISOString(), license: "CC BY-NC-SA 4.0", courses: out }, null, 2)}\n`);
console.log("wrote src/data/courses/cs50.json");
