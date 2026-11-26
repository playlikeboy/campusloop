/**
 * Pure scoring for scripts/articles/audit-articles.ts: near-duplicate
 * detection (word shingles + Jaccard), same-keyword cannibalisation and the
 * keep / improve / merge / noindex buckets. No I/O, so it is unit tested.
 */

import { articlePlainText } from "./text";

export type TriageInput = {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  /** Rows in article_links. */
  linkCount: number;
  publishedAt?: Date | string | null;
  /** Bing impressions for this URL in the stats window, if known. */
  impressions?: number;
  clicks?: number;
};

export type Bucket = "keep" | "improve" | "merge" | "noindex";

export type TriageRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  wordCount: number;
  hasDirectAnswer: boolean;
  sourceLinks: number;
  impressions: number;
  clicks: number;
  primaryKeyword: string;
  duplicateOf: string | null;
  duplicateScore: number;
  /** True when the near-duplicate shares a template but not a topic. */
  templated: boolean;
  cannibalisedBy: string | null;
  bucket: Bucket;
  mergeTarget: string | null;
  reasons: string[];
};

export const THRESHOLDS = {
  /** Jaccard on 3-word shingles at or above this is a near-duplicate. */
  duplicate: 0.5,
  /** Below this many words the article is thin. */
  thinWords: 400,
  /** At or above this many words the article is long enough to keep. */
  keepWords: 900,
  /** Bing impressions that prove the page already earns search demand. */
  provenImpressions: 20,
  /**
   * Title word overlap needed before a near-duplicate is merged. Below it the
   * pages share a template but cover different things (IIT JAM Geology vs
   * Economics), so they are flagged to improve instead of redirected.
   */
  sameTopicTitle: 0.75,
  /** Shingles shared by more than this many articles are boilerplate and ignored. */
  commonShingleDocs: 40,
} as const;

/** Categories where a page with no sources is a your-money-or-your-life risk. */
const YMYL_CATEGORIES = new Set(["HEALTH", "FINANCE"]);

const STOPWORDS = new Set(
  (
    "a an and are as at be by for from how in into is it its of on or the to with your you what why when which who " +
    "vs versus guide complete students student india indian 2025 2026 2027 2028 rule rules first full actually " +
    "that this these those than then their there do does did can will should explained explain best top step steps"
  ).split(" ")
);

export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Title plus the first 300 words of body text: what readers and crawlers see first. */
export function leadText(title: string, content: string, words = 300): string {
  const body = articlePlainText(content).split(/\s+/).slice(0, words).join(" ");
  return `${title} ${body}`;
}

