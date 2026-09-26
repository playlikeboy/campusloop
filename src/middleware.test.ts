import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

describe("Domain matching & routing middleware", () => {
  it("redirects campusloop.space/app to https://campsy.app/", () => {
    const req = new NextRequest("https://campusloop.space/app", {
      headers: { host: "campusloop.space" },
    });
    const res = middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://campsy.app/");
  });

  it("redirects campusloop.space/app/discover to https://campsy.app/discover", () => {
    const req = new NextRequest("https://campusloop.space/app/discover?tab=trending", {
      headers: { host: "campusloop.space" },
    });
    const res = middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://campsy.app/discover?tab=trending");
  });

  it("redirects campusloop.space/app/post/123 to https://campsy.app/post/123", () => {
    const req = new NextRequest("https://campusloop.space/app/post/123", {
      headers: { host: "campusloop.space" },
    });
    const res = middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://campsy.app/post/123");
  });

  it("leaves campusloop.space landing page untouched", () => {
    const req = new NextRequest("https://campusloop.space/", {
      headers: { host: "campusloop.space" },
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("leaves campusloop.space/about untouched", () => {
    const req = new NextRequest("https://campusloop.space/about", {
      headers: { host: "campusloop.space" },
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects campsy.app/app to https://campsy.app/", () => {
    const req = new NextRequest("https://campsy.app/app", {
      headers: { host: "campsy.app" },
    });
    const res = middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://campsy.app/");
  });

  it("redirects campsy.app/app/dating to https://campsy.app/dating", () => {
    const req = new NextRequest("https://campsy.app/app/dating", {
      headers: { host: "campsy.app" },
    });
    const res = middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://campsy.app/dating");
  });

  it("redirects campsy.app/feed to https://campsy.app/", () => {
    const req = new NextRequest("https://campsy.app/feed", {
      headers: { host: "campsy.app" },
    });
    const res = middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://campsy.app/");
  });

  it("rewrites campsy.app/ to /app internally", () => {
    const req = new NextRequest("https://campsy.app/", {
      headers: { host: "campsy.app" },
    });
    const res = middleware(req);
    expect(res.headers.get("x-middleware-rewrite")).toBe("https://campsy.app/app");
  });

  it("rewrites campsy.app/discover to /app/discover internally", () => {
    const req = new NextRequest("https://campsy.app/discover", {
      headers: { host: "campsy.app" },
    });
    const res = middleware(req);
    expect(res.headers.get("x-middleware-rewrite")).toBe("https://campsy.app/app/discover");
  });

  it("does not rewrite exempt /api routes on campsy.app", () => {
    const req = new NextRequest("https://campsy.app/api/feed", {
      headers: { host: "campsy.app" },
    });
    const res = middleware(req);
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("does not rewrite exempt /handler auth routes on campsy.app", () => {
    const req = new NextRequest("https://campsy.app/handler/sign-in", {
      headers: { host: "campsy.app" },
    });
    const res = middleware(req);
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("redirects campsy.app/chats to https://campsy.app/chat", () => {
    const req = new NextRequest("https://campsy.app/chats", {
      headers: { host: "campsy.app" },
    });
    const res = middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://campsy.app/chat");
  });

  it("rewrites campsy.app/colleges to /app/colleges internally", () => {
    const req = new NextRequest("https://campsy.app/colleges", {
      headers: { host: "campsy.app" },
    });
    const res = middleware(req);
    expect(res.headers.get("x-middleware-rewrite")).toBe("https://campsy.app/app/colleges");
  });

  it("rewrites campsy.app/college/iit-delhi to /app/college/iit-delhi internally", () => {
    const req = new NextRequest("https://campsy.app/college/iit-delhi", {
      headers: { host: "campsy.app" },
    });
    const res = middleware(req);
    expect(res.headers.get("x-middleware-rewrite")).toBe("https://campsy.app/app/college/iit-delhi");
  });

  it("rewrites campsy.app/chat to /app/chat internally", () => {
    const req = new NextRequest("https://campsy.app/chat", {
      headers: { host: "campsy.app" },
    });
    const res = middleware(req);
    expect(res.headers.get("x-middleware-rewrite")).toBe("https://campsy.app/app/chat");
  });
});

