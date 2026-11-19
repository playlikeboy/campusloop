import "server-only";

import { eq } from "drizzle-orm";
import { platformSettings } from "@/db/schema";
import { IsolateCache } from "@/lib/isolate-cache";
import type { Db } from "./db-context";

/**
 * GA4 traffic for /admin/analytics.
 *
 * Live: when COMPOSIO_API_KEY and COMPOSIO_GA_ACCOUNT_ID are set, runs two
 * batchRunReports calls through Composio (GOOGLE_ANALYTICS_BATCH_RUN_REPORTS,
 * max 5 reports per call), cached 15 minutes, 8 s timeout.
 * Fallback: the last snapshot stored in platform_settings["ga4_snapshot"]
 * (written by scripts/analytics/store-ga4-snapshot.ts or the Refresh action).
 *
 * Row shapes (label first, then numbers):
 *   daily        [yyyymmdd, activeUsers, newUsers, sessions, screenPageViews, engagedSessions]
 *   channels / sources / countries / indiaDevices  [name, activeUsers, sessions]
 *   topPages     [pagePath, screenPageViews, activeUsers]
 *   indiaLanding [landingPage, sessions, activeUsers]
 *   events       [eventName, eventCount]
 *   botTraffic   [country, activeUsers] for desktop + Direct outside India (live only)
 */

export const GA4_PROPERTY = "properties/552908204";
export const GA4_SNAPSHOT_KEY = "ga4_snapshot";

type Row = [string, ...number[]];

export type Ga4Snapshot = {
  property?: string;
  fetchedAt: string;
  range?: string;
  totals: {
    activeUsers: number;
    newUsers: number;
    sessions: number;
    screenPageViews: number;
    engagementRate: number;
    avgSessionSec: number;
  };
  daily: Row[];
  channels?: Row[];
  sources?: Row[];
  countries?: Row[];
  topPages?: Row[];
  indiaLanding?: Row[];
  indiaDevices?: Row[];
  events?: Row[];
  botTraffic?: Row[];
  notes?: string;
};

export type Ga4Result = { snapshot: Ga4Snapshot | null; source: "live" | "snapshot" | "none"; error?: string };

export function ga4LiveConfigured(): boolean {
  return Boolean(process.env.COMPOSIO_API_KEY && process.env.COMPOSIO_GA_ACCOUNT_ID);
}

const liveCache = new IsolateCache<Ga4Snapshot>(15 * 60_000, 2);

export function clearGa4Cache() {
  liveCache.clear();
}

/* ───────────── stored snapshot ───────────── */

export async function readStoredSnapshot(db: Db): Promise<Ga4Snapshot | null> {
  const row = await db.query.platformSettings.findFirst({ where: eq(platformSettings.key, GA4_SNAPSHOT_KEY) });
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value) as Ga4Snapshot;
    return parsed?.totals && Array.isArray(parsed.daily) ? parsed : null;
  } catch {
    return null;
  }
}

export async function storeSnapshot(db: Db, snapshot: Ga4Snapshot): Promise<void> {
  const value = JSON.stringify(snapshot);
  await db
    .insert(platformSettings)
    .values({ key: GA4_SNAPSHOT_KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedAt: new Date() } });
}

/* ───────────── live via Composio ───────────── */

const range = [{ startDate: "30daysAgo", endDate: "today" }];
const india = { filter: { fieldName: "country", stringFilter: { value: "India" } } };
const m = (...names: string[]) => names.map((name) => ({ name }));
const d = (...names: string[]) => names.map((name) => ({ name }));
const byMetric = (name: string) => [{ metric: { metricName: name }, desc: true }];

const BATCH_A = [
  {
    dateRanges: range,
    dimensions: d("date"),
    metrics: m("activeUsers", "newUsers", "sessions", "screenPageViews", "engagedSessions"),
    orderBys: [{ dimension: { dimensionName: "date" } }],
  },
  {
    dateRanges: range,
    metrics: m("activeUsers", "newUsers", "sessions", "screenPageViews", "engagementRate", "averageSessionDuration"),
  },
  { dateRanges: range, dimensions: d("sessionDefaultChannelGroup"), metrics: m("activeUsers", "sessions"), orderBys: byMetric("activeUsers"), limit: 10 },
  { dateRanges: range, dimensions: d("sessionSource"), metrics: m("activeUsers", "sessions"), orderBys: byMetric("activeUsers"), limit: 10 },
  { dateRanges: range, dimensions: d("country"), metrics: m("activeUsers", "sessions"), orderBys: byMetric("activeUsers"), limit: 10 },
];

