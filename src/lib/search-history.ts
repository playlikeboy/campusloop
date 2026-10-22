import { getRedis } from "@/lib/redis";

/**
 * Recent searches per user, kept in Redis for 30 days (newest first, max 30).
 * Used to personalise feed slots such as course recommendations. Best-effort:
 * without Redis nothing is stored and callers get an empty list.
 */

const KEY = (profileId: string) => `user:${profileId}:searches`;

export function normaliseQuery(q: string): string {
  return q.toLowerCase().replace(/^[@#]/, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export async function rememberSearch(profileId: string, query: string): Promise<void> {
  const q = normaliseQuery(query);
  if (q.length < 3) return;
  try {
    const r = getRedis();
    if (!r) return;
    await r.zadd(KEY(profileId), { score: Date.now(), member: q });
    await r.zremrangebyrank(KEY(profileId), 0, -31);
    await r.expire(KEY(profileId), 60 * 60 * 24 * 30);
  } catch {
    // Search history is an enhancement; never fail the request.
  }
}

/** Newest first. Drops queries that are prefixes of a later one ("dbm" when "dbms" exists). */
export async function recentSearches(profileId: string, limit = 10): Promise<string[]> {
  try {
    const r = getRedis();
    if (!r) return [];
    const all = await r.zrange<string[]>(KEY(profileId), 0, 29, { rev: true });
    return collapsePrefixes(all).slice(0, limit);
  } catch {
    return [];
  }
}

export function collapsePrefixes(queries: string[]): string[] {
  return queries.filter((q, i) => !queries.some((o, j) => j !== i && o.length > q.length && o.startsWith(q)));
}
