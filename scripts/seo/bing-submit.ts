/**
 * Bing Webmaster submit + health report for campusloop.space.
 *
 * What it does, in order:
 *   1. Resubmits every child sitemap (Bing only tracks the ones it was told about).
 *   2. Reads today's URL submission quota and submits that many URLs:
 *      new and recently changed URLs first (by <lastmod>), never the same URL twice in 7 days.
 *   3. Prints index, crawl and traffic numbers so the workflow log doubles as a report.
 *
 * Key: BING_WEBMASTER_API_KEY env var, or the file ~/.campusloop-bing/api-key.
 * Run: bun run scripts/seo/bing-submit.ts [--dry-run]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const SITE = "https://campusloop.space/";
const API = "https://ssl.bing.com/webmaster/api.svc/json";
const DRY_RUN = process.argv.includes("--dry-run");
const STATE_FILE = process.env.BING_STATE_FILE || join(homedir(), ".campusloop-bing", "submitted.json");
const RESUBMIT_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function apiKey(): string {
  const fromEnv = process.env.BING_WEBMASTER_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  const file = join(homedir(), ".campusloop-bing", "api-key");
  if (existsSync(file)) return readFileSync(file, "utf8").trim();
  throw new Error("Set BING_WEBMASTER_API_KEY or write the key to ~/.campusloop-bing/api-key");
}

const KEY = apiKey();

async function get<T>(method: string, params: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ ...params, apikey: KEY });
  const res = await fetch(`${API}/${method}?${qs}`);
  if (!res.ok) throw new Error(`${method} failed: HTTP ${res.status} ${await res.text()}`);
  return ((await res.json()) as { d: T }).d;
}

async function post(method: string, body: unknown): Promise<void> {
  if (DRY_RUN) return;
  const res = await fetch(`${API}/${method}?apikey=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} failed: HTTP ${res.status} ${await res.text()}`);
}

type Entry = { loc: string; lastmod: number };

async function fetchXml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "CampusLoop-Bing-Submit/1.0" } });
  if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);
  return res.text();
}

function parseEntries(xml: string): Entry[] {
  const out: Entry[] = [];
  for (const block of xml.split(/<url>|<sitemap>/).slice(1)) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim();
    if (!loc) continue;
    const lastmod = Date.parse(block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? "") || 0;
    out.push({ loc, lastmod });
  }
  return out;
}

function loadState(): Record<string, number> {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveState(state: Record<string, number>) {
  if (DRY_RUN) return;
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const pruned = Object.fromEntries(Object.entries(state).filter(([, t]) => t > cutoff));
  writeFileSync(STATE_FILE, JSON.stringify(pruned));
}

const bingDate = (s: string) => Number(s.match(/\d+/)?.[0] ?? 0);

async function main() {
  // 1. Sitemaps
  const children = parseEntries(await fetchXml(`${SITE}sitemap.xml`)).map((e) => e.loc);
  for (const feedUrl of [`${SITE}sitemap.xml`, ...children]) {
    await post("SubmitFeed", { siteUrl: SITE, feedUrl });
  }
  console.log(`Sitemaps submitted: ${children.length + 1}${DRY_RUN ? " (dry run)" : ""}`);

  // 2. URLs, newest first, within today's quota
  const quota = await get<{ DailyQuota: number; MonthlyQuota: number }>("GetUrlSubmissionQuota", {
    siteUrl: SITE,
  });
  const all: Entry[] = [];
  for (const child of children) {
    try {
      all.push(...parseEntries(await fetchXml(child)));
    } catch (err) {
      console.warn(`Skipped ${child}: ${(err as Error).message}`);
    }
  }
  const state = loadState();
  const now = Date.now();
  const due = all
    .filter((e) => !state[e.loc] || now - state[e.loc] > RESUBMIT_AFTER_MS)
    .sort((a, b) => b.lastmod - a.lastmod);
  const unique = [...new Map(due.map((e) => [e.loc, e])).values()];
  const batch = unique.slice(0, Math.min(quota.DailyQuota, quota.MonthlyQuota)).map((e) => e.loc);

  // SubmitUrlBatch takes at most 500 URLs per call; quota is far below that.
  if (batch.length > 0) {
    await post("SubmitUrlBatch", { siteUrl: SITE, urlList: batch });
    for (const u of batch) state[u] = now;
    saveState(state);
  }
  console.log(
    `URLs submitted: ${batch.length} of ${unique.length} due (quota ${quota.DailyQuota}/day, ${quota.MonthlyQuota}/month)`
  );

  // 3. Report
  const crawl = await get<
    { Date: string; InIndex: number; CrawledPages: number; Code5xx: number; Code4xx: number; BlockedByRobotsTxt: number }[]
  >("GetCrawlStats", { siteUrl: SITE });
  const last = crawl.at(-1);
  if (last) {
    console.log(
      `Index: ${last.InIndex} pages, crawled ${last.CrawledPages}, 4xx ${last.Code4xx}, 5xx ${last.Code5xx}, blocked by robots ${last.BlockedByRobotsTxt}`
    );
  }
  const traffic = await get<{ Date: string; Impressions: number; Clicks: number }[]>("GetRankAndTrafficStats", {
    siteUrl: SITE,
  });
  const recent = traffic.filter((t) => now - bingDate(t.Date) < 7 * 24 * 60 * 60 * 1000);
  console.log(
    `Last 7 days: ${recent.reduce((s, t) => s + t.Impressions, 0)} impressions, ${recent.reduce((s, t) => s + t.Clicks, 0)} clicks`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
