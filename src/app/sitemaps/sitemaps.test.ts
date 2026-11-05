import { describe, expect, it } from "vitest";
import robots from "../robots";
import { GET as sitemapIndex } from "../sitemap.xml/route";
import { GET as academics } from "./academics.xml/route";
import { GET as articles } from "./articles.xml/route";
import { GET as colleges } from "./colleges.xml/route";
import { GET as communities } from "./communities.xml/route";
import { GET as events } from "./events.xml/route";
import { GET as posts } from "./posts.xml/route";
import { GET as statics } from "./static.xml/route";

const SITEMAPS = { academics, articles, colleges, communities, events, posts, static: statics };

describe("sitemap index (sitemap.xml)", () => {
  it("lists only public, indexable sitemaps", async () => {
    const xml = await (await sitemapIndex()).text();
    expect(xml).toContain("<sitemapindex");
    for (const name of Object.keys(SITEMAPS)) {
      expect(xml).toContain(`<loc>https://campusloop.space/sitemaps/${name}.xml</loc>`);
    }
    // Profiles are noindex, comments inherit their post, /reels redirects to the feed.
    expect(xml).not.toContain("profiles.xml");
    expect(xml).not.toContain("comments.xml");
    expect(xml).not.toContain("reels.xml");
  });
});

describe("sitemap URL hygiene", () => {
  for (const [name, handler] of Object.entries(SITEMAPS)) {
    // Large tables (academics) take several seconds against the real database.
    it(`${name}.xml never emits a legacy /app/ URL and stays well-formed`, { timeout: 30_000 }, async () => {
      const res = await handler();
      expect(res.status).toBe(200);
      const xml = await res.text();
      expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
      expect(xml).toContain("</urlset>");
      expect(xml).not.toContain(".space/app");
      expect(xml).not.toMatch(/<loc>[^<]*\/app\//);
      // Private / noindex surfaces must never be submitted for indexing.
      for (const blocked of ["/feeds", "/confessions", "/saved", "/notifications", "/settings", "/chat", "/@"]) {
        expect(xml).not.toContain(`<loc>https://campusloop.space${blocked}`);
      }
      const urlCount = (xml.match(/<url>/g) ?? []).length;
      expect(urlCount).toBeLessThanOrEqual(50_000);
    });
  }
});

describe("robots.txt", () => {
  it("disallows private routes, has no redundant Allow rules, and points at the sitemap index", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = Array.isArray(rules.disallow) ? rules.disallow : [rules.disallow];
    for (const path of ["/feeds", "/chat", "/notifications", "/settings", "/saved", "/admin", "/api/", "/app/", "/@", "/confessions"]) {
      expect(disallow).toContain(path);
    }
    expect(rules.allow).toBeUndefined();
    expect(result.sitemap).toBe("https://campusloop.space/sitemap.xml");
  });
});
