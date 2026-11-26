import { after } from "next/server";
import { SITE_URL } from "@/lib/seo/constants";

const ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Tell IndexNow (Bing, Yandex, Seznam, Naver, Yep) that public pages are new or
 * changed, so they are crawled in minutes instead of waiting for the sitemap.
 * Runs after the response is sent and never throws. A no-op without INDEXNOW_KEY,
 * outside production, or for paths that robots.txt blocks.
 *
 * @param paths site-relative paths, e.g. "/articles/my-slug"
 */
export function pingIndexNow(paths: string[]): void {
  const key = process.env.INDEXNOW_KEY;
  if (!key || process.env.NODE_ENV !== "production" || paths.length === 0) return;

  const host = new URL(SITE_URL).host;
  const urlList = [...new Set(paths)].map((p) => new URL(p, SITE_URL).toString());

  const send = async () => {
    try {
      await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host, key, keyLocation: `${SITE_URL}/${key}.txt`, urlList }),
      });
    } catch {
      // Best effort: the sitemap still lists the page.
    }
  };

  try {
    after(send);
  } catch {
    // Outside a request scope (scripts, tests): fire and forget.
    void send();
  }
}
