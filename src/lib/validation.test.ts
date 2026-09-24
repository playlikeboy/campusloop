import { describe, expect, it } from "vitest";
import { parseCreatePostPayload } from "./validation";

describe("parseCreatePostPayload", () => {
  it("normalizes a valid post payload", () => {
    expect(
      parseCreatePostPayload({
        body: "  Campus fest starts tomorrow.  ",
        type: "POLL",
        scope: "CAMPUS",
        isAnonymous: true,
        title: "  Fest update  ",
        options: [" CSE ", "ECE", " "],
        communityId: " community-1 ",
      }),
    ).toEqual({
      isValid: true,
      data: {
        body: "Campus fest starts tomorrow.",
        type: "POLL",
        scope: "CAMPUS",
        isAnonymous: true,
        title: "Fest update",
        options: ["CSE", "ECE"],
        communityId: "community-1",
      },
    });
  });

  it("rejects malformed runtime types instead of throwing", () => {
    expect(parseCreatePostPayload({ body: 123 })).toEqual({
      isValid: false,
      error: "Post body is required.",
    });
    expect(parseCreatePostPayload(null).isValid).toBe(false);
    expect(parseCreatePostPayload({ body: "hello", isAnonymous: "true" }).isValid).toBe(false);
  });

  it("rejects oversized content and invalid enums", () => {
    expect(parseCreatePostPayload({ body: "x".repeat(20_001) }).isValid).toBe(false);
    expect(parseCreatePostPayload({ body: "hello", type: "ADMIN" }).isValid).toBe(false);
    expect(parseCreatePostPayload({ body: "hello", scope: "INDIA" }).isValid).toBe(false);
  });

  it("caps poll options and individual option length", () => {
    expect(
      parseCreatePostPayload({
        body: "Pick one",
        type: "POLL",
        options: Array.from({ length: 11 }, (_, i) => String(i)),
      }).isValid,
    ).toBe(false);

    expect(
      parseCreatePostPayload({
        body: "Pick one",
        type: "POLL",
        options: ["x".repeat(101)],
      }).isValid,
    ).toBe(false);
  });
});
