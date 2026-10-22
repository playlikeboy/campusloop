/**
 * Seeds src/data/courses/cs50.json into the courses tables.
 * Idempotent: a course is matched by slug and its curriculum is replaced, so
 * re-running after a fresh fetch updates lectures without duplicating them.
 * Learner progress on lectures that still exist is kept (lecture ids are
 * derived from the YouTube id).
 *
 * Run: bun --env-file=.env scripts/courses/seed-cs50.ts
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

interface Lecture {
  title: string;
  videoId: string;
  durationSec: number;
}
interface CourseData {
  key: string;
  site: string;
  category: string;
  level: string;
  tags: string[];
  title: string;
  description: string;
  playlistId: string;
  lectures: Lecture[];
}

const sql = neon((process.env.DATABASE_URL ?? process.env.DB_URL) as string);
const data = JSON.parse(readFileSync("src/data/courses/cs50.json", "utf8")) as { courses: CourseData[] };

const SLUGS: Record<string, string> = {
  cs50x: "cs50x-introduction-to-computer-science",
  cs50p: "cs50p-introduction-to-programming-with-python",
  cs50w: "cs50w-web-programming-with-python-and-javascript",
  cs50ai: "cs50ai-introduction-to-artificial-intelligence-with-python",
  cs50sql: "cs50sql-introduction-to-databases-with-sql",
  cs50cyber: "cs50-introduction-to-cybersecurity",
  cs50r: "cs50r-introduction-to-programming-with-r",
  cs50scratch: "cs50-introduction-to-programming-with-scratch",
  cs50t: "cs50t-understanding-technology",
  cs50b: "cs50b-computer-science-for-business",
  cs50law: "cs50-computer-science-for-lawyers",
  cs50g: "cs50g-introduction-to-2d-game-development",
  cs50m: "cs50m-mobile-app-development-with-react-native",
};

const OUTCOMES: Record<string, string[]> = {
  cs50x: ["Think algorithmically and solve problems efficiently", "Write programs in C, Python and SQL", "Understand memory, data structures and algorithms", "Build web apps with HTML, CSS, JavaScript and Flask"],
  cs50p: ["Read and write Python programs", "Use functions, loops, exceptions and libraries", "Test and debug your code", "Work with files, regular expressions and object-oriented programming"],
  cs50w: ["Build web apps with Python, Django and JavaScript", "Design databases and use SQL and migrations", "Write interactive front ends with React", "Test, scale and secure web applications"],
  cs50ai: ["Understand search, knowledge, uncertainty and optimisation", "Build machine learning and neural network models in Python", "Apply AI to games, language and images"],
  cs50sql: ["Design relational databases", "Query, join and aggregate with SQL", "Optimise, secure and scale databases", "Use SQLite, MySQL and PostgreSQL"],
  cs50cyber: ["Secure accounts, data, systems and software", "Understand threats and trade-offs", "Make informed decisions about privacy"],
  cs50r: ["Program in R", "Clean, transform and visualise data", "Write tests and packages"],
  cs50scratch: ["Learn programming concepts visually", "Build interactive stories, games and animations", "Think like a programmer"],
  cs50t: ["Understand how computers, the internet and the web work", "Know enough about programming to talk to engineers", "Stay safe online"],
  cs50b: ["Understand technology to make better business decisions", "Learn computational thinking, the web and cloud computing", "Talk confidently with engineers"],
  cs50law: ["Understand the technology behind legal issues", "Learn programming, the internet and cybersecurity", "Reason about privacy, encryption and blockchain"],
  cs50g: ["Build 2D games in Lua with LÖVE", "Use game loops, physics, animation and state machines", "Recreate classics from Pong to Pokémon"],
  cs50m: ["Build mobile apps with React Native and JavaScript", "Manage state, navigation and data", "Ship apps with Expo"],
};

function cleanTitle(courseTitle: string, lectureTitle: string): string {
  // "CS50x 2025 - Lecture 1 - C" -> "Lecture 1 - C"
  return lectureTitle.replace(/^CS50[\w\s.]*?\d{4}\s*-\s*/i, "").replace(/^CS50\s+2D\s*-\s*/i, "").replace(/^CS50[A-Za-z]*\s*-\s*/i, "").trim() || lectureTitle;
}

