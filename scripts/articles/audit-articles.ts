/**
 * Article SEO triage for campusloop.space. REPORT ONLY unless --apply.
 *
 * Scores every PUBLISHED article on word count, a "Direct answer" lead,
 * source links (article_links + outbound Markdown links), near-duplicates
 * (Jaccard on 3-word shingles of title + first 300 words), same-keyword
 * cannibalisation and Bing impressions per URL (GetPageStats), then buckets
 * each into keep / improve / merge (-> target slug) / noindex.
 *
 * Writes a CSV plus a summary to --out (default: article-audit.csv in the
 * current directory) and prints the counts.
 *
 * Read-only by default: only SELECTs. With --apply it writes
 * articles.seo_status and articles.redirect_to_slug (needs
 * drizzle/manual/0018_articles_seo.sql applied first). Run --apply only after
 * the report has been reviewed.
 *
 * Bing key: BING_WEBMASTER_API_KEY env var, or ~/.campusloop-bing/api-key.
 * Missing key = impressions are treated as 0.
 *
 * Run: bun run scripts/articles/audit-articles.ts [--out path.csv] [--apply]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import { bucketCounts, type TriageInput, toCsv, triageArticles } from "../../src/lib/articles/triage";

dotenv.config();

const SITE = "https://campusloop.space/";
const BING_API = "https://ssl.bing.com/webmaster/api.svc/json";
const APPLY = process.argv.includes("--apply");

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const OUT = resolve(argValue("--out") || "article-audit.csv");

function bingKey(): string | null {
  const fromEnv = process.env.BING_WEBMASTER_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const file = join(homedir(), ".campusloop-bing", "api-key");
  return existsSync(file) ? readFileSync(file, "utf8").trim() : null;
}

/** Bing impressions and clicks per article slug, summed over the stats window. */
async function bingPageStats(): Promise<Map<string, { impressions: number; clicks: number }>> {
  const out = new Map<string, { impressions: number; clicks: number }>();
  const key = bingKey();
  if (!key) {
    console.warn("No Bing key: impressions treated as 0.");
    return out;
  }
  try {
    const qs = new URLSearchParams({ siteUrl: SITE, apikey: key });
    const res = await fetch(`${BING_API}/GetPageStats?${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
    const rows = ((await res.json()) as { d: { Query: string; Impressions: number; Clicks: number }[] }).d ?? [];
    for (const row of rows) {
      const m = /\/articles\/([^/?#]+)/.exec(row.Query || "");
      if (!m) continue;
      const slug = decodeURIComponent(m[1]);
      const cur = out.get(slug) ?? { impressions: 0, clicks: 0 };
      cur.impressions += Number(row.Impressions) || 0;
      cur.clicks += Number(row.Clicks) || 0;
      out.set(slug, cur);
    }
    console.log(`Bing GetPageStats: ${rows.length} rows, ${out.size} article URLs with data.`);
  } catch (error) {
    console.warn("Bing GetPageStats failed, impressions treated as 0:", error);
  }
  return out;
}

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  published_at: string | null;
  link_count: number;
};

async function main() {
  const connectionString = process.env.DB_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing DB_URL or DATABASE_URL");
  const sql = neon(connectionString);

  const [articleRows, bing] = await Promise.all([
    sql`
      SELECT a.id, a.slug, a.title, a.content, a.category, a.published_at,
             (SELECT count(*)::int FROM article_links l WHERE l.article_id = a.id) AS link_count
      FROM articles a
      WHERE a.status = 'PUBLISHED'
      ORDER BY a.published_at ASC NULLS LAST
    `,
    bingPageStats(),
  ]);
  const articles = articleRows as unknown as ArticleRow[];
  console.log(`Loaded ${articles.length} published articles.`);

  const inputs: TriageInput[] = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    content: a.content,
    category: a.category,
    linkCount: Number(a.link_count) || 0,
    publishedAt: a.published_at,
    impressions: bing.get(a.slug)?.impressions ?? 0,
    clicks: bing.get(a.slug)?.clicks ?? 0,
  }));

  const started = Date.now();
  const rows = triageArticles(inputs);
  const counts = bucketCounts(rows);
  console.log(`Scored in ${((Date.now() - started) / 1000).toFixed(1)}s.`);

  const byCategory = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const c = byCategory.get(r.category) ?? { keep: 0, improve: 0, merge: 0, noindex: 0 };
    c[r.bucket]++;
    byCategory.set(r.category, c);
  }

  const summary = [
    `Article SEO triage, ${new Date().toISOString()}`,
    `Published articles: ${rows.length}`,
    `keep: ${counts.keep}`,
    `improve: ${counts.improve}`,
    `merge: ${counts.merge}`,
    `noindex: ${counts.noindex}`,
    `With Bing impressions: ${rows.filter((r) => r.impressions > 0).length}`,
    `No direct-answer lead: ${rows.filter((r) => !r.hasDirectAnswer).length}`,
    `Fewer than 2 source links: ${rows.filter((r) => r.sourceLinks < 2).length}`,
    `Same-keyword (cannibalised) pages: ${rows.filter((r) => r.cannibalisedBy).length}`,
    "",
    "By category (keep / improve / merge / noindex):",
    ...[...byCategory.entries()]
      .sort((a, b) => b[1].keep + b[1].improve + b[1].merge + b[1].noindex - (a[1].keep + a[1].improve + a[1].merge + a[1].noindex))
      .map(([cat, c]) => `  ${cat}: ${c.keep} / ${c.improve} / ${c.merge} / ${c.noindex}`),
  ].join("\n");

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, toCsv(rows));
  const summaryPath = OUT.replace(/\.csv$/i, "") + "-summary.txt";
  writeFileSync(summaryPath, `${summary}\n`);
  console.log(`\n${summary}\n\nCSV: ${OUT}\nSummary: ${summaryPath}`);

  if (!APPLY) {
    console.log("\nReport only. Nothing was written to the database. Re-run with --apply after review.");
    return;
  }

  // --apply: one statement per bucket, in batches, so the run is short and repeatable.
  console.log("\n--apply: writing seo_status and redirect_to_slug ...");
  const noindexIds = rows.filter((r) => r.bucket === "noindex").map((r) => r.id);
  const indexIds = rows.filter((r) => r.bucket === "keep" || r.bucket === "improve").map((r) => r.id);
  const merges = rows.filter((r) => r.bucket === "merge" && r.mergeTarget);

  for (let i = 0; i < indexIds.length; i += 500) {
    const ids = indexIds.slice(i, i + 500);
    await sql`UPDATE articles SET seo_status = 'index', redirect_to_slug = NULL WHERE id = ANY(${ids})`;
  }
  for (let i = 0; i < noindexIds.length; i += 500) {
    const ids = noindexIds.slice(i, i + 500);
    await sql`UPDATE articles SET seo_status = 'noindex', redirect_to_slug = NULL WHERE id = ANY(${ids})`;
  }
  for (const r of merges) {
    await sql`UPDATE articles SET seo_status = 'noindex', redirect_to_slug = ${r.mergeTarget} WHERE id = ${r.id}`;
  }
  console.log(`Applied: ${indexIds.length} index, ${noindexIds.length} noindex, ${merges.length} redirects.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
