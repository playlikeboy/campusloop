import { describe, expect, it } from "vitest";
import { sanitizeReturnTo } from "./auth-redirect";

describe("sanitizeReturnTo", () => {
  it("rejects undefined, null, and empty string", () => {
    expect(sanitizeReturnTo(undefined)).toBeNull();
    expect(sanitizeReturnTo(null)).toBeNull();
    expect(sanitizeReturnTo("")).toBeNull();
    expect(sanitizeReturnTo("   ")).toBeNull();
  });

  it("rejects loopback auth routes", () => {
    expect(sanitizeReturnTo("/handler/sign-in")).toBeNull();
    expect(sanitizeReturnTo("/handler/sign-up")).toBeNull();
    expect(sanitizeReturnTo("/handler")).toBeNull();
    expect(sanitizeReturnTo("/sign-in")).toBeNull();
    expect(sanitizeReturnTo("/sign-in/")).toBeNull();
    expect(sanitizeReturnTo("/sign-up")).toBeNull();
    expect(sanitizeReturnTo("/sign-out")).toBeNull();
    expect(sanitizeReturnTo("/login")).toBeNull();
    expect(sanitizeReturnTo("/register")).toBeNull();
    expect(sanitizeReturnTo("/invalid-email")).toBeNull();
    expect(sanitizeReturnTo("/api/auth/callback")).toBeNull();
  });

  it("rejects URL-encoded loopback routes", () => {
    expect(sanitizeReturnTo("%2Fhandler%2Fsign-in")).toBeNull();
    expect(sanitizeReturnTo("%252Fhandler%252Fsign-in")).toBeNull();
    expect(sanitizeReturnTo("%2Fsign-in")).toBeNull();
  });

  it("rejects external open redirects", () => {
    expect(sanitizeReturnTo("https://evil.com")).toBeNull();
    expect(sanitizeReturnTo("https://evil.com/phish")).toBeNull();
    expect(sanitizeReturnTo("//malicious.site")).toBeNull();
  });

  it("accepts and extracts path from valid campusloop URLs", () => {
    expect(sanitizeReturnTo("https://campusloop.space/feeds")).toBe("/feeds");
    expect(sanitizeReturnTo("https://campusloop.space/colleges/iit-bombay")).toBe("/colleges/iit-bombay");
    expect(sanitizeReturnTo("http://localhost:3000/dating")).toBe("/dating");
  });

  it("normalizes /app to /feeds", () => {
    expect(sanitizeReturnTo("/app")).toBe("/feeds");
    expect(sanitizeReturnTo("/app/")).toBe("/feeds");
    expect(sanitizeReturnTo("https://campusloop.space/app")).toBe("/feeds");
  });

  it("preserves valid relative paths and cleans nested loopback search params", () => {
    expect(sanitizeReturnTo("/feeds")).toBe("/feeds");
    expect(sanitizeReturnTo("/colleges/iit-bombay?tab=posts")).toBe("/colleges/iit-bombay?tab=posts");
    expect(sanitizeReturnTo("/explore?returnTo=/handler/sign-in")).toBe("/explore");
  });
});
