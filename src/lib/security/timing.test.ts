import { describe, expect, it } from "vitest";
import { timingSafeCompare } from "./timing";

describe("timingSafeCompare", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeCompare("secret_token_123", "secret_token_123")).toBe(true);
    expect(timingSafeCompare("a", "a")).toBe(true);
  });

  it("returns false for different strings of same length", () => {
    expect(timingSafeCompare("secret_token_123", "secret_token_124")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(timingSafeCompare("short", "longer_string")).toBe(false);
    expect(timingSafeCompare("longer_string", "short")).toBe(false);
  });

  it("returns false for null, undefined, or empty strings", () => {
    expect(timingSafeCompare("", "")).toBe(false);
    expect(timingSafeCompare(null, "secret")).toBe(false);
    expect(timingSafeCompare("secret", undefined)).toBe(false);
    expect(timingSafeCompare(undefined, undefined)).toBe(false);
  });
});
