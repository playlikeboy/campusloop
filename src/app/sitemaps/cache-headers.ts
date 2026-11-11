export const SITEMAP_CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

/**
 * Applies the shared CDN cache policy to a sitemap response.
 * A short-lived fallback (s-maxage under an hour, set by `sitemapFromQuery` when
 * its query fails) keeps its own header so crawlers retry soon.
 */
export function withSitemapCache(res: Response): Response {
  const sMaxAge = Number(/s-maxage=(\d+)/.exec(res.headers.get("Cache-Control") ?? "")?.[1] ?? NaN);
  if (!Number.isNaN(sMaxAge) && sMaxAge < 3600) return res;
  res.headers.set("Cache-Control", SITEMAP_CACHE_CONTROL);
  return res;
}
