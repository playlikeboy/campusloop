import { getRedis } from "@/lib/redis";

/**
 * Fixed-window limiter for Admin -> Emails actions and the unsubscribe route
 * (server actions are not covered by the /api/* middleware limits).
 * Redis when configured, otherwise per-isolate memory.
 */
const memory = new Map<string, { count: number; expiresAt: number }>();

function memoryHit(key: string, max: number, windowSec: number): boolean {
  const now = Date.now();
  if (memory.size > 2000) {
    for (const [k, v] of memory) if (v.expiresAt <= now) memory.delete(k);
  }
  const entry = memory.get(key);
  if (!entry || entry.expiresAt <= now) {
    memory.set(key, { count: 1, expiresAt: now + windowSec * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

/** Returns true when the call is allowed. */
export async function allowEmailAction(key: string, max: number, windowSec: number): Promise<boolean> {
  const fullKey = `rl:email:${key}`;
  const redis = getRedis();
  if (redis) {
    try {
      const [count] = await redis.pipeline().incr(fullKey).expire(fullKey, windowSec, "NX").exec<[number, number]>();
      return Number(count) <= max;
    } catch {
      // fall through to memory
    }
  }
  return memoryHit(fullKey, max, windowSec);
}
