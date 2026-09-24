import { getRedis } from "@/lib/redis";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export async function rateLimit(
  key: string,
  options: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const limit = Math.max(1, Math.floor(options.limit));
  const windowSeconds = Math.max(1, Math.floor(options.windowSeconds));
  const retryAt = () => {
    const windowId = Math.floor(Date.now() / 1000 / windowSeconds);
    const resetAtMs = (windowId + 1) * windowSeconds * 1000;
    return Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000));
  };

  const redis = getRedis();
  if (!redis) {
    return { allowed: true, limit, remaining: limit, retryAfterSeconds: 0 };
  }

  try {
    const windowId = Math.floor(Date.now() / 1000 / windowSeconds);
    const redisKey = `ratelimit:v1:${key}:${windowId}`;
    const count = await redis.incr(redisKey);

    // Refresh expiry on every hit so a failed first expiry cannot leave a permanent key.
    await redis.expire(redisKey, windowSeconds + 1);

    const retryAfterSeconds = retryAt();
    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: count > limit ? retryAfterSeconds : 0,
    };
  } catch (error) {
    // Rate limiting is an abuse-control layer, not a dependency for posting.
    // Redis failure must not turn a healthy write path into an outage.
    if (process.env.NODE_ENV !== "test") {
      console.warn("[RateLimit] Redis check failed; allowing request.", error);
    }
    return { allowed: true, limit, remaining: limit, retryAfterSeconds: 0 };
  }
}
