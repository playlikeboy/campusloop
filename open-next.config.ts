import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

// See https://opennext.js.org/cloudflare/caching
// - Incremental cache: R2 (`NEXT_INC_CACHE_R2_BUCKET`), fronted by the per-colo Cache API.
// - Tag cache: D1 (`NEXT_TAG_CACHE_D1`) so revalidateTag/revalidatePath work.
//   The `revalidations` table is created by `opennextjs-cloudflare populateCache remote` in CI.
// - Queue: in-memory (uses the WORKER_SELF_REFERENCE service binding), no Durable Objects.
export default defineCloudflareConfig({
	incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
	tagCache: d1NextTagCache,
	queue: memoryQueue,
});
