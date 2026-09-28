import { describe, expect, it } from "vitest";
import { cleanSnippet } from "@/lib/utils";

describe("comment-seo-permalink", () => {
  it("generates correct Dev.to-style Title format for verified students", () => {
    const commentAuthor = "Arjun Mehta";
    const postTitle = "Hostel 4 LAN Wi-Fi issues during midsems";
    const title = `"${commentAuthor} on ${postTitle}" | CampusLoop`;

    expect(title).toBe(`"Arjun Mehta on Hostel 4 LAN Wi-Fi issues during midsems" | CampusLoop`);
  });

  it("generates correct Dev.to-style Title format for anonymous comments", () => {
    const isAnonymous = true;
    const pseudonym = "SneakyFalcon";
    const authorDisplayName = "Rohan Sharma";
    const commentAuthor = isAnonymous ? (pseudonym || "Anonymous Student") : authorDisplayName;
    const postTitle = "IIT Bombay Campus Fest 2026";
    const title = `"${commentAuthor} on ${postTitle}" | CampusLoop`;

    expect(title).toBe(`"SneakyFalcon on IIT Bombay Campus Fest 2026" | CampusLoop`);
  });

  it("falls back to clean snippet when post does not have an explicit title", () => {
    const commentAuthor = "Priya Rao";
    const post = {
      title: null,
      body: "Does anyone have the previous year question papers for Data Structures CS201 with Professor Roy?",
    };
    const postTitle = post.title?.trim() || cleanSnippet(post.body, 60) || "Campus Discussion";
    const title = `"${commentAuthor} on ${postTitle}" | CampusLoop`;

    expect(title).toContain("Priya Rao on Does anyone have the previous year question papers for");
    expect(title).toContain("| CampusLoop");
  });

  it("generates clean comment description limited to 160 characters without raw markdown", () => {
    const longCommentMarkdown = `
# Absolutely agree!
Here is the **exact solution** to this problem. Make sure to run \`chmod +x setup.sh\` and check your proxy settings.
![Diagram](https://example.com/network-diagram.png)
You should also check the student affairs notice board for more details regarding router maintenance schedules.
`.trim();

    const description = cleanSnippet(longCommentMarkdown, 157).slice(0, 160);

    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).not.toContain("#");
    expect(description).not.toContain("**");
    expect(description).not.toContain("![Diagram]");
    expect(description).toContain("Here is the exact solution");
  });

  it("formats canonical URL and copy link format correctly", () => {
    const postId = "post_101abc";
    const commentId = "cmt_202xyz";
    const canonicalUrl = `https://campusloop.space/post/${postId}/comment/${commentId}`;

    expect(canonicalUrl).toBe("https://campusloop.space/post/post_101abc/comment/cmt_202xyz");
  });

  it("constructs valid Schema.org JSON-LD with Comment and parent DiscussionForumPosting", () => {
    const postId = "post_303def";
    const commentId = "cmt_404ghi";
    const commentAuthor = "Vikram Aditya";
    const postTitle = "Semester 5 Electives Guide";

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Comment",
      "@id": `https://campusloop.space/post/${postId}/comment/${commentId}`,
      url: `https://campusloop.space/post/${postId}/comment/${commentId}`,
      datePublished: "2026-09-29T00:00:00.000Z",
      text: "Machine Learning with Prof. Roy is the highest rated elective!",
      author: {
        "@type": "Person",
        name: commentAuthor,
        url: "https://campusloop.space/@vikram",
      },
      parentItem: {
        "@type": "DiscussionForumPosting",
        "@id": `https://campusloop.space/post/${postId}`,
        url: `https://campusloop.space/post/${postId}`,
        headline: postTitle,
        text: "Which electives should I choose for 5th semester Computer Science?",
        datePublished: "2026-09-28T12:00:00.000Z",
        author: {
          "@type": "Person",
          name: "Anonymous Student",
        },
        publisher: {
          "@type": "Organization",
          name: "CampusLoop",
          url: "https://campusloop.space",
        },
      },
    };

    expect(jsonLd["@type"]).toBe("Comment");
    expect(jsonLd.parentItem["@type"]).toBe("DiscussionForumPosting");
    expect(jsonLd["@id"]).toBe("https://campusloop.space/post/post_303def/comment/cmt_404ghi");
    expect(jsonLd.parentItem["@id"]).toBe("https://campusloop.space/post/post_303def");
    expect(jsonLd.author.name).toBe("Vikram Aditya");
  });

  it("formats sitemap xml URL entry conforming to sitemaps.org schema", () => {
    const item = {
      id: "cmt_999",
      postId: "post_888",
      createdAt: new Date("2026-09-29T00:00:00.000Z"),
      updatedAt: new Date("2026-09-29T00:05:00.000Z"),
    };

    const loc = `https://campusloop.space/post/${item.postId}/comment/${item.id}`;
    const lastmod = item.updatedAt.toISOString();
    const entry = `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;

    expect(entry).toContain("<loc>https://campusloop.space/post/post_888/comment/cmt_999</loc>");
    expect(entry).toContain("<lastmod>2026-09-29T00:05:00.000Z</lastmod>");
    expect(entry).toContain("<priority>0.5</priority>");
  });
});
