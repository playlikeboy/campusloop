/**
 * Pure (DB-free) parts of course personalisation: turning a student's profile,
 * searches, interests and learning history into weighted categories and
 * keywords, and scoring courses against them. See recommend.ts for retrieval.
 */

export interface SignalInput {
  branch?: string | null;
  course?: string | null; // degree, e.g. "B.Tech", "MBBS", "BBA LLB"
  semester?: number | null;
  academicSubjects?: string[]; // syllabus subjects or saved academic resources
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
  reason: { search?: string; field?: string; viewed?: boolean; academicSubject?: string };
  targetDomain?: string;
}

/** Academic domains to isolate recommendations and prevent cross-discipline contamination. */
export const DOMAIN_MAP: Record<string, string> = {
  // Computing
  "Computer Science": "computing",
  "Programming": "computing",
  "Web Development": "computing",
  "Mobile Development": "computing",
  "Artificial Intelligence": "computing",
  "Data Science": "computing",
  "Databases": "computing",
  "Cybersecurity": "computing",
  "System Design": "computing",
  "DevOps & Cloud": "computing",
  "Game Development": "computing",

  // Engineering
  "Electronics & Communication": "engineering",
  "Electrical Engineering": "engineering",
  "Mechanical Engineering": "engineering",
  "Civil Engineering": "engineering",
  "Chemical Engineering": "engineering",
  "Biotechnology": "engineering",

  // Sciences & Mathematics
  "Mathematics": "sciences",
  "Physics": "sciences",
  "Chemistry": "sciences",
  "Biology": "sciences",

  // Health
  "Medicine": "health",
  "Pharmacy": "health",
  "Nursing & Allied Health": "health",

  // Business & Commerce
  "Business": "business",
  "Finance & Accounting": "business",
  "Economics": "business",
  "Marketing": "business",
  "Entrepreneurship": "business",

  // Humanities & Law
  "Law & Policy": "humanities_law",
  "Psychology": "humanities_law",
  "Humanities": "humanities_law",
  "Social Sciences": "humanities_law",
  "Languages": "humanities_law",

  // Creative
  "Design": "creative",
  "Architecture": "creative",
  "Media & Communication": "creative",
  "Music & Arts": "creative",

  // Career & General
  "Exam Prep": "career",
  "Career Skills": "career",
  "Personal Development": "career",
  "General": "career",
};

export function domainOf(category: string): string {
  return DOMAIN_MAP[category] ?? "general";
}