const BATCH_B = [
  { dateRanges: range, dimensions: d("pagePath"), metrics: m("screenPageViews", "activeUsers"), orderBys: byMetric("screenPageViews"), limit: 10 },
  { dateRanges: range, dimensions: d("landingPage"), metrics: m("sessions", "activeUsers"), dimensionFilter: india, orderBys: byMetric("sessions"), limit: 10 },
  { dateRanges: range, dimensions: d("deviceCategory"), metrics: m("activeUsers", "sessions"), dimensionFilter: india, orderBys: byMetric("activeUsers") },
  { dateRanges: range, dimensions: d("eventName"), metrics: m("eventCount"), orderBys: byMetric("eventCount"), limit: 25 },
  {
    dateRanges: range,
    dimensions: d("country"),
    metrics: m("activeUsers"),
    dimensionFilter: {
      andGroup: {
        expressions: [
          { filter: { fieldName: "deviceCategory", stringFilter: { value: "desktop" } } },
          { filter: { fieldName: "sessionDefaultChannelGroup", stringFilter: { value: "Direct" } } },
          { notExpression: india },
        ],
      },
    },
    orderBys: byMetric("activeUsers"),
    limit: 8,
  },
];

type GaReport = {
  rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[];
};

/** Composio wraps the GA response differently across versions; find the `reports` array wherever it sits. */
function findReports(data: unknown, depth = 0): GaReport[] | null {
  if (!data || typeof data !== "object" || depth > 4) return null;
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.reports)) return obj.reports as GaReport[];
  for (const value of Object.values(obj)) {
    const found = findReports(value, depth + 1);
    if (found) return found;
  }
  return null;
}

async function runBatch(requests: unknown[], signal: AbortSignal): Promise<GaReport[]> {
  const res = await fetch("https://backend.composio.dev/api/v3/tools/execute/GOOGLE_ANALYTICS_BATCH_RUN_REPORTS", {
    method: "POST",
    headers: { "x-api-key": process.env.COMPOSIO_API_KEY ?? "", "content-type": "application/json" },
    body: JSON.stringify({
      connected_account_id: process.env.COMPOSIO_GA_ACCOUNT_ID,
      arguments: { property: GA4_PROPERTY, requests },
    }),
    signal,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Composio HTTP ${res.status}`);
  const body = (await res.json()) as { successful?: boolean; error?: unknown; data?: unknown };
  if (body.successful === false) throw new Error(`Composio: ${String(body.error ?? "failed")}`.slice(0, 200));
  const reports = findReports(body.data);
  if (!reports) throw new Error("Composio: no reports in response");
  return reports;
}

function toRows(report: GaReport | undefined): Row[] {
  return (report?.rows ?? []).map((r) => [
    r.dimensionValues?.[0]?.value ?? "",
    ...(r.metricValues ?? []).map((v) => Number(v.value ?? 0) || 0),
  ]) as Row[];
}

export async function fetchLiveSnapshot(): Promise<Ga4Snapshot> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const [a, b] = await Promise.all([runBatch(BATCH_A, ctrl.signal), runBatch(BATCH_B, ctrl.signal)]);
    const t = toRows(a[1])[0] ?? ["", 0, 0, 0, 0, 0, 0];
    return {
      property: GA4_PROPERTY,
      fetchedAt: new Date().toISOString(),
      range: "last 30 days",
      totals: {
        activeUsers: t[1] ?? 0,
        newUsers: t[2] ?? 0,
        sessions: t[3] ?? 0,
        screenPageViews: t[4] ?? 0,
        engagementRate: t[5] ?? 0,
        avgSessionSec: Math.round((t[6] ?? 0) * 10) / 10,
      },
      daily: toRows(a[0]),
      channels: toRows(a[2]),
      sources: toRows(a[3]),
      countries: toRows(a[4]),
      topPages: toRows(b[0]),
      indiaLanding: toRows(b[1]),
      indiaDevices: toRows(b[2]),
      events: toRows(b[3]),
      botTraffic: toRows(b[4]),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Live (cached 15 min) when configured, else the stored snapshot. Never throws. */
export async function getGa4Traffic(db: Db): Promise<Ga4Result> {
  let liveError: string | undefined;
  if (ga4LiveConfigured()) {
    const hit = liveCache.get("live");
    if (hit) return { snapshot: hit, source: "live" };
    try {
      const live = await fetchLiveSnapshot();
      liveCache.set("live", live);
      return { snapshot: live, source: "live" };
    } catch (error) {
      liveError = error instanceof Error ? error.message : "GA4 fetch failed";
      console.error("[admin analytics] GA4 live fetch failed:", error);
    }
  }
  try {
    const stored = await readStoredSnapshot(db);
    return stored ? { snapshot: stored, source: "snapshot", error: liveError } : { snapshot: null, source: "none", error: liveError };
  } catch (error) {
    console.error("[admin analytics] GA4 snapshot read failed:", error);
    return { snapshot: null, source: "none", error: liveError ?? "Could not read stored snapshot" };
  }
}
