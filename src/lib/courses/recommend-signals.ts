/**
 * Pure (DB-free) parts of course personalisation: turning a student's profile,
 * searches, interests and learning history into weighted categories and
 * keywords, and scoring courses against them. See recommend.ts for retrieval.
 */

export interface SignalInput {
  branch?: string | null;
  course?: string | null; // degree, e.g. "B.Tech", "MBBS", "BBA LLB"
  interests?: string[];
  affinity?: string[]; // top Redis interest tags (from views, enrolments, posts)
  searches?: string[]; // newest first
  enrolled?: { id: string; category: string; tags: string[] }[];
  viewed?: { id: string; category: string; tags: string[] }[]; // newest first
}

export interface Signals {
  categories: Map<string, number>;
  keywords: Map<string, number>;
  exclude: Set<string>;
  reason: { search?: string; field?: string; viewed?: boolean };
}

/** Degree or branch text -> course categories. Order matters only for readability. */
const FIELD_MAP: [RegExp, string[]][] = [
  [/\b(cse|cs|computer|information tech|\bit\b|software|bca|mca|ai ?(&|and)? ?ml|data science)/i, ["Computer Science", "Programming", "Databases", "Artificial Intelligence", "Web Development"]],
  [/\b(ece|electronics|communication engineering|vlsi|embedded|etc)\b/i, ["Electronics & Communication", "Electrical Engineering", "Programming"]],
  [/\b(eee|electrical)\b/i, ["Electrical Engineering", "Electronics & Communication"]],
  [/\b(mech|mechanical|automobile|production|aero(space|nautical)?)\b/i, ["Mechanical Engineering", "Mathematics"]],
  [/\b(civil|construction|structural)\b/i, ["Civil Engineering", "Mathematics"]],
  [/\bchemical\b/i, ["Chemical Engineering", "Chemistry"]],
  [/\b(biotech|bio ?technology|biomedical)\b/i, ["Biotechnology", "Biology"]],
  [/\b(mbbs|medicine|medical|bds|dental|md|bams|bhms)\b/i, ["Medicine", "Biology"]],
  [/\bpharm/i, ["Pharmacy", "Chemistry"]],
  [/\b(nursing|physio|paramedical|allied health|bpt)\b/i, ["Nursing & Allied Health", "Biology"]],
  [/\b(mba|bba|bms|management|pgdm)\b/i, ["Business", "Marketing", "Finance & Accounting", "Entrepreneurship"]],
  [/\b(b\.? ?com|commerce|\bca\b|chartered|accounting|finance|cfa|cma)\b/i, ["Finance & Accounting", "Economics", "Business"]],
  [/\becon/i, ["Economics", "Finance & Accounting"]],
  [/\b(law|llb|ballb|llm)\b/i, ["Law & Policy"]],
  [/\bpsych/i, ["Psychology"]],
  [/\b(b\.? ?a|arts|humanities|english|history|political|sociology|philosophy|literature)\b/i, ["Humanities", "Social Sciences", "Languages"]],
  [/\b(design|nift|nid|fashion|ux|ui|animation)\b/i, ["Design"]],
  [/\b(b\.? ?arch|architecture)\b/i, ["Architecture", "Design"]],
  [/\b(journalism|mass comm|media|bjmc)\b/i, ["Media & Communication"]],
  [/\bphysics\b/i, ["Physics", "Mathematics"]],
  [/\bchemistry\b/i, ["Chemistry"]],
  [/\b(biology|zoology|botany|microbio)/i, ["Biology"]],
  [/\b(math|statistics)/i, ["Mathematics", "Data Science"]],
];

const STOP = new Set(["the", "and", "for", "with", "course", "courses", "free", "full", "tutorial", "tutorials", "learn", "how", "what", "in", "of", "to", "a", "hindi", "english", "lecture", "lectures", "playlist", "complete", "best", "notes"]);

export function fieldCategories(text: string): string[] {
  const out: string[] = [];
  for (const [re, cats] of FIELD_MAP) if (re.test(text)) for (const c of cats) if (!out.includes(c)) out.push(c);
  return out;
}

