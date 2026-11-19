import { eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";

/** Resolves a profile by id or username (leading @ allowed). */
export async function findTargetProfile(idOrUsername: string) {
  const key = decodeURIComponent(idOrUsername).replace(/^@/, "").trim();
  if (!key || key.length > 100) return null;
  return (
    (await getDb().query.userProfiles.findFirst({
      where: or(eq(userProfiles.id, key), eq(userProfiles.username, key), eq(userProfiles.username, key.toLowerCase())),
      columns: { id: true, username: true, displayName: true, avatarUrl: true },
    })) ?? null
  );
}
