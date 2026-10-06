// In-memory rate limiting fallback cache for tests & zero-redis environments
export const analyticsRateLimitCache = new Map<string, number>();

export function clearAnalyticsRateLimits() {
  analyticsRateLimitCache.clear();
}
