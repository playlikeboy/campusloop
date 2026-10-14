import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { platformSettings } from "@/db/schema";
import { getRedis } from "@/lib/redis";

const SETTING_KEY = "show_seeded_posts";
const REDIS_KEY = "platform:config:show_seeded_posts";

// In-memory process cache with short TTL (10 seconds) for ultra-fast checks during SSR and requests
let cachedValue: boolean | null = null;
let cacheExpiry = 0;

export async function getShowSeededPosts(): Promise<boolean> {
  const now = Date.now();
  if (cachedValue !== null && now < cacheExpiry) {
    return cachedValue;
  }

  // 1. Try Redis (sub-5ms)
  try {
    const redis = getRedis();
    if (redis) {
      const val = await redis.get<string | boolean>(REDIS_KEY);
      if (val !== null && val !== undefined) {
        const boolVal = val === true || val === "true" || val === "1";
        cachedValue = boolVal;
        cacheExpiry = now + 10_000;
        return boolVal;
      }
    }
  } catch {
    // Non-fatal Redis fallback
  }

  // 2. Try Postgres
  try {
    const db = getDb();
    const row = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.key, SETTING_KEY),
    });

    if (row) {
      const boolVal = row.value === "true" || row.value === "1";
      cachedValue = boolVal;
      cacheExpiry = now + 10_000;
      return boolVal;
    }
  } catch {
    // Table or DB fallback
  }

  // Default: true (active as requested by user)
  cachedValue = true;
  cacheExpiry = now + 10_000;
  return true;
}

export async function setShowSeededPosts(enabled: boolean): Promise<boolean> {
  const valueStr = enabled ? "true" : "false";
  cachedValue = enabled;
  cacheExpiry = Date.now() + 10_000;

  // 1. Write to Postgres
  try {
    const db = getDb();
    await db
      .insert(platformSettings)
      .values({
        key: SETTING_KEY,
        value: valueStr,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: {
          value: valueStr,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("[PlatformConfig] Failed to save setting in Postgres:", err);
  }

  // 2. Write to Redis
  try {
    const redis = getRedis();
    if (redis) {
      await redis.set(REDIS_KEY, valueStr);
    }
  } catch (err) {
    console.error("[PlatformConfig] Failed to save setting in Redis:", err);
  }

  return enabled;
}