for (const c of data.courses) {
  const slug = SLUGS[c.key];
  if (!slug || c.lectures.length === 0) continue;
  const courseId = `crs_${c.key}`;
  const sectionId = `sec_${c.key}_lectures`;
  const durationSec = c.lectures.reduce((a, l) => a + l.durationSec, 0);
  const title = c.title.replace(/^CS50x 2025$/, "CS50x: Introduction to Computer Science (2025)").replace(/’/g, "'");

  await sql`
    insert into courses (id, slug, title, subtitle, description, category, level, language, thumbnail_url, instructor_name, instructor_bio,
      creator_id, source, source_url, license, outcomes, requirements, tags, status, is_featured, listed, listed_at, provider, rank_boost, lectures_count, duration_sec)
    values (${courseId}, ${slug}, ${title}, ${"Harvard's free CS50 lectures, taught by David J. Malan and team"}, ${c.description},
      ${c.category}, ${c.level}, 'English', ${`https://i.ytimg.com/vi/${c.lectures[Math.min(1, c.lectures.length - 1)].videoId}/hqdefault.jpg`},
      ${"David J. Malan and the CS50 team, Harvard University"},
      ${"CS50 is Harvard University's introduction to computer science and its family of open courses. Lectures are free to watch under a Creative Commons license."},
      null, 'CS50', ${c.site}, 'CC BY-NC-SA 4.0', ${JSON.stringify(OUTCOMES[c.key] ?? [])}::jsonb,
      ${JSON.stringify(["No prior experience required unless stated", "A computer with internet access"])}::jsonb, ${JSON.stringify(["cs50", "harvard", ...c.tags])}::jsonb,
      'PUBLISHED', ${c.key === "cs50x" || c.key === "cs50p" || c.key === "cs50ai"}, true, now(), 'Harvard CS50', 1, ${c.lectures.length}, ${durationSec})
    on conflict (slug) do update set title = excluded.title, description = excluded.description, category = excluded.category,
      level = excluded.level, thumbnail_url = excluded.thumbnail_url, source_url = excluded.source_url, outcomes = excluded.outcomes,
      tags = excluded.tags, lectures_count = excluded.lectures_count, duration_sec = excluded.duration_sec, status = 'PUBLISHED', listed = true, provider = 'Harvard CS50', rank_boost = 1, updated_at = now()`;

  await sql`insert into course_sections (id, course_id, title, position) values (${sectionId}, ${courseId}, 'Lectures', 0)
    on conflict (id) do nothing`;

  const keep = c.lectures.map((l) => `lec_${l.videoId}`);
  await sql`delete from course_lectures where course_id = ${courseId} and not (id = any(${keep}))`;
  for (const [i, l] of c.lectures.entries()) {
    const attachments = [
      { label: "Course site: notes, slides and problem sets", url: c.site },
      { label: "Watch on YouTube", url: `https://www.youtube.com/watch?v=${l.videoId}` },
    ];
    await sql`
      insert into course_lectures (id, course_id, section_id, title, position, kind, video_provider, video_ref, duration_sec, is_preview, attachments)
      values (${`lec_${l.videoId}`}, ${courseId}, ${sectionId}, ${cleanTitle(c.title, l.title)}, ${i}, 'VIDEO', 'youtube', ${l.videoId},
        ${l.durationSec}, ${i < 2}, ${JSON.stringify(attachments)}::jsonb)
      on conflict (id) do update set title = excluded.title, position = excluded.position, duration_sec = excluded.duration_sec,
        attachments = excluded.attachments, is_preview = excluded.is_preview, course_id = excluded.course_id, section_id = excluded.section_id, updated_at = now()`;
  }
  console.log(`seeded ${slug}: ${c.lectures.length} lectures, ${(durationSec / 3600).toFixed(1)}h`);
}