/** Degree, branch, or specific subject text -> course categories. */
const FIELD_MAP: [RegExp, string[]][] = [
  // Subject & topic keywords (specific terms first)
  [/\b(dbms|database|sql|mysql|postgres|mongodb|rdbms|normali[sz]ation)\b/i, ["Databases", "Computer Science"]],
  [/\b(dsa|data structures?|algorithms?|leetcode|dynamic programming|graph theory|binary search|sorting)\b/i, ["Computer Science", "Programming"]],
  [/\b(operating systems?|\bos\b|linux|unix|kernel|shell scripting)\b/i, ["Computer Science"]],
  [/\b(computer networks?|networking|\bcn\b|tcp|udp|osi model)\b/i, ["Computer Science"]],
  [/\b(compiler( design)?|\btoc\b|automata|theory of computation)\b/i, ["Computer Science"]],
  [/\b(computer (organi[sz]ation|architecture)|\bcoa\b)\b/i, ["Computer Science"]],
  [/\b(system design|distributed systems?|microservices?|low level design|lld|hld)\b/i, ["System Design", "Computer Science"]],
  [/\b(web ?dev|react|next\.?js|javascript|typescript|node(\.?js)?|frontend|backend|full ?stack|html|css)\b/i, ["Web Development", "Programming"]],
  [/\b(machine learning|deep learning|\bai\b|neural network|nlp|computer vision|llms?|data science)\b/i, ["Artificial Intelligence", "Data Science"]],
  [/\b(cyber ?security|ethical hacking|cryptography|infosec)\b/i, ["Cybersecurity", "Computer Science"]],
  [/\b(oops?|object oriented|java|c\+\+|python|golang|rust)\b/i, ["Programming", "Computer Science"]],
  [/\b(analog electronics|digital electronics|op-?amps?|signals and systems|vlsi|embedded|microprocessors?|8085|8086)\b/i, ["Electronics & Communication", "Electrical Engineering"]],
  [/\b(network theory|circuit analysis|circuit theory|electrical machines?|power systems?|control systems?)\b/i, ["Electrical Engineering", "Electronics & Communication"]],
  [/\b(thermodynamics|fluid mechanics|\bsom\b|strength of materials|theory of machines|heat transfer|engineering mechanics)\b/i, ["Mechanical Engineering"]],
  [/\b(structural analysis|surveying|geotechnical|soil mechanics|\brcc\b|concrete technology)\b/i, ["Civil Engineering"]],
  [/\b(calculus|linear algebra|differential equations|discrete math(ematics)?|laplace|fourier|engineering mathematics)\b/i, ["Mathematics"]],
  [/\b(accounting|financial accounting|cost accounting|corporate finance|taxation|gst|income tax|auditing|balance sheet)\b/i, ["Finance & Accounting"]],
  [/\b(microeconomics|macroeconomics|econometrics|indian economy)\b/i, ["Economics"]],
  [/\b(marketing|digital marketing|branding|seo|advertising)\b/i, ["Marketing"]],
  [/\b(principles of management|organi[sz]ational behaviou?r|human resource|\bhrm\b|business studies|operations management|\bmba\b)\b/i, ["Business"]],
  [/\b(startup|startups|venture capital|entrepreneurship|founder)\b/i, ["Entrepreneurship"]],
  [/\b(anatomy|physiology|biochemistry|pathology|pharmacology|microbiology|surgery|mbbs)\b/i, ["Medicine"]],
  [/\b(constitution(al)? law|contract law|criminal law|\bipc\b|\bbns\b|\bclat\b|jurisprudence)\b/i, ["Law & Policy"]],
  [/\b(figma|ui ?\/? ?ux|ux design|graphic design|typography)\b/i, ["Design"]],

  // Degree & Branch patterns
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
  let targetDomain: string | undefined;

  const field = [input.branch, input.course].filter(Boolean).join(" ");
  const fieldCats = fieldCategories(field);
  fieldCats.forEach((c, i) => bump(categories, c, 3 - i * 0.3));
  if (fieldCats.length && input.branch) {
    reason.field = input.branch;
    targetDomain = domainOf(fieldCats[0]);
  }

  // Academic subjects from student's syllabus or saved notes in /academics have strong syllabus intent
  (input.academicSubjects ?? []).slice(0, 5).forEach((sub, i) => {
    const w = 6 * 0.85 ** i;
    for (const k of keywordsOf(sub)) bump(keywords, k, w);
    const subCats = fieldCategories(sub);
    for (const c of subCats) bump(categories, c, w);
    if (i === 0) {
      reason.academicSubject = sub;
      if (subCats.length) targetDomain = domainOf(subCats[0]);
    }
  });

  // Searches are the strongest immediate intent signal; newer ones count most.
  (input.searches ?? []).slice(0, 8).forEach((q, i) => {
    const w = 7 * 0.8 ** i;
    for (const k of keywordsOf(q)) bump(keywords, k, w);
    const searchCats = fieldCategories(q);
    for (const c of searchCats) bump(categories, c, w * 0.8);
    if (i === 0 && (keywordsOf(q).length || searchCats.length)) {
      reason.search = q;
      if (searchCats.length) targetDomain = domainOf(searchCats[0]);
    }
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

  return { categories, keywords, exclude: new Set((input.enrolled ?? []).map((c) => c.id)), reason, targetDomain };
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
  const courseDomain = domainOf(c.category);
  // Domain isolation: When a specific academic domain is targeted (e.g. Computing when searching DBMS),
  // courses from conflicting domains (e.g. Business, Health, Humanities) are heavily penalized to prevent
  // cross-discipline contamination.
  if (s.targetDomain && s.targetDomain !== "general" && s.targetDomain !== "career") {
    if (courseDomain !== s.targetDomain && courseDomain !== "general" && courseDomain !== "career") {
      // Sciences (like maths) can cross into computing/engineering, but business/health/humanities cannot cross into computing!
      const allowedCross = (s.targetDomain === "computing" || s.targetDomain === "engineering") && courseDomain === "sciences";
      if (!allowedCross) {
        return -100; // Strong rejection for domain mismatch
      }
    }
  }

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
    .filter(({ score }) => !s.targetDomain || score > 0)
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
  if (s.reason.academicSubject) return `Courses for your ${s.reason.academicSubject} syllabus`;
  if (s.reason.field) return `Courses for ${s.reason.field} students`;
  if (s.reason.viewed) return "Based on courses you viewed";
  return "Free courses picked for you";
}
