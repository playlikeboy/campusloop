import { describe, expect, it } from "vitest";
import { isStandaloneEmbedLine, resolveArticleEmbed, standaloneUrl } from "./article-embeds";
import { extractHeadings } from "./headings";
import { parseSmartBlock } from "./smart-blocks";

const r = (u: string) => resolveArticleEmbed(u);

describe("article embeds", () => {
  it("resolves video providers, including start times and Shorts", () => {
    expect(r("https://youtu.be/3LPJfIKxwWc?t=90")?.src).toBe("https://www.youtube-nocookie.com/embed/3LPJfIKxwWc?rel=0&start=90");
    expect(r("https://www.youtube.com/watch?v=3LPJfIKxwWc&t=1m30s")?.src).toContain("start=90");
    expect(r("https://www.youtube.com/shorts/aqz-KE-bpKQ")?.aspect).toBeCloseTo(9 / 16);
    expect(r("https://www.youtube.com/playlist?list=PLhQjrBD2T383f9scHRNYJkior2VvYjpSL")?.src).toContain("videoseries");
    expect(r("https://vimeo.com/76979871")?.provider).toBe("Vimeo");
    expect(r("https://www.twitch.tv/videos/123456789")?.needsParent).toBe(true);
  });

  it("resolves social and code providers", () => {
    expect(r("https://x.com/OpenAI/status/1712345678901234567")?.src).toContain("platform.twitter.com/embed/Tweet.html?id=1712345678901234567");
    expect(r("https://www.reddit.com/r/learnprogramming/comments/abc123/how_to_start/")?.src).toContain("embed.reddit.com/r/learnprogramming/comments/abc123");
    expect(r("https://codepen.io/team/pen/AbCdEf")?.src).toContain("codepen.io/team/embed/AbCdEf");
    expect(r("https://gist.github.com/octocat/6cad326836d38bd3a7ae")?.kind).toBe("gist");
    expect(r("https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit")?.src).toMatch(/\/embed$/);
  });

  it("never passes arbitrary hosts into an iframe", () => {
    const plan = r("https://evil.example.com/page");
    expect(plan?.kind).toBe("card");
    expect(r("javascript:alert(1)")).toBeNull();
    expect(r("https://youtube.com.evil.com/watch?v=3LPJfIKxwWc")?.kind).toBe("card");
  });

  it("detects standalone links, including editor autolinks", () => {
    expect(standaloneUrl("[https://youtu.be/3LPJfIKxwWc](https://youtu.be/3LPJfIKxwWc)")).toBe("https://youtu.be/3LPJfIKxwWc");
    expect(isStandaloneEmbedLine("https://youtu.be/3LPJfIKxwWc")).toBe(true);
    expect(isStandaloneEmbedLine("see https://youtu.be/3LPJfIKxwWc")).toBe(false);
    expect(isStandaloneEmbedLine("https://example.com/blog")).toBe(false);
  });

  it("parses the embed smart block", () => {
    const b = parseSmartBlock("embed", "caption: Demo\nstart: 1:30\nhttps://youtu.be/3LPJfIKxwWc\nhttps://codepen.io/team/pen/AbCdEf");
    expect(b.ok && b.block.kind === "embed" && b.block.urls.length === 2 && b.block.start === 90).toBe(true);
  });
});

describe("headings", () => {
  it("builds unique ids and skips fenced code", () => {
    const h = extractHeadings("# Intro\n## Setup\n```md\n# not a heading\n```\n## Setup");
    expect(h.map((x) => x.id)).toEqual(["intro", "setup", "setup-1"]);
  });
});
