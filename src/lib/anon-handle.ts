import { eq } from "drizzle-orm";
import type { getDb } from "@/db";
import { anonIdentityVault } from "@/db/schema";
import { openSealedIdentity } from "@/lib/anonymity";

/**
 * True when `handle` is already sealed in the identity vault for a different
 * student. Anonymous posts are attributed through the vault (first writer wins,
 * `onConflictDoNothing`), so letting a second student claim a released or
 * derived handle would post under, and be revealed as, the first owner.
 * An unreadable vault entry counts as taken (fail closed).
 */
export async function isAnonHandleSealedToSomeoneElse(
  db: ReturnType<typeof getDb>,
  handle: string,
  profileId: string
): Promise<boolean> {
  const entry = await db.query.anonIdentityVault.findFirst({
    where: eq(anonIdentityVault.handle, handle),
    columns: { sealedIdentity: true },
  });
  if (!entry) return false;
  try {
    return openSealedIdentity(entry.sealedIdentity) !== profileId;
  } catch {
    return true;
  }
}
