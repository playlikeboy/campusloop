import { getRedis } from "@/lib/redis";

/** Fixed-window limiter for OAuth endpoints. Without Redis it allows the request (fail open, like the rest of the app). */
export async function allow(key: string, max: number, windowSec: number): Promise<boolean> {
  const r = getRedis();
  if (!r) return true;
  try {
    const k = `rl:oauth:${key}`;
    const n = Number(await r.incr(k));
    if (n === 1) await r.expire(k, windowSec);
    return n <= max;
  } catch {
    return true;
  }
}

export function clientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
