/**
 * Tiny TTL cache held in module scope. Workers reuse an isolate across many
 * requests, so this removes repeat round trips for hot, slowly-changing data
 * (viewer affinity, profile rows) even when Redis is unavailable.
 * Bounded so a busy isolate can't grow it without limit.
 */
export class IsolateCache<V> {
  private store = new Map<string, { value: V; expires: number }>();

  constructor(
    private ttlMs: number,
    private maxEntries = 500
  ) {}

  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V): void {
    if (this.store.size >= this.maxEntries) {
      // Map keeps insertion order: drop the oldest entry.
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}
