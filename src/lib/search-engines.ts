/**
 * Search Engine Indexing & Ping Utilities
 * Supports IndexNow (IndexNow Central + Bing Direct) and Sitemaps Ping (Google + Bing)
 */

export interface PingResult {
  engine: string;
  endpoint: string;
  status: number | "error";
  ok: boolean;
  message?: string;
}

export const INDEXNOW_KEY = "ff35ddf54af340798feb9034fcd9d317";
export const CANONICAL_HOST = "campusloop.space";
export const KEY_LOCATION = `https://${CANONICAL_HOST}/${INDEXNOW_KEY}.txt`;

/**
 * Pings IndexNow endpoints (IndexNow Central + Bing) with the provided URLs.
 * IndexNow distributes across participating search engines (Bing, Yandex, Naver, Seznam).
 */
export async function pingIndexNow(urls: string[]): Promise<PingResult[]> {
  if (!urls || urls.length === 0) return [];

  // Clean and filter valid HTTPS URLs
  const cleanUrls = urls
    .map((u) => u.trim())
    .filter((u) => u.startsWith(`https://${CANONICAL_HOST}`));

  if (cleanUrls.length === 0) return [];

  const batchUrls = cleanUrls.slice(0, 10000);
  const payload = {
    host: CANONICAL_HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: batchUrls,
  };

  const results: PingResult[] = [];

  // 1. IndexNow Central API
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    results.push({
      engine: "IndexNow (Central)",
      endpoint: "https://api.indexnow.org/indexnow",
      status: res.status,
      ok: res.ok || res.status === 200 || res.status === 202,
    });
  } catch (err) {
    results.push({
      engine: "IndexNow (Central)",
      endpoint: "https://api.indexnow.org/indexnow",
      status: "error",
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  // 2. Bing IndexNow Direct API
  try {
    const res = await fetch("https://www.bing.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    results.push({
      engine: "Bing (IndexNow)",
      endpoint: "https://www.bing.com/indexnow",
      status: res.status,
      ok: res.ok || res.status === 200 || res.status === 202,
    });
  } catch (err) {
    results.push({
      engine: "Bing (IndexNow)",
      endpoint: "https://www.bing.com/indexnow",
      status: "error",
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}

/**
 * Pings Google and Bing with the primary sitemap index.
 */
export async function pingSitemaps(customSitemapUrl?: string): Promise<PingResult[]> {
  const sitemapUrl = customSitemapUrl || `https://${CANONICAL_HOST}/sitemap.xml`;
  const targets = [
    {
      engine: "Google Sitemap Ping",
      url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    },
    {
      engine: "Bing Sitemap Ping",
      url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    },
  ];

  const results: PingResult[] = [];
  for (const t of targets) {
    try {
      const res = await fetch(t.url, { method: "GET" });
      results.push({
        engine: t.engine,
        endpoint: t.url,
        status: res.status,
        ok: res.ok || res.status < 400,
      });
    } catch (err) {
      results.push({
        engine: t.engine,
        endpoint: t.url,
        status: "error",
        ok: false,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}

/**
 * Comprehensive ping notifying all major search engines (IndexNow + Bing + Google Sitemaps).
 */
export async function notifySearchEngines(urls: string[]) {
  const [indexNowResults, sitemapResults] = await Promise.all([
    pingIndexNow(urls),
    pingSitemaps(),
  ]);
  return [...indexNowResults, ...sitemapResults];
}
