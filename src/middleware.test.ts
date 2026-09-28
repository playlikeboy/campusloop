import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./middleware";

describe("routing middleware", () => {
  it("redirects legacy /app to the feed at /feeds", async () => {
    const req = new NextRequest("https://campusloop.space/app", { headers: { host: "campusloop.space" } });
    const res = await middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://campusloop.space/feeds");
  });

  it("redirects legacy /app/discover to /discover without rewriting clean routes", async () => {
    const req = new NextRequest("https://campusloop.space/app/discover?tab=trending", {
      headers: { host: "campusloop.space" },
    });
    const res = await middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://campusloop.space/discover?tab=trending");
  });

  it("redirects legacy /app/post/123 to /post/123", async () => {
    const req = new NextRequest("https://campusloop.space/app/post/123", {
      headers: { host: "campusloop.space" },
    });
    const res = await middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://campusloop.space/post/123");
  });

  it("keeps the landing page canonical", async () => {
    const req = new NextRequest("https://campusloop.space/", { headers: { host: "campusloop.space" } });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("keeps /feeds canonical with no internal /app rewrite", async () => {
    const req = new NextRequest("https://campusloop.space/feeds", { headers: { host: "campusloop.space" } });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("keeps /chat canonical", async () => {
    const req = new NextRequest("https://campusloop.space/chat", { headers: { host: "campusloop.space" } });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
