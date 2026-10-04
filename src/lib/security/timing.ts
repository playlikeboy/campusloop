import { timingSafeEqual } from "node:crypto";

/**
 * Compares two strings in constant time to prevent side-channel timing attacks.
 * Returns true only if both strings are non-empty, identical in length, and identical in bytes.
 */
export function timingSafeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (!a || !b) return false;

  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  if (bufA.length !== bufB.length) return false;

  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