export function shingles(text: string, size = 3): Set<string> {
  const words = normalizeWords(text);
  const out = new Set<string>();
  for (let i = 0; i + size <= words.length; i++) out.add(words.slice(i, i + size).join(" "));
  return out;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  let inter = 0;
  for (const s of small) if (big.has(s)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Crude stem so "scholarships" and "scholarship" group together. */
function stem(word: string): string {
  return word.length > 4 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
}

/**
 * Primary keyword: the first three meaningful title words before any colon,
 * stemmed and sorted, so word order does not split a group.
 */
export function primaryKeyword(title: string): string {
  const head = title.split(/[:|–—(]/)[0];
  const words = normalizeWords(head)
    .filter((w) => !STOPWORDS.has(w) && !/^\d+$/.test(w))
    .map(stem);
  return [...new Set(words.slice(0, 3))].sort().join(" ");
}

/** All meaningful words of the title before any colon: the topic it names. */
export function headKey(title: string): string {
  const head = title.split(/[:|–—(]/)[0];
  return [...new Set(normalizeWords(head).filter((w) => !STOPWORDS.has(w)).map(stem))].sort().join(" ");
}

/** Jaccard on the meaningful title words. */
export function titleSimilarity(a: string, b: string): number {
  const words = (t: string) => new Set(normalizeWords(t).filter((w) => !STOPWORDS.has(w)).map(stem));
  return jaccard(words(a), words(b));
}

export function hasDirectAnswer(content: string): boolean {
  const lead = content.slice(0, 2500).toLowerCase();
  return /direct answer|short answer|quick answer|in short[:,]|tl;dr/.test(lead);
}

/** External http(s) links in the Markdown body (not to campusloop.space). */
export function countOutboundLinks(content: string): number {
  const urls = content.match(/\]\((https?:\/\/[^)\s]+)\)|<(https?:\/\/[^>\s]+)>/g) ?? [];
  return urls.filter((u) => !/campusloop\.space/i.test(u)).length;
}

export function wordCount(content: string): number {
  return articlePlainText(content).split(/\s+/).filter(Boolean).length;
}

/** Ranks two articles for "which one survives a merge". Higher is better. */
function strength(r: Pick<TriageRow, "impressions" | "clicks" | "wordCount" | "sourceLinks" | "hasDirectAnswer">): number {
  return (
    r.clicks * 1_000_000 +
    r.impressions * 1_000 +
    Math.min(r.sourceLinks, 10) * 50 +
    (r.hasDirectAnswer ? 100 : 0) +
    Math.min(r.wordCount, 4000) / 10
  );
}

/**
 * Near-duplicate pairs via an inverted shingle index, so 6,000 articles do
 * not need 18 million full comparisons. Returns pairs with Jaccard ≥ threshold.
 */
export function findNearDuplicates(
  docs: { slug: string; shingles: Set<string> }[],
  threshold: number = THRESHOLDS.duplicate
): { a: string; b: string; score: number }[] {
  const index = new Map<string, number[]>();
  docs.forEach((d, i) => {
    for (const s of d.shingles) {
      const list = index.get(s);
      if (list) list.push(i);
      else index.set(s, [i]);
    }
  });

  const pairs: { a: string; b: string; score: number }[] = [];
  docs.forEach((d, i) => {
    const shared = new Map<number, number>();
    for (const s of d.shingles) {
      const list = index.get(s)!;
      if (list.length > THRESHOLDS.commonShingleDocs) continue;
      for (const j of list) if (j > i) shared.set(j, (shared.get(j) ?? 0) + 1);
    }
    for (const [j, count] of shared) {
      const other = docs[j];
      // Cheap pre-filter on rare shared shingles before the exact Jaccard.
      const bound = count / Math.max(d.shingles.size, other.shingles.size, 1);
      if (bound < threshold * 0.5) continue;
      const score = jaccard(d.shingles, other.shingles);
      if (score >= threshold) pairs.push({ a: d.slug, b: other.slug, score });
    }
  });
  return pairs;
}

export function triageArticles(inputs: TriageInput[]): TriageRow[] {
  const rows: TriageRow[] = inputs.map((a) => {
    const outbound = countOutboundLinks(a.content);
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      category: a.category,
      wordCount: wordCount(a.content),
      hasDirectAnswer: hasDirectAnswer(a.content),
      sourceLinks: a.linkCount + outbound,
      impressions: a.impressions ?? 0,
      clicks: a.clicks ?? 0,
      primaryKeyword: primaryKeyword(a.title),
      duplicateOf: null,
      duplicateScore: 0,
      templated: false,
      cannibalisedBy: null,
      bucket: "improve",
      mergeTarget: null,
      reasons: [],
    };
  });
  const bySlug = new Map(rows.map((r) => [r.slug, r]));

  // 1. Near-duplicates: union-find into clusters, the strongest member survives.
  const parent = new Map(rows.map((r) => [r.slug, r.slug]));
  const find = (s: string): string => {
    let p = parent.get(s)!;
    while (p !== parent.get(p)) p = parent.get(p)!;
    parent.set(s, p);
    return p;
  };
  const docs = inputs.map((a) => ({ slug: a.slug, shingles: shingles(leadText(a.title, a.content)) }));
  const bestScore = new Map<string, number>();
  for (const { a, b, score } of findNearDuplicates(docs)) {
    parent.set(find(a), find(b));
    bestScore.set(a, Math.max(bestScore.get(a) ?? 0, score));
    bestScore.set(b, Math.max(bestScore.get(b) ?? 0, score));
  }
  const clusters = new Map<string, TriageRow[]>();
  for (const r of rows) {
    if (!bestScore.has(r.slug)) continue;
    const root = find(r.slug);
    clusters.set(root, [...(clusters.get(root) ?? []), r]);
  }
  for (const members of clusters.values()) {
    if (members.length < 2) continue;
    const winner = [...members].sort((x, y) => strength(y) - strength(x))[0];
    for (const m of members) {
      if (m === winner) continue;
      m.duplicateOf = winner.slug;
      m.duplicateScore = Math.round((bestScore.get(m.slug) ?? 0) * 100) / 100;
      m.templated =
        headKey(m.title) !== headKey(winner.title) || titleSimilarity(m.title, winner.title) < THRESHOLDS.sameTopicTitle;
    }
  }

  // 2. Cannibalisation: same primary keyword, not already a duplicate.
  const groups = new Map<string, TriageRow[]>();
  for (const r of rows) {
    if (!r.primaryKeyword || r.primaryKeyword.split(" ").length < 2) continue;
    groups.set(r.primaryKeyword, [...(groups.get(r.primaryKeyword) ?? []), r]);
  }
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    const winner = [...members].sort((x, y) => strength(y) - strength(x))[0];
    for (const m of members) if (m !== winner && !m.duplicateOf) m.cannibalisedBy = winner.slug;
  }

  // 3. Buckets.
  for (const r of rows) {
    const proven = r.impressions >= THRESHOLDS.provenImpressions || r.clicks > 0;
    if (r.duplicateOf && !r.templated && bySlug.has(r.duplicateOf)) {
      r.bucket = "merge";
      r.mergeTarget = r.duplicateOf;
      r.reasons.push(`near-duplicate of ${r.duplicateOf} (${r.duplicateScore})`);
      continue;
    }
    if (!proven && r.wordCount < THRESHOLDS.thinWords) {
      r.bucket = "noindex";
      r.reasons.push(`thin (${r.wordCount} words)`);
      continue;
    }
    if (!proven && YMYL_CATEGORIES.has(r.category) && r.sourceLinks === 0) {
      r.bucket = "noindex";
      r.reasons.push("health/finance topic with no sources");
      continue;
    }
    const strong =
      r.wordCount >= THRESHOLDS.keepWords &&
      r.hasDirectAnswer &&
      r.sourceLinks >= 2 &&
      !r.cannibalisedBy &&
      !r.templated;
    if (strong || proven) {
      r.bucket = "keep";
      r.reasons.push(proven ? `earns Bing impressions (${r.impressions})` : "long, direct answer, sourced, unique");
      continue;
    }
    r.bucket = "improve";
    if (r.wordCount < THRESHOLDS.keepWords) r.reasons.push(`short (${r.wordCount} words)`);
    if (!r.hasDirectAnswer) r.reasons.push("no direct-answer lead");
    if (r.sourceLinks < 2) r.reasons.push(`only ${r.sourceLinks} source link(s)`);
    if (r.cannibalisedBy) r.reasons.push(`same keyword as ${r.cannibalisedBy}`);
    if (r.templated) r.reasons.push(`same template as ${r.duplicateOf} (${r.duplicateScore}); needs unique content`);
  }
  // A merge must never point at a page that is itself dropped from the index.
  for (const r of rows) {
    if (r.bucket === "merge" && r.mergeTarget && bySlug.get(r.mergeTarget)?.bucket === "noindex") {
      r.bucket = "noindex";
      r.mergeTarget = null;
      r.reasons.push("merge target is also thin");
    }
  }
  return rows;
}

export function bucketCounts(rows: TriageRow[]): Record<Bucket, number> {
  const counts: Record<Bucket, number> = { keep: 0, improve: 0, merge: 0, noindex: 0 };
  for (const r of rows) counts[r.bucket]++;
  return counts;
}

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: TriageRow[]): string {
  const header = [
    "bucket",
    "slug",
    "merge_target",
    "title",
    "category",
    "word_count",
    "direct_answer",
    "source_links",
    "bing_impressions",
    "bing_clicks",
    "primary_keyword",
    "duplicate_of",
    "duplicate_score",
    "cannibalised_by",
    "reasons",
  ];
  const lines = rows.map((r) =>
    [
      r.bucket,
      r.slug,
      r.mergeTarget,
      r.title,
      r.category,
      r.wordCount,
      r.hasDirectAnswer ? "yes" : "no",
      r.sourceLinks,
      r.impressions,
      r.clicks,
      r.primaryKeyword,
      r.duplicateOf,
      r.duplicateScore || "",
      r.cannibalisedBy,
      r.reasons.join("; "),
    ]
      .map(csvCell)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n") + "\n";
}