export function keywordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((w) => (w.length >= 3 || ["c", "c++", "os", "cn", "ai", "ml", "r"].includes(w)) && !STOP.has(w));
}

const bump = (m: Map<string, number>, k: string, w: number) => m.set(k, (m.get(k) ?? 0) + w);

export function buildSignals(input: SignalInput): Signals {
  const categories = new Map<string, number>();
  const keywords = new Map<string, number>();
  const reason: Signals["reason"] = {};

  const field = [input.branch, input.course].filter(Boolean).join(" ");
  const fieldCats = fieldCategories(field);
  fieldCats.forEach((c, i) => bump(categories, c, 3 - i * 0.3));
  if (fieldCats.length && input.branch) reason.field = input.branch;

  // Searches are the strongest intent signal; newer ones count more.
  (input.searches ?? []).slice(0, 8).forEach((q, i) => {
    const w = 5 * 0.8 ** i;
    for (const k of keywordsOf(q)) bump(keywords, k, w);
    for (const c of fieldCategories(q)) bump(categories, c, w * 0.4);
    if (i === 0 && keywordsOf(q).length) reason.search = q;
  });

  for (const t of [...(input.interests ?? []), ...(input.affinity ?? [])]) {
    for (const k of keywordsOf(t)) bump(keywords, k, 1.5);
    for (const c of fieldCategories(t)) bump(categories, c, 1);
  }

  (input.viewed ?? []).slice(0, 10).forEach((c, i) => {
    bump(categories, c.category, 2 * 0.85 ** i);
    for (const t of c.tags) bump(keywords, t.toLowerCase(), 0.8 * 0.85 ** i);
    reason.viewed = true;
  });
  for (const c of input.enrolled ?? []) {
    bump(categories, c.category, 1.5);
    for (const t of c.tags) bump(keywords, t.toLowerCase(), 0.6);
  }

  return { categories, keywords, exclude: new Set((input.enrolled ?? []).map((c) => c.id)), reason };
}

export interface ScorableCourse {
  id: string;
  title: string;
  subtitle: string | null;
  category: string;
  tags: string[];
  provider: string | null;
  rankBoost: number;
  enrollCount: number;
  trendScore: number;
}

/** Stable per-day jitter so the slot changes daily without reshuffling on every scroll. */
function jitter(id: string, day: number): number {
  let h = day;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function scoreCourse(c: ScorableCourse, s: Signals, day = Math.floor(Date.now() / 86_400_000)): number {
  const title = c.title.toLowerCase();
  const sub = (c.subtitle ?? "").toLowerCase();
  const tags = c.tags.map((t) => t.toLowerCase());
  let relevance = s.categories.get(c.category) ?? 0;
  for (const [k, w] of s.keywords) {
    if (title.includes(k)) relevance += w * 1.5;
    else if (tags.includes(k)) relevance += w;
    else if (sub.includes(k)) relevance += w * 0.4;
  }
  const quality = c.rankBoost * 1.5 + Math.log1p(c.enrollCount) * 0.5 + c.trendScore * 0.2;
  return relevance * 2 + quality + jitter(c.id, day) * 0.6;
}

/** Highest scores first, at most `perProvider` from one provider so one channel cannot fill the slot. */
export function rankDiverse<T extends ScorableCourse>(courses: T[], s: Signals, limit: number, perProvider = 2): T[] {
  const scored = courses
    .filter((c) => !s.exclude.has(c.id))
    .map((c) => ({ c, score: scoreCourse(c, s) }))
    .sort((a, b) => b.score - a.score);
  const count = new Map<string, number>();
  const out: T[] = [];
  for (const { c } of scored) {
    const p = c.provider ?? c.id;
    if ((count.get(p) ?? 0) >= perProvider) continue;
    count.set(p, (count.get(p) ?? 0) + 1);
    out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}

export function slotTitle(s: Signals): string {
  if (s.reason.search) return `Because you searched "${s.reason.search}"`;
  if (s.reason.field) return `Courses for ${s.reason.field} students`;
  if (s.reason.viewed) return "Based on courses you viewed";
  return "Free courses picked for you";
}
