/**
 * Query-string paging helpers shared by list endpoints.
 *
 * Convention: `?limit=<n>` (clamped to [1, max]) and `?before=<ISO date>` for
 * createdAt-descending cursors. Callers that return a bare array keep doing so;
 * callers that return an object may add `hasMore` and `nextCursor` (the
 * createdAt of the last row, to pass back as `before`).
 */

export function parseLimit(searchParams: URLSearchParams, defaultLimit: number, max: number): number {
  const raw = Number(searchParams.get("limit"));
  if (!Number.isFinite(raw) || raw <= 0) return defaultLimit;
  return Math.min(Math.floor(raw), max);
}

/** Returns a valid Date from `?before=`, or null when absent or unparseable. */
export function parseBefore(searchParams: URLSearchParams): Date | null {
  const raw = searchParams.get("before");
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Splits a `limit + 1` fetch into the page and a `hasMore` flag, and derives
 * the `before` cursor for the next request from the last row's createdAt.
 */
export function pageOf<T extends { createdAt: Date | string }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor = hasMore && last ? new Date(last.createdAt).toISOString() : null;
  return { page, hasMore, nextCursor };
}
