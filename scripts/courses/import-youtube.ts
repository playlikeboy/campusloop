/**
 * Builds scripts/courses/data/youtube.json: free courses from the official
 * YouTube channels in sources.ts. For each channel it reads the Playlists tab,
 * keeps course-like playlists on CS/engineering topics, then fetches every
 * playable video in order. Shorts, private, deleted and live/upcoming videos
 * are dropped, so nothing seeded is broken. Videos whose owner disabled
 * embedding are kept as "Watch on YouTube" lectures (external: true).
 *
 * Run:  bun scripts/courses/import-youtube.ts            (all sources)
 *       bun scripts/courses/import-youtube.ts mit,neso   (refresh some, keep the rest)
 * Then: bun --env-file=.env scripts/courses/seed-youtube.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { type CourseSource, SOURCES } from "./sources";
import { channelPlaylists, playlistVideos, videoStatus, type YtPlaylist, type YtVideo } from "./youtube";

export interface ImportedCourse {
  source: string;
  kind: CourseSource["kind"];
  provider: string;
  playlistId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  language: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL";
  license: string | null;
  lectures: YtVideo[];
}

const OUT = "scripts/courses/data/youtube.json";

/** First match wins, so specific topics come before broad ones. */
const TOPICS: { category: string; re: RegExp; tags: string[] }[] = [
  // Core Computing (High-priority CS topics)
  {
    category: "Computer Science",
    re: /\b(computer (organi[sz]ation|architecture)|\bcoa\b|data structures?|algorithms?|dsa|operating systems?|\bos\b|computer networks?|networking|\bcn\b|compiler|theory of computation|\btoc\b|automata|software engineering|dynamic programming|recursion|graphs?|trees?|binary search|leetcode|6\.\d{3,4}|cs ?\d{3}|computer science|oops?|object oriented)\b/i,
    tags: ["computer-science"],
  },
  { category: "Programming", re: /\b(python|java|c\+\+|c language|\bc programming|golang|\bgo\b|rust|programming|coding|c#|scala|r programming)\b/i, tags: ["programming"] },
  { category: "Databases", re: /\b(dbms|database|sql|mysql|postgres|mongodb|rdbms|normali[sz]ation)\b/i, tags: ["dbms", "sql"] },
  { category: "System Design", re: /\b(system design|distributed systems?|low level design|lld|hld|microservices?)\b/i, tags: ["system-design"] },
  { category: "Cybersecurity", re: /\b(cyber ?security|ethical hacking|cryptography|network security|information security)\b/i, tags: ["security"] },
  { category: "Artificial Intelligence", re: /\b(machine learning|deep learning|neural networks?|artificial intelligence|\bai\b|nlp|natural language|computer vision|llms?|generative|gen ?ai|transformers?|reinforcement learning|rag|agents?|langchain|cs229|cs231n|cs224n|zero to hero|convolutional|sequence models)\b/i, tags: ["ai", "machine-learning"] },
  { category: "Data Science", re: /\b(data science|data analy(sis|tics)|pandas|numpy|statistics|power ?bi|excel|tableau|matplotlib)\b/i, tags: ["data-science"] },
  { category: "Mobile Development", re: /\b(android|flutter|kotlin|react native|ios|swift)\b/i, tags: ["mobile"] },
  { category: "Web Development", re: /\b(web ?dev(elopment)?|html|css|javascript|\bjs\b|react|next\.?js|node(\.?js)?|express|django|flask|tailwind|php|mern|frontend|backend|full ?stack|typescript|sanity|bootstrap|spring boot)\b/i, tags: ["web"] },
  { category: "DevOps & Cloud", re: /\b(devops|docker|kubernetes|aws|azure|cloud computing|linux|git(hub)?|ci\/cd|vps|deployment)\b/i, tags: ["devops"] },

  // Engineering Branches
  { category: "Mechanical Engineering", re: /\b(thermodynamics|fluid mechanics|strength of materials|\bsom\b|theory of machines|machine design|heat transfer|manufacturing|engineering mechanics|ic engines?|refrigeration|finite element|\bfea\b|\bcad\b)\b/i, tags: ["mechanical", "engineering"] },
  { category: "Civil Engineering", re: /\b(structural analysis|surveying|geotechnical|soil mechanics|\brcc\b|concrete|transportation engineering|hydrology|environmental engineering|estimation|highway engineering)\b/i, tags: ["civil", "engineering"] },
  { category: "Electrical Engineering", re: /\b(electrical machines?|power systems?|control systems?|power electronics|network theory|circuit theory|circuit analysis|electrical measurements?|switchgear)\b/i, tags: ["electrical", "engineering"] },
  { category: "Electronics & Communication", re: /\b(analog electronics|digital communication|signals and systems|vlsi|microprocessors?|microcontrollers?|embedded systems?|antenna|emft|electromagnetics|digital (logic|electronics)|op-?amps?|semiconductor|8085|8086)\b/i, tags: ["ece", "electronics"] },
  { category: "Chemical Engineering", re: /\b(mass transfer|heat transfer operations|chemical reaction engineering|process control|unit operations|fluid flow|chemical engineering)\b/i, tags: ["chemical", "engineering"] },
  { category: "Biotechnology", re: /\b(biotechnology|bioprocess|molecular biology|genetic engineering|immunology)\b/i, tags: ["biotech"] },

  // Sciences & Mathematics
  { category: "Mathematics", re: /\b(engineering mathematics|calculus|linear algebra|discrete math(ematics)?|differential equations|laplace|fourier|numerical methods|probability|statistics|complex variables|18\.\d+|mathematics|graph theory)\b/i, tags: ["math"] },
  { category: "Physics", re: /\b(physics|electrodynamics|quantum (mechanics|physics)|classical mechanics|optics|thermal physics|modern physics|astrophysics|8\.0\d+)\b/i, tags: ["physics"] },
  { category: "Chemistry", re: /\b(organic chemistry|inorganic chemistry|physical chemistry|biochemistry|general chemistry|5\.11\d+)\b/i, tags: ["chemistry"] },
  { category: "Biology", re: /\b(cell biology|genetics|zoology|botany|ecology|7\.0\d+)\b/i, tags: ["biology"] },

  // Health & Medicine
  { category: "Medicine", re: /\b(anatomy|physiology|pathology|pharmacology|clinical medicine|surgery|neet ?pg|usmle|mbbs|histology|hematology|cardiology|neurology|embryology)\b/i, tags: ["medicine", "mbbs"] },
  { category: "Pharmacy", re: /\b(pharmaceutics|pharmacognosy|pharmaceutical|b\.? ?pharm|d\.? ?pharm|medicinal chemistry)\b/i, tags: ["pharmacy"] },
  { category: "Nursing & Allied Health", re: /\b(nursing|physiotherapy|paramedical|nclex|b\.?sc nursing)\b/i, tags: ["nursing"] },

  // Business, Commerce & Economics
  { category: "Finance & Accounting", re: /\b(accounting|accountancy|financial accounting|cost accounting|corporate finance|taxation|gst|income tax|auditing|ca foundation|ca inter|cfa|stock market|investing|balance sheet|financial statements|financial management)\b/i, tags: ["finance", "accounting"] },
  { category: "Economics", re: /\b(economics|microeconomics|macroeconomics|econometrics|game theory|international trade|indian economy|14\.0\d+)\b/i, tags: ["economics"] },
  { category: "Marketing", re: /\b(marketing|digital marketing|seo|branding|advertising|social media marketing|marketing management)\b/i, tags: ["marketing"] },
  { category: "Business", re: /\b(principles of management|business studies|organi[sz]ational behaviou?r|human resource|\bhrm\b|operations management|supply chain|business law|\bmba\b|strategic management|business)\b/i, tags: ["business"] },
  { category: "Entrepreneurship", re: /\b(startup school|startups?|entrepreneurship|founders?|venture capital|pitch deck)\b/i, tags: ["startups", "entrepreneurship"] },

  // Humanities, Law & Social Sciences
  { category: "Law & Policy", re: /\b(constitution(al)? law|contract law|criminal law|\bipc\b|\bbns\b|\bcrpc\b|\bcpc\b|jurisprudence|family law|\bclat\b|\bllb\b|judiciary|legal studies|justice)\b/i, tags: ["law"] },
  { category: "Psychology", re: /\b(psychology|cognitive psychology|social psychology|developmental psychology|behaviou?ral science)\b/i, tags: ["psychology"] },
  { category: "Humanities", re: /\b(history|world history|philosophy|literature|english literature|ethics|moral philosophy)\b/i, tags: ["humanities"] },
  { category: "Social Sciences", re: /\b(sociology|political science|polity|geography|anthropology|public administration)\b/i, tags: ["social-sciences"] },

  // Design, Architecture & Media
  { category: "Design", re: /\b(ui ?\/? ?ux|ux design|graphic design|figma|typography|product design|wireframing|user experience|design systems?)\b/i, tags: ["design", "uiux"] },
  { category: "Architecture", re: /\b(architecture|architectural|autocad|revit|sketchup|building construction)\b/i, tags: ["architecture"] },
  { category: "Media & Communication", re: /\b(journalism|filmmaking|video editing|premiere pro|public speaking|communication skills)\b/i, tags: ["media"] },
  { category: "Languages", re: /\b(english grammar|spoken english|ielts|toefl|german|french|japanese|spanish|korean)\b/i, tags: ["languages"] },
  { category: "Career Skills", re: /\b(power ?bi|excel|resume|interview skills|soft skills|productivity|study skills)\b/i, tags: ["career"] },

  { category: "Exam Prep", re: /\b(gate|ugc net|semester exam)\b/i, tags: ["gate", "exam-prep"] },
];

const LANG_TAGS: [RegExp, string][] = [
  [/python/i, "python"], [/\bjava\b/i, "java"], [/c\+\+/i, "cpp"], [/javascript|\bjs\b/i, "javascript"], [/react/i, "react"],
  [/\bsql\b/i, "sql"], [/oops?|object oriented/i, "oop"], [/dsa|data structures/i, "dsa"], [/operating system|\bos\b/i, "os"],
  [/computer network/i, "computer-networks"], [/dbms|database/i, "dbms"], [/machine learning/i, "machine-learning"], [/deep learning/i, "deep-learning"],
  [/\bgate\b/i, "gate"], [/node/i, "nodejs"], [/django/i, "django"], [/dynamic programming/i, "dynamic-programming"],
  [/calculus/i, "calculus"], [/linear algebra/i, "linear-algebra"], [/thermodynamics/i, "thermodynamics"], [/anatomy/i, "anatomy"],
  [/physiology/i, "physiology"], [/accounting/i, "accounting"], [/economics/i, "economics"], [/figma/i, "figma"],
];

/** Not courses: shorts, podcasts, vlogs, livestream dumps, news, motivation, interviews. */
const NOT_A_COURSE =
  /(shorts|podcast|vlog|live ?streams?|livestream|motivation|interview experience|announcement|reaction|unboxing|meme|news|trailer|promo|webinar|q ?& ?a|ask me|career advice|myth|placement update|viral|tips|events?|guest|talks?\b|seminar|highlights|clips|playlist of playlists|all videos|uploads|mock interview|story|stories|giveaway|contest|hackathon|doubt|faq|chapter \d+|discussion|career|assignment|previous year|question papers?|mentorship|challenge)/i;

function classify(title: string, defaultCategory?: string) {
  const topic = TOPICS.find((t) => t.re.test(title));
  if (topic) {
    const tags = new Set(topic.tags);
    for (const [re, tag] of LANG_TAGS) if (re.test(title)) tags.add(tag);
    return { category: topic.category, tags: [...tags].slice(0, 8) };
  }
  if (defaultCategory) {
    const tag = defaultCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return { category: defaultCategory, tags: [tag] };
  }
  return null;
}

function level(title: string): ImportedCourse["level"] {
  if (/advanced|expert|deep dive|internals/i.test(title)) return "ADVANCED";
  if (/beginner|basics|introduction|intro\b|zero|from scratch|for everyone|fundamentals|complete course|full course|101/i.test(title)) return "BEGINNER";
  return "ALL";
}

export function cleanTitle(raw: string, provider: string, strip?: RegExp): string {
  let t = raw;
  if (strip) t = t.replace(strip, "");
  t = t.replace(/#\w+/g, "").replace(/\s*\|\s*\|/g, " |");
  // Stanford writes "CS224N ... I Spring 2024 I Professor X": a capital I used as a separator.
  t = t.replace(/\s+I\s+(?=(Spring|Fall|Autumn|Winter|Summer|(19|20)\d{2}|Prof|[A-Z][a-z]+ [A-Z][a-z]+))/g, " | ");
  // "DP Playlist | Interview Questions | Recursion | C++ | ..." keeps its first meaningful part.
  if (t.length > 50 && t.includes("|") && t.split("|")[0].trim().length >= 12) t = t.split("|")[0];
  return t
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F000}-\u{1F2FF}]/gu, "")
    .replace(new RegExp(`\\s*[|\\-–:]\\s*${provider.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "")
    .replace(/\s*\|\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 120);
}

function cleanDescription(raw: string): string {
  return raw
    .replace(/https?:\/\/\S+/g, "")
    .replace(/#[\w-]+/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/(subscribe|follow (us|me)|instagram|telegram|discord|whatsapp|join|sponsor|affiliate|use code|coupon|enroll now|link in)/i.test(l))
    .join("\n")
    .slice(0, 1500)
    .trim();
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

function pickPlaylists(src: CourseSource, all: YtPlaylist[]): YtPlaylist[] {
  const min = src.minVideos ?? 6;
  const explicit = all.filter((p) => src.playlists?.includes(p.id));
  const matched = all
    .filter((p) => !src.playlists?.includes(p.id))
    .filter((p) => p.videoCount >= min && p.videoCount <= 600)
    .filter((p) => !NOT_A_COURSE.test(p.title) && !src.exclude?.test(p.title))
    .filter((p) => (src.include ? src.include.test(p.title) : true) && classify(p.title, src.category))
    // Interview-question lists are courses only for DSA practice.
    .filter((p) => !/interview/i.test(p.title) || classify(p.title, src.category)?.category === "Computer Science")
    // Full courses first: more lectures, capped so one 600-video dump does not always win.
    .sort((a, b) => Math.min(b.videoCount, 120) - Math.min(a.videoCount, 120));
  const extra = (src.playlists ?? []).filter((id) => !all.some((p) => p.id === id)).map((id) => ({ id, title: "", videoCount: 0 }));
  return [...explicit, ...extra, ...dedupeEditions(matched)].slice(0, Math.max(src.maxCourses ?? 10, explicit.length + extra.length));
}

const COURSE_CODE = /\b(CS ?\d{3}[A-Z]?|EE ?\d{3}|6\.\d{3,4}J?|18\.\d{2,3}J?|15-?\d{3})\b/i;
const year = (t: string) => Math.max(0, ...[...t.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0])));

/** One playlist per course: several semesters of CS224N or 15-445 collapse to the newest (Andrew Ng's CS229 wins its tie). */
export function dedupeEditions<T extends { title: string; videoCount: number }>(lists: T[]): T[] {
  const best = new Map<string, T>();
  for (const p of lists) {
    const code = p.title.match(COURSE_CODE)?.[1]?.replace(/\s|-/g, "").toUpperCase();
    const key =
      code ??
      p.title
        .toLowerCase()
        .replace(/\b(fall|spring|summer|winter|autumn|iap|january)\b|\b(19|20)\d{2}\b/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    const cur = best.get(key);
    const rank = (x: T) => (/andrew ng/i.test(x.title) ? 1e5 : 0) + year(x.title) * 10 + Math.min(x.videoCount, 99) / 100;
    if (!cur || rank(p) > rank(cur)) best.set(key, p);
  }
  return lists.filter((p) => [...best.values()].includes(p));
}

async function importSource(src: CourseSource): Promise<ImportedCourse[]> {
  const all = await channelPlaylists(src.handle, 500);
  const picked = pickPlaylists(src, all);
  console.log(`${src.key}: ${all.length} playlists, ${picked.length} picked`);
  const courses: ImportedCourse[] = [];
  for (const p of picked) {
    try {
      const pl = await playlistVideos(p.id, 600);
      const rawTitle = pl.title || p.title;
      const meta = classify(rawTitle, src.category) ?? { category: src.category ?? "Computer Science", tags: [src.category ? src.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "computer-science"] };
      // Shorts are not lectures.
      const long = pl.videos.filter((v) => v.durationSec >= 90);
      // Embeddable videos play in our player; ones whose owner disabled embedding stay as "Watch on YouTube" lectures.
      const checked = await pool(long, 12, async (v) => {
        const status = await videoStatus(v.videoId);
        return status === "gone" ? null : status === "external" ? { ...v, external: true } : v;
      });
      const lectures = checked.filter((v): v is YtVideo => v !== null);
      if (lectures.length < (src.minVideos ?? 6) && !src.playlists?.includes(p.id)) {
        console.log(`  skip ${rawTitle}: ${lectures.length} usable videos`);
        continue;
      }
      const title = cleanTitle(rawTitle, src.name, src.stripTitle);
      courses.push({
        source: src.key,
        kind: src.kind,
        provider: src.name,
        playlistId: p.id,
        title,
        description: cleanDescription(pl.description),
        category: meta.category,
        tags: meta.tags,
        language: /hindi/i.test(rawTitle) ? "Hindi" : src.language,
        level: level(rawTitle),
        license: src.license ?? null,
        lectures,
      });
      const ext = lectures.filter((l) => l.external).length;
      console.log(`  + ${title} [${meta.category}] ${lectures.length}/${pl.videos.length}${ext ? ` (${ext} open on YouTube)` : ""}`);
    } catch (err) {
      console.warn(`  ! ${p.title || p.id}: ${err instanceof Error ? err.message : err}`);
    }
  }
  return courses;
}

async function dryRun(targets: CourseSource[]) {
  await pool(targets, 6, async (src) => {
    try {
      const picked = pickPlaylists(src, await channelPlaylists(src.handle, 500));
      console.log(`\n${src.key} (${src.kind})\n${picked.map((p) => `  ${p.videoCount}\t${classify(p.title, src.category)?.category ?? "?"}\t${p.title}`).join("\n")}`);
    } catch (err) {
      console.log(`\n${src.key} FAILED ${err instanceof Error ? err.message : err}`);
    }
  });
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const only = args.find((a) => !a.startsWith("--"))?.split(",").filter(Boolean);
  if (args.includes("--dry")) {
    await dryRun(only ? SOURCES.filter((s) => only.includes(s.key)) : SOURCES);
    process.exit(0);
  }
  const previous: ImportedCourse[] = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")).courses : [];
  const targets = only ? SOURCES.filter((s) => only.includes(s.key)) : SOURCES;
  const kept = previous.filter((c) => !targets.some((t) => t.key === c.source));
  const fresh: ImportedCourse[] = [];
  for (const src of targets) {
    try {
      fresh.push(...(await importSource(src)));
    } catch (err) {
      console.warn(`SKIPPED ${src.key}: ${err instanceof Error ? err.message : err}`);
      fresh.push(...previous.filter((c) => c.source === src.key)); // keep the last good import
    }
  }
  const seen = new Set<string>();
  const courses = [...kept, ...fresh].filter((c) => !seen.has(c.playlistId) && seen.add(c.playlistId));
  writeFileSync(OUT, `${JSON.stringify({ fetchedAt: new Date().toISOString(), courses }, null, 1)}\n`);
  console.log(`wrote ${OUT}: ${courses.length} courses, ${courses.reduce((a, c) => a + c.lectures.length, 0)} lectures`);
}
