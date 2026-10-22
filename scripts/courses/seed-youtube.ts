/**
 * Seeds scripts/courses/data/youtube.json (built by import-youtube.ts) into the
 * courses tables. Idempotent: courses are keyed by playlist (crs_yt_<playlist>)
 * and lectures by playlist + video, so re-running updates titles, order and new
 * videos without duplicates, and keeps learner progress on lectures that remain.
 *
 * Run:  bun --env-file=.env scripts/courses/seed-youtube.ts
 *       bun --env-file=.env scripts/courses/seed-youtube.ts --prune   (unpublish imported courses no longer in the file)
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { slugifyCourse } from "../../src/lib/courses/format";
import { SOURCE_BOOST } from "../../src/lib/courses/promotion";
import { cleanTitle, type ImportedCourse } from "./import-youtube";
import { SOURCES } from "./sources";

const sql = neon((process.env.DB_URL ?? process.env.DATABASE_URL) as string);
const { courses } = JSON.parse(readFileSync("scripts/courses/data/youtube.json", "utf8")) as { courses: ImportedCourse[] };
const prune = process.argv.includes("--prune");
const SECTION_SIZE = 10;

const bioOf = (key: string) => SOURCES.find((s) => s.key === key)?.bio ?? null;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** "Normalization in DBMS | Lec-42 | Gate Smashers #dbms" -> "Normalization in DBMS | Lec-42" */
function lectureTitle(raw: string, provider: string): string {
  return (
    raw
      .replace(/#[\w-]+/g, "")
      .replace(new RegExp(`\\s*[|\\-–:]\\s*${esc(provider)}\\s*`, "gi"), " ")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
      .replace(/\s*\|\s*$/, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 200) || raw
  );
}

/** Topic name from a lecture title, for "What you'll learn". */
function topicOf(title: string): string {
  return title
    .split(/\s[|–]\s|\s-\s/)
    .map((p) => p.trim())
    .filter((p) => !/^(lec(ture)?|l|part|day|video|chapter|tutorial|session|ep(isode)?)[\s\-#.:]*\d+$/i.test(p) && !/^\d+$/.test(p) && p.length > 3)
    .sort((a, b) => b.length - a.length)[0]
    ?.replace(/^(lec(ture)?|day|part|chapter|tutorial|session)[\s\-#.:]*\d+[\s\-:.]*/i, "")
    .trim() ?? "";
}

function outcomes(c: ImportedCourse): string[] {
  const n = c.lectures.length;
  const picks = Array.from({ length: Math.min(6, n) }, (_, i) => c.lectures[Math.floor((i * n) / Math.min(6, n))]);
  const seen = new Set<string>();
  return picks
    .map((l) => topicOf(lectureTitle(l.title, c.provider)))
    .filter((t) => t.length >= 4 && t.length <= 90 && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()))
    .map((t) => `Understand ${t}`);
}

function describe(c: ImportedCourse, hours: number): string {
  const intro = `A free ${c.lectures.length}-lecture ${c.category.toLowerCase()} course by ${c.provider}${c.language === "Hindi" ? ", taught in Hindi" : ""}. About ${hours} hours of video, in the order the creator published it.`;
  return c.description.length >= 80 ? `${intro}\n\n${c.description}` : `${intro}\n\nTrack your progress lecture by lecture, keep timestamped notes, ask questions and earn a CampusLoop certificate when you finish.`;
}

/** Provider in the slug keeps generic titles readable: "c-programming-gate-smashers", not "c-programming-3". */
function slugBase(title: string, provider: string): string {
  const short = provider.replace(/\s*\(.*\)$/, "");
  return slugifyCourse(title.toLowerCase().includes(short.toLowerCase()) ? title : `${title} ${short}`);
}

async function uniqueSlug(id: string, title: string, provider: string, keepExisting = true): Promise<string> {
  const [existing] = await sql`select slug from courses where id = ${id}`;
  if (existing && keepExisting) return existing.slug as string;
  const bases = [slugBase(title, provider), slugifyCourse(title)];
  for (const base of bases) {
    for (let i = 0; i < 5; i++) {
      const slug = i === 0 ? base : `${base}-${i + 1}`;
      const [hit] = await sql`select id from courses where slug = ${slug}`;
      if (hit?.id === id) return slug;
      if (!hit && !["new", "my", "category", "feed", "search", "edit"].includes(slug)) return slug;
    }
  }
  return `${bases[0]}-${id.slice(-6).toLowerCase()}`;
}

// --reslug: recompute slugs for imported courses only (before anyone has shared links), then exit.
if (process.argv.includes("--reslug")) {
  for (const c of courses) {
    const id = `crs_yt_${c.playlistId}`;
    await sql`update courses set slug = ${`tmp-${id.toLowerCase()}`} where id = ${id}`;
  }
  for (const c of courses) {
    const id = `crs_yt_${c.playlistId}`;
    await sql`update courses set slug = ${await uniqueSlug(id, cleanTitle(c.title, c.provider), c.provider, false)} where id = ${id}`;
  }
  console.log("reslugged", courses.length);
  process.exit(0);
}

let n = 0;
for (const c of courses) {
  if (c.lectures.length === 0) continue;
  c.title = cleanTitle(c.title, c.provider); // re-clean: title rules may have changed since the import
  const id = `crs_yt_${c.playlistId}`;
  const lk = c.playlistId.slice(-8);
  const durationSec = c.lectures.reduce((a, l) => a + l.durationSec, 0);
  const hours = Math.max(1, Math.round(durationSec / 3600));
  const slug = await uniqueSlug(id, c.title, c.provider);
  const subtitle = `${c.lectures.length} free lectures by ${c.provider}${c.language === "Hindi" ? " in Hindi" : ""}`;
  const thumb = `https://i.ytimg.com/vi/${c.lectures[0].videoId}/hqdefault.jpg`;
  const sourceUrl = `https://www.youtube.com/playlist?list=${c.playlistId}`;
  const requirements = c.level === "BEGINNER" ? ["No prior experience required", "A computer or phone with internet access"] : ["Basic programming knowledge helps", "A computer or phone with internet access"];

  await sql`
    insert into courses (id, slug, title, subtitle, description, category, level, language, thumbnail_url, instructor_name, instructor_bio,
      source, provider, rank_boost, source_url, license, outcomes, requirements, tags, status, listed, listed_at, lectures_count, duration_sec)
    values (${id}, ${slug}, ${c.title}, ${subtitle}, ${describe(c, hours)}, ${c.category}, ${c.level}, ${c.language}, ${thumb}, ${c.provider}, ${bioOf(c.source)},
      ${c.kind}, ${c.provider}, ${SOURCE_BOOST[c.kind] ?? 0}, ${sourceUrl}, ${c.license}, ${JSON.stringify(outcomes(c))}::jsonb,
      ${JSON.stringify(requirements)}::jsonb, ${JSON.stringify(c.tags)}::jsonb, 'PUBLISHED', true, now(), ${c.lectures.length}, ${durationSec})
    on conflict (id) do update set title = excluded.title, subtitle = excluded.subtitle, description = excluded.description,
      category = excluded.category, level = excluded.level, language = excluded.language, thumbnail_url = excluded.thumbnail_url,
      instructor_name = excluded.instructor_name, instructor_bio = excluded.instructor_bio, source = excluded.source,
      provider = excluded.provider, rank_boost = excluded.rank_boost, source_url = excluded.source_url, license = excluded.license,
      outcomes = excluded.outcomes, tags = excluded.tags, lectures_count = excluded.lectures_count, duration_sec = excluded.duration_sec,
      status = 'PUBLISHED', listed = true, updated_at = now()`;

  // Long playlists are split into sections of 10 so the curriculum reads like a course.
  const chunks = c.lectures.length > 15 ? Math.ceil(c.lectures.length / SECTION_SIZE) : 1;
  const sectionIds = Array.from({ length: chunks }, (_, i) => `sec_yt_${lk}_${i + 1}`);
  const sectionTitle = (i: number) =>
    chunks === 1 ? "Lectures" : `Part ${i + 1}: Lectures ${i * SECTION_SIZE + 1}–${Math.min((i + 1) * SECTION_SIZE, c.lectures.length)}`;
  const secValues = sectionIds.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(", ");
  await sql.query(
    `insert into course_sections (id, course_id, title, position) values ${secValues}
     on conflict (id) do update set title = excluded.title, position = excluded.position`,
    sectionIds.flatMap((sid, i) => [sid, id, sectionTitle(i), i])
  );

  const rows = c.lectures.map((l, i) => [
    `lec_${lk}_${l.videoId}`,
    id,
    sectionIds[chunks === 1 ? 0 : Math.floor(i / SECTION_SIZE)],
    lectureTitle(l.title, c.provider),
    i,
    // The owner disabled embedding: a LINK lecture that opens the video on YouTube.
    l.external ? "LINK" : "VIDEO",
    l.external ? "link" : "youtube",
    l.external ? `https://www.youtube.com/watch?v=${l.videoId}&list=${c.playlistId}` : l.videoId,
    l.durationSec,
    i < 2,
    l.external ? "The creator plays this lecture on YouTube only, so it opens in a new tab. It is marked complete when you open it." : null,
    JSON.stringify([{ label: "Watch on YouTube", url: `https://www.youtube.com/watch?v=${l.videoId}&list=${c.playlistId}` }]),
  ]);
  const W = 12;
  for (let start = 0; start < rows.length; start += 400) {
    const batch = rows.slice(start, start + 400);
    // ($1, ..., $11, $12::jsonb), one group per lecture; attachments is the last column.
    const values = batch.map((_, r) => `(${Array.from({ length: W }, (_, k) => `$${r * W + k + 1}${k === W - 1 ? "::jsonb" : ""}`).join(", ")})`).join(", ");
    await sql.query(
      `insert into course_lectures (id, course_id, section_id, title, position, kind, video_provider, video_ref, duration_sec, is_preview, body, attachments)
       values ${values}
       on conflict (id) do update set section_id = excluded.section_id, title = excluded.title, position = excluded.position,
         kind = excluded.kind, video_provider = excluded.video_provider, video_ref = excluded.video_ref, body = excluded.body,
         duration_sec = excluded.duration_sec, is_preview = excluded.is_preview, attachments = excluded.attachments, updated_at = now()`,
      batch.flat()
    );
  }
  const keep = rows.map((r) => r[0] as string);
  await sql`delete from course_lectures where course_id = ${id} and not (id = any(${keep}))`;
  await sql`delete from course_sections where course_id = ${id} and not (id = any(${sectionIds}))`;
  n++;
  if (n % 25 === 0) console.log(`seeded ${n}/${courses.length}`);
}

if (prune) {
  const ids = courses.map((c) => `crs_yt_${c.playlistId}`);
  const gone = await sql`update courses set status = 'DRAFT', listed = false where id like 'crs_yt_%' and not (id = any(${ids})) returning slug`;
  console.log(`unpublished ${gone.length} courses no longer in the import`);
}

const [{ total, lectures }] = await sql`select count(*)::int total, coalesce(sum(lectures_count), 0)::int lectures from courses where id like 'crs_yt_%' and status = 'PUBLISHED'`;
console.log(`done: ${n} seeded; ${total} imported courses live with ${lectures} lectures`);
